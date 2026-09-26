import { GoogleGenAI, Type } from '@google/genai';

/**
 * Model ids retire while still appearing in the account's model list, so a single
 * hardcoded id eventually stops working. GEMINI_MODEL wins when set; otherwise these
 * are tried in order, starting with the alias that tracks the current flash release.
 */
const MODEL_CANDIDATES = (process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []).concat([
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-2.5-flash'
]);
const MODEL = MODEL_CANDIDATES[0];
const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const PROMPT = `You are reading photographs of physical board game boxes, usually stacked or shelved together.

Identify every distinct board game box you can see and report the product title printed on it.

Text orientation varies. Handle all three of these:
- Horizontal text printed across a box face.
- Vertically stacked characters, each one below the previous.
- Horizontal text on a box standing on its edge, so the title reads rotated 90 degrees clockwise or counter-clockwise (spine text).

Rules:
- Report the title exactly as printed, in its original language. Keep Korean titles in Korean.
- When a box shows both a Korean and an English title, put the Korean one in "title" and the English one in "titleEn".
- One entry per physical box. Never merge two boxes, never split one box into two.
- Ignore publisher names, taglines, player-count badges, age ratings, awards, barcodes and expansion banners.
- When a title is partly hidden or blurred, report what is legible and lower the confidence.
- Report no board game boxes as an empty list rather than guessing.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    detections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Title as printed on the box' },
          titleEn: { type: Type.STRING, description: 'English title when the box also shows one' },
          orientation: {
            type: Type.STRING,
            enum: ['horizontal', 'vertical', 'rotated'],
            description: 'How the title text was oriented in the photo'
          },
          confidence: { type: Type.NUMBER, description: '0 to 1' }
        },
        required: ['title', 'orientation', 'confidence']
      }
    }
  },
  required: ['detections']
};

/**
 * The provider reports a bad key, a disabled API and an unavailable model all as one
 * failed call, and each needs a different fix. The raw text stays in the log; only the
 * classification is returned.
 */
function classifyProviderError(err: unknown): { status: number; error: string; reason: string } {
  const text = (err instanceof Error ? err.message : String(err)).toLowerCase();

  if (text.includes('api key not valid') || text.includes('api_key_invalid') || text.includes('invalid api key')) {
    return {
      status: 502,
      reason: 'INVALID_KEY',
      error: 'Gemini API 키가 올바르지 않습니다. 키를 다시 발급받아 등록해주세요.'
    };
  }
  if (text.includes('permission_denied') || text.includes('has not been used') || text.includes('is disabled')) {
    return {
      status: 502,
      reason: 'API_DISABLED',
      error: '구글 프로젝트에서 Generative Language API가 켜져 있지 않습니다.'
    };
  }
  if (text.includes('not_found') || text.includes('not found')) {
    return {
      status: 502,
      reason: 'MODEL_NOT_FOUND',
      error: `시도한 모델(${MODEL_CANDIDATES.join(', ')})을 모두 쓸 수 없습니다. 아래 목록에서 하나를 골라 GEMINI_MODEL 환경변수로 지정해주세요.`
    };
  }
  if (text.includes('resource_exhausted') || text.includes('quota') || text.includes('rate limit')) {
    return {
      status: 429,
      reason: 'RATE_LIMITED',
      error: '사용 한도를 넘었습니다. 잠시 후 다시 시도해주세요.'
    };
  }
  if (text.includes('location') || text.includes('region') || text.includes('user location')) {
    return {
      status: 502,
      reason: 'REGION_BLOCKED',
      error: '현재 지역에서는 이 모델을 쓸 수 없습니다.'
    };
  }
  // The provider's HTTP status separates the remaining causes without echoing its text back.
  const status = (err as { status?: unknown }).status;
  const fromMessage = /\b(4\d{2}|5\d{2})\b/.exec(text);
  const upstream = typeof status === 'number' ? String(status) : fromMessage?.[1];

  // Unclassified failures have no other route to whoever can fix them: the log is not
  // reachable from the app. Truncated, and only on this branch.
  const detail = (err instanceof Error ? err.message : String(err)).slice(0, 300);

  return {
    status: 502,
    reason: upstream ? `UNKNOWN_${upstream}` : 'UNKNOWN',
    error: `사진 인식에 실패했습니다.${upstream ? ` (구글 응답 코드 ${upstream})` : ''}\n\n${detail}`
  };
}

/**
 * Model ids move over time, so a not-found answer is more useful with the list of ids
 * this key can actually reach: one of them goes straight into GEMINI_MODEL.
 */
async function listUsableModels(apiKey: string): Promise<string[]> {
  try {
    const pager = await new GoogleGenAI({ apiKey }).models.list();
    const names: string[] = [];
    for await (const model of pager) {
      const actions = model.supportedActions;
      const usable = !actions || actions.length === 0 || actions.includes('generateContent');
      if (model.name && usable) names.push(model.name.replace(/^models\//, ''));
      if (names.length >= 40) break;
    }
    return names;
  } catch (err) {
    console.error('scan-games model listing failed', err);
    return [];
  }
}

interface IncomingImage {
  data: string;
  mimeType: string;
}

interface HandlerRequest {
  method?: string;
  body?: unknown;
}

interface HandlerResponse {
  status(code: number): HandlerResponse;
  json(payload: unknown): void;
}

function readImages(body: unknown): IncomingImage[] | string {
  if (typeof body !== 'object' || body === null) return '요청 형식이 올바르지 않습니다.';
  const raw = (body as { images?: unknown }).images;
  if (!Array.isArray(raw) || raw.length === 0) return '이미지가 없습니다.';
  if (raw.length > MAX_IMAGES) return `사진은 한 번에 ${MAX_IMAGES}장까지 보낼 수 있습니다.`;

  const images: IncomingImage[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) return '이미지 형식이 올바르지 않습니다.';
    const { data, mimeType } = entry as { data?: unknown; mimeType?: unknown };
    if (typeof data !== 'string' || typeof mimeType !== 'string') {
      return '이미지 형식이 올바르지 않습니다.';
    }
    if (!ALLOWED_MIME.includes(mimeType)) {
      return '지원되지 않는 이미지 형식입니다. (JPG, PNG, WebP)';
    }
    // base64 inflates by 4/3, so this bounds the decoded size.
    if (data.length * 0.75 > MAX_IMAGE_BYTES) {
      return '이미지 용량이 너무 큽니다.';
    }
    images.push({ data, mimeType });
  }
  return images;
}

export default async function handler(req: HandlerRequest, res: HandlerResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: '허용되지 않은 요청입니다.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Surfaced as a setup problem, not a user error: the deployment is missing its key.
    res.status(503).json({ error: '사진 인식 기능이 아직 설정되지 않았습니다.', code: 'NOT_CONFIGURED' });
    return;
  }

  const images = readImages(req.body);
  if (typeof images === 'string') {
    res.status(400).json({ error: images });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  const contents = [
    {
      role: 'user',
      parts: [
        { text: PROMPT },
        ...images.map((image) => ({
          inlineData: { mimeType: image.mimeType, data: image.data }
        }))
      ]
    }
  ];

  let lastError: unknown = null;
  for (const model of MODEL_CANDIDATES) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0
        }
      });

      const text = result.text;
      if (!text) {
        res.status(502).json({ error: '사진에서 게임 이름을 읽지 못했습니다. 다시 시도해주세요.' });
        return;
      }

      const parsed = JSON.parse(text) as { detections?: unknown };
      const detections = Array.isArray(parsed.detections) ? parsed.detections : [];
      res.status(200).json({ detections, model });
      return;
    } catch (err) {
      console.error(`scan-games failed on ${model}`, err);
      lastError = err;
      // Only a missing model is worth another id; a bad key or spent quota fails the same way every time.
      if (classifyProviderError(err).reason !== 'MODEL_NOT_FOUND') break;
    }
  }

  const { status, error, reason } = classifyProviderError(lastError);
  if (reason === 'MODEL_NOT_FOUND') {
    res.status(status).json({ error, reason, available: await listUsableModels(apiKey) });
    return;
  }
  res.status(status).json({ error, reason });
}
