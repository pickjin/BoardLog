import React, { useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Loader2, AlertCircle, Check, RotateCw, ArrowDown, ArrowRight } from 'lucide-react';
import { UserGame } from '../types';
import { formatDate } from '../utils/formatters';
import {
  scanGamePhotos,
  ScanCandidate,
  ScanNotConfiguredError,
  TitleOrientation,
  MAX_SCAN_IMAGES
} from '../services/gameScanner';
import { normalizeTitle } from '../utils/titleMatch';

type NewGame = Omit<UserGame, 'id' | 'createdAt' | 'updatedAt'>;

/** Applied to a title the seed list does not contain, so the card is usable before it is filled in. */
const UNMATCHED_DEFAULTS = {
  genre: ['미분류'],
  minPlayers: 1,
  maxPlayers: 4,
  recommendedAge: 8,
  playTime: 30,
  weight: 2.0,
  notes: '사진으로 등록했습니다. 상세 정보를 채워주세요.'
} as const;

const ORIENTATION_LABEL: Record<TitleOrientation, { text: string; Icon: typeof ArrowRight }> = {
  horizontal: { text: '가로', Icon: ArrowRight },
  vertical: { text: '세로', Icon: ArrowDown },
  rotated: { text: '세워짐', Icon: RotateCw }
};

interface GameScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingGames: UserGame[];
  onRegister: (games: NewGame[]) => Promise<void>;
}

