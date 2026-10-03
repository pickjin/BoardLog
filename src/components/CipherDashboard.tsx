import { useState, useEffect, useRef } from 'react';
import {
  Key,
  Scroll,
  Lock,
  Unlock,
  Search,
  BookOpen,
  Sparkles,
  Trophy,
  ChevronUp,
  ChevronDown,
  Gem,
  CheckCircle2,
  XCircle
} from 'lucide-react';

/**
 * Standalone prototype — not wired into routing or storage.ts.
 * EXP/hint state here is local demo state, not persisted play-log data.
 */

interface GameEntry {
  id: string;
  title: string;
  playCount: number;
}

interface Toast {
  id: number;
  gameId: string;
  text: string;
}

const HINT_POOL = [
  '지도의 파편 조각',
  "낡은 양피지에 적힌 숫자 '7'",
  '촛불 아래 드러난 문양',
  '고서 속에 숨겨진 좌표',
  '봉인된 인장의 절반',
  '달빛에만 보이는 잉크 자국'
];

const SECRET_CODE = [1, 8, 4, 2];
const EXP_PER_LOG = 20;
const EXP_PER_LEVEL = 100;
const HINT_DROP_CHANCE = 0.4;

export default function CipherDashboard() {
  const [games, setGames] = useState<GameEntry[]>([
    { id: 'gloomhaven', title: '글룸헤이븐', playCount: 7 },
    { id: 'terraforming-mars', title: '테라포밍 마스', playCount: 4 },
    { id: 'arkham-horror-lcg', title: '아캄 호러: 카드게임', playCount: 12 },
    { id: 'splendor', title: '스플렌더', playCount: 3 }
  ]);

  const [level, setLevel] = useState(3);
  const [exp, setExp] = useState(42);
  const [hintPieces, setHintPieces] = useState(2);
  const [hints, setHints] = useState<string[]>(['지도의 파편 조각', "낡은 양피지에 적힌 숫자 '7'"]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [leveledUp, setLeveledUp] = useState(false);

  const [dialDigits, setDialDigits] = useState([0, 0, 0, 0]);
  const [cipherResult, setCipherResult] = useState<'idle' | 'success' | 'fail'>('idle');

  const toastIdRef = useRef(0);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => setToasts((prev) => prev.filter((p) => p.id !== t.id)), 1800)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  function pushToast(gameId: string, text: string) {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, gameId, text }]);
  }

  function handleLogPlay(gameId: string) {
    setGames((prev) => prev.map((g) => (g.id === gameId ? { ...g, playCount: g.playCount + 1 } : g)));

    let gainedHint = false;
    if (Math.random() < HINT_DROP_CHANCE) {
      const unused = HINT_POOL.filter((h) => !hints.includes(h));
      const pick = unused.length > 0 ? unused[Math.floor(Math.random() * unused.length)] : null;
      if (pick) {
        setHints((prev) => [...prev, pick]);
        setHintPieces((prev) => prev + 1);
        gainedHint = true;
      }
    }

    setExp((prevExp) => {
      const next = prevExp + EXP_PER_LOG;
      if (next >= EXP_PER_LEVEL) {
        setLevel((l) => l + 1);
        setLeveledUp(true);
        setTimeout(() => setLeveledUp(false), 2200);
        return next - EXP_PER_LEVEL;
      }
      return next;
    });

    pushToast(gameId, gainedHint ? `+${EXP_PER_LOG} EXP · 힌트 조각 발견!` : `+${EXP_PER_LOG} EXP`);
  }

  function setDigit(index: number, delta: number) {
    setDialDigits((prev) => {
      const next = [...prev];
      next[index] = (next[index] + delta + 10) % 10;
      return next;
    });
    setCipherResult('idle');
  }

  function attemptDecode() {
    const correct = dialDigits.every((d, i) => d === SECRET_CODE[i]);
    setCipherResult(correct ? 'success' : 'fail');
  }

  const canAttemptCipher = hintPieces >= 3;
  const expPct = Math.min(100, Math.round((exp / EXP_PER_LEVEL) * 100));
  const latestHint = hints.length > 0 ? hints[hints.length - 1] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-slate-950 to-stone-950 text-orange-100 font-sans px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* ── Header ── */}
        <header className="flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-amber-500" strokeWidth={1.75} />
          <div>
            <h1 className="font-serif text-2xl tracking-wide text-amber-100">보드로그 비밀 결사</h1>
            <p className="text-xs text-orange-200/50">The Archivist's Chamber</p>
          </div>
        </header>

        {/* ── Status Bar ── */}
        <section className="relative overflow-hidden rounded-xl border border-amber-700/40 bg-black/40 p-5 shadow-[0_0_30px_-10px_rgba(217,119,6,0.3)] backdrop-blur-sm">
          {leveledUp && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="flex items-center gap-2 font-serif text-xl text-amber-400">
                <Sparkles className="h-6 w-6 animate-pulse" />
                LEVEL UP — Lv.{level}
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-amber-500/60 bg-gradient-to-br from-amber-900/40 to-stone-900 font-serif text-lg text-amber-300">
                Lv.{level}
              </div>
              <div className="min-w-[200px]">
                <div className="mb-1 flex items-center justify-between text-xs text-orange-200/60">
                  <span>EXP</span>
                  <span>
                    {exp} / {EXP_PER_LEVEL}
                  </span>
                </div>
                <div className="relative h-2.5 w-56 overflow-hidden rounded-full bg-stone-800 ring-1 ring-amber-900/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-700 via-amber-500 to-yellow-400 transition-all duration-700 ease-out"
                    style={{ width: `${expPct}%` }}
                  />
                </div>
              </div>
              <Key
                className={`h-6 w-6 shrink-0 transition-all duration-500 ${
                  expPct >= 100 ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]' : 'text-stone-600'
                }`}
                strokeWidth={1.75}
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-amber-700/30 bg-stone-900/60 px-4 py-2">
              <Gem className="h-5 w-5 text-amber-400" strokeWidth={1.75} />
              <span className="font-serif text-lg text-amber-200">{hintPieces}</span>
              <span className="text-xs text-orange-200/50">힌트 조각</span>
            </div>
          </div>
        </section>

        {/* ── My Collection ── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Scroll className="h-5 w-5 text-amber-500" strokeWidth={1.75} />
            <h2 className="font-serif text-lg text-amber-100">나의 소장품</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {games.map((game) => {
              const toast = toasts.find((t) => t.gameId === game.id);
              return (
                <div
                  key={game.id}
                  className="relative overflow-hidden rounded-lg border border-amber-800/30 bg-black/40 p-4 transition-colors hover:border-amber-600/50"
                >
                  {toast && (
                    <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 animate-bounce whitespace-nowrap rounded-full bg-amber-500/90 px-2.5 py-0.5 text-[11px] font-medium text-stone-950 shadow">
                      {toast.text}
                    </div>
                  )}

                  <h3 className="font-serif text-base text-orange-100">{game.title}</h3>
                  <p className="mt-0.5 text-xs text-orange-200/50">{game.playCount}회 플레이</p>

                  <button
                    onClick={() => handleLogPlay(game.id)}
                    className="group mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-amber-600/40 bg-gradient-to-b from-amber-900/40 to-stone-900/60 py-2 text-sm text-amber-200 transition-all hover:border-amber-400/70 hover:from-amber-800/50 hover:text-amber-100 active:scale-[0.98]"
                  >
                    <Lock className="h-3.5 w-3.5 transition-transform group-hover:hidden" strokeWidth={2} />
                    <Unlock className="hidden h-3.5 w-3.5 transition-transform group-hover:block" strokeWidth={2} />
                    기록하기
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── The Cipher Room ── */}
        <section className="rounded-xl border border-amber-700/40 bg-black/40 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-amber-500" strokeWidth={1.75} />
            <h2 className="font-serif text-lg text-amber-100">비밀의 방 — The Cipher Room</h2>
          </div>

          <p className="mb-5 font-serif text-sm italic text-orange-200/70">
            {latestHint ? (
              <>
                최근 발견한 힌트: <span className="text-amber-300">"{latestHint}"</span>
              </>
            ) : (
              '아직 발견한 힌트가 없습니다. 게임을 기록해 단서를 모으세요.'
            )}
          </p>

          <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
            {/* Dial lock */}
            <div className="flex gap-3">
              {dialDigits.map((digit, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => setDigit(i, 1)}
                    className="text-amber-500/70 hover:text-amber-300"
                    aria-label="증가"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <div className="flex h-12 w-10 items-center justify-center rounded-md border border-amber-700/50 bg-stone-900 font-serif text-xl text-amber-200 shadow-inner">
                    {digit}
                  </div>
                  <button
                    onClick={() => setDigit(i, -1)}
                    className="text-amber-500/70 hover:text-amber-300"
                    aria-label="감소"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Attempt */}
            <div className="flex flex-col items-center gap-2 sm:items-end">
              <button
                onClick={attemptDecode}
                disabled={!canAttemptCipher}
                className="flex items-center gap-2 rounded-md border border-amber-500/50 bg-gradient-to-b from-amber-700/40 to-stone-900 px-5 py-2.5 text-sm font-medium text-amber-100 transition-all hover:border-amber-300 hover:from-amber-600/50 disabled:cursor-not-allowed disabled:border-stone-700 disabled:from-stone-800 disabled:text-stone-500"
              >
                <Key className="h-4 w-4" />
                해독 시도
              </button>
              {!canAttemptCipher && (
                <p className="text-xs text-orange-200/40">힌트 조각이 3개 이상 필요합니다 ({hintPieces}/3)</p>
              )}
              {cipherResult === 'success' && (
                <p className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 금고가 열렸습니다
                </p>
              )}
              {cipherResult === 'fail' && (
                <p className="flex items-center gap-1 text-xs text-red-400">
                  <XCircle className="h-3.5 w-3.5" /> 암호가 일치하지 않습니다
                </p>
              )}
            </div>
          </div>

          {hints.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-amber-900/30 pt-4">
              {hints.map((h) => (
                <span
                  key={h}
                  className="flex items-center gap-1 rounded-full border border-amber-800/40 bg-stone-900/60 px-2.5 py-1 text-[11px] text-orange-200/70"
                >
                  <Trophy className="h-3 w-3 text-amber-500" />
                  {h}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
