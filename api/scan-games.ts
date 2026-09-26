import { GoogleGenAI, Type } from '@google/genai';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
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

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: PROMPT },
            ...images.map((image) => ({
              inlineData: { mimeType: image.mimeType, data: image.data }
            }))
          ]
        }
      ],
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
    res.status(200).json({ detections });
  } catch (err) {
    // The provider's error text can carry request details, so it stays in the server log.
    console.error('scan-games failed', err);
    res.status(502).json({ error: '사진 인식에 실패했습니다. 잠시 후 다시 시도해주세요.' });
  }
}