export const GameScanModal: React.FC<GameScanModalProps> = ({
  isOpen,
  onClose,
  existingGames,
  onRegister
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ScanCandidate[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [excluded, setExcluded] = useState<Record<string, boolean>>({});

  const ownedTitles = useMemo(
    () => new Set(existingGames.map((g) => normalizeTitle(g.title))),
    [existingGames]
  );

  const reset = useCallback(() => {
    setCandidates([]);
    setTitles({});
    setExcluded({});
    setError(null);
    setIsScanning(false);
    setIsSaving(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleFiles = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files;
    const files: File[] = [];
    for (let i = 0; i < (picked?.length ?? 0); i += 1) {
      const file = picked?.item(i);
      if (file) files.push(file);
    }
    event.target.value = '';
    if (files.length === 0) return;

    setIsScanning(true);
    setError(null);
    setCandidates([]);
    try {
      const found = await scanGamePhotos(files);
      if (found.length === 0) {
        setError('사진에서 보드게임 박스를 찾지 못했습니다. 제목이 보이도록 다시 찍어주세요.');
      }
      setCandidates(found);
      setTitles(Object.fromEntries(found.map((c) => [c.id, c.match?.game.title ?? c.detection.title])));
    } catch (err) {
      setError(
        err instanceof ScanNotConfiguredError || err instanceof Error
          ? err.message
          : '사진 인식에 실패했습니다.'
      );
    } finally {
      setIsScanning(false);
    }
  }, []);

  const selected = useMemo(
    () => candidates.filter((c) => !excluded[c.id] && (titles[c.id] ?? '').trim().length > 0),
    [candidates, excluded, titles]
  );

  const handleRegister = useCallback(async () => {
    if (selected.length === 0) return;
    setIsSaving(true);
    setError(null);

    const games: NewGame[] = selected.map((candidate) => {
      const title = (titles[candidate.id] ?? '').trim();
      const seed = candidate.match?.game;
      return {
        title,
        titleEn: seed?.titleEn ?? candidate.detection.titleEn ?? '',
        imageUrl: seed?.imageUrl ?? '',
        genre: seed ? [...seed.genre] : [...UNMATCHED_DEFAULTS.genre],
        minPlayers: seed?.minPlayers ?? UNMATCHED_DEFAULTS.minPlayers,
        maxPlayers: seed?.maxPlayers ?? UNMATCHED_DEFAULTS.maxPlayers,
        bestPlayers: seed?.bestPlayers ?? '',
        recommendedAge: seed?.recommendedAge ?? UNMATCHED_DEFAULTS.recommendedAge,
        playTime: seed?.playTime ?? UNMATCHED_DEFAULTS.playTime,
        weight: seed?.weight ?? UNMATCHED_DEFAULTS.weight,
        publisher: seed?.publisher ?? '',
        purchaseDate: formatDate(),
        purchasePrice: 0,
        originalPrice: 0,
        marketPrice: 0,
        storageLocation: '',
        condition: '상',
        tags: seed ? [...seed.genre] : [...UNMATCHED_DEFAULTS.genre],
        notes: seed?.description ?? UNMATCHED_DEFAULTS.notes,
        ownershipStatus: '보유중',
        playCount: 0,
        priceMeta: { source: '사진 인식 등록', verifiedDate: formatDate(), isManual: false }
      };
    });

    try {
      await onRegister(games);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  }, [selected, titles, onRegister, reset, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="bg-white w-full sm:max-w-lg rounded-t-[28px] sm:rounded-[28px] max-h-[92vh] flex flex-col shadow-2xl"
          >
            <div className="flex items-start justify-between p-4 sm:p-6 border-b border-[#E9ECEF] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#4834D4]/10 text-[#4834D4] flex items-center justify-center">
                  <Camera className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#1E272E]">사진으로 일괄 등록</h2>
                  <p className="text-[11px] text-[#636E72]">
                    책장 사진을 올리면 박스 제목을 읽어 한 번에 등록합니다
                  </p>
                </div>
              </div>
              <button
                id="scan-modal-close-btn"
                type="button"
                onClick={handleClose}
                className="p-1.5 text-[#A8ABAF] hover:text-[#1E272E] rounded-full hover:bg-[#F1F3F5] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              <input
                id="scan-file-input"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFiles}
                className="hidden"
              />

              {candidates.length === 0 && !isScanning && (
                <button
                  id="scan-pick-photos-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-10 border-2 border-dashed border-[#E9ECEF] hover:border-[#4834D4] rounded-[24px] flex flex-col items-center gap-2 transition-colors"
                >
                  <Camera className="w-7 h-7 text-[#A8ABAF]" />
                  <span className="text-xs font-bold text-[#1E272E]">사진 선택 (최대 {MAX_SCAN_IMAGES}장)</span>
                  <span className="text-[11px] text-[#636E72]">
                    가로·세로로 쓰인 제목, 세워둔 박스 모두 인식합니다
                  </span>
                </button>
              )}

              {isScanning && (
                <div className="py-12 flex flex-col items-center gap-3">
                  <Loader2 className="w-7 h-7 text-[#4834D4] animate-spin" />
                  <span className="text-xs font-bold text-[#1E272E]">사진에서 게임 이름을 읽는 중…</span>
                  <span className="text-[11px] text-[#636E72]">10초 정도 걸릴 수 있습니다</span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-[#FDECEA] border border-[#F5C6C2] rounded-2xl">
                  <AlertCircle className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#C0392B] leading-relaxed whitespace-pre-line break-all">
                    {error}
                  </p>
                </div>
              )}

              {candidates.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1E272E]">
                      {candidates.length}개 인식 · {selected.length}개 선택됨
                    </span>
                    <button
                      id="scan-rescan-btn"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-bold text-[#4834D4] hover:underline"
                    >
                      다시 찍기
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {candidates.map((candidate) => {
                      const title = titles[candidate.id] ?? '';
                      const isOff = !!excluded[candidate.id];
                      const owned = ownedTitles.has(normalizeTitle(title));
                      const { text: orientText, Icon: OrientIcon } =
                        ORIENTATION_LABEL[candidate.detection.orientation];

                      return (
                        <div
                          key={candidate.id}
                          className={`p-3 rounded-[20px] border transition-colors ${
                            isOff ? 'border-[#E9ECEF] bg-[#F8F9FA] opacity-60' : 'border-[#E9ECEF] bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <button
                              type="button"
                              aria-label={isOff ? '등록 포함' : '등록 제외'}
                              onClick={() =>
                                setExcluded((prev) => ({ ...prev, [candidate.id]: !prev[candidate.id] }))
                              }
                              className={`w-5 h-5 mt-0.5 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                                isOff
                                  ? 'border-[#CED4DA] bg-white'
                                  : 'border-[#4834D4] bg-[#4834D4] text-white'
                              }`}
                            >
                              {!isOff && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <input
                                id={`scan-title-${candidate.id}`}
                                type="text"
                                value={title}
                                onChange={(e) =>
                                  setTitles((prev) => ({ ...prev, [candidate.id]: e.target.value }))
                                }
                                className="w-full px-2.5 py-1.5 bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl text-xs font-bold text-[#1E272E] focus:outline-hidden focus:border-[#4834D4] transition-colors"
                              />

                              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                                {candidate.match ? (
                                  <span className="px-2 py-0.5 bg-[#E8F3ED] text-[#1B6B43] rounded-full text-[10px] font-bold">
                                    시드 매칭 {Math.round(candidate.match.score * 100)}%
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-[#FBF3E2] text-[#8A6516] rounded-full text-[10px] font-bold">
                                    새 게임 · 정보 비어 있음
                                  </span>
                                )}
                                <span className="px-2 py-0.5 bg-[#F1F3F5] text-[#636E72] rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                  <OrientIcon className="w-2.5 h-2.5" />
                                  {orientText}
                                </span>
                                {owned && (
                                  <span className="px-2 py-0.5 bg-[#FDECEA] text-[#C0392B] rounded-full text-[10px] font-bold">
                                    이미 보유 중
                                  </span>
                                )}
                              </div>

                              {candidate.detection.title !== title && (
                                <p className="text-[10px] text-[#A8ABAF] mt-1">
                                  사진에서 읽은 값: {candidate.detection.title}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {candidates.length > 0 && (
              <div className="p-4 sm:p-6 border-t border-[#E9ECEF] flex gap-2.5 shrink-0">
                <button
                  id="scan-cancel-btn"
                  type="button"
                  onClick={handleClose}
                  disabled={isSaving}
                  className="px-4 py-3 rounded-full text-xs font-bold text-[#636E72] hover:bg-[#F1F3F5] transition-colors disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  id="scan-register-btn"
                  type="button"
                  onClick={handleRegister}
                  disabled={isSaving || selected.length === 0}
                  className="flex-1 py-3 bg-[#4834D4] text-white rounded-full text-xs font-bold shadow-[0_4px_14px_rgba(72,52,212,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 inline-flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? '등록 중…' : `${selected.length}개 등록하기`}</span>
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
