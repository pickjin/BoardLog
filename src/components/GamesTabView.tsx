import React from 'react';
import { UserGame, GameOwnershipStatus } from '../types';
import { PageHeading, TextLinks, SearchField, FilterTabs, EmptyNote } from './ledger';

export const OWNERSHIP_FILTERS = ['전체', '보유중', '빌려줌', '빌림', '판매예정', '판매완료', '분실', '처분'] as const;
export type OwnershipFilter = (typeof OWNERSHIP_FILTERS)[number];

interface GamesTabViewProps {
  games: UserGame[];
  filteredGames: UserGame[];
  search: string;
  onSearchChange: (value: string) => void;
  ownership: OwnershipFilter;
  onOwnershipChange: (value: OwnershipFilter) => void;
  onAddGame: () => void;
  onOpenKakaoShare: () => void;
  onOpenCatalog: () => void;
  onSelectGame: (game: UserGame) => void;
}

/** Players, length and shelf on one line; ownership only when it is not the ordinary case. */
function gameMeta(game: UserGame): string {
  const players = game.minPlayers === game.maxPlayers ? `${game.minPlayers}인` : `${game.minPlayers}~${game.maxPlayers}인`;
  const parts = [players, `${game.playTime}분`];
  if (game.storageLocation) parts.push(game.storageLocation);
  if (game.ownershipStatus !== ('보유중' as GameOwnershipStatus)) parts.push(game.ownershipStatus);
  return parts.join(' · ');
}

export const GamesTabView: React.FC<GamesTabViewProps> = ({
  games,
  filteredGames,
  search,
  onSearchChange,
  ownership,
  onOwnershipChange,
  onAddGame,
  onOpenKakaoShare,
  onOpenCatalog,
  onSelectGame
}) => (
  <div className="flex flex-col gap-6 pt-4">
    <div className="flex flex-col gap-4">
      <PageHeading
        title="내 게임"
        count={games.length}
        unit="개"
        action={{ id: 'games-add-game-btn', label: '게임 추가', onClick: onAddGame }}
      />
      <TextLinks
        links={[
          { id: 'games-kakao-share-btn', label: '카톡으로 목록 공유', onClick: onOpenKakaoShare },
          { id: 'games-print-catalog-btn', label: 'PDF 도록', onClick: onOpenCatalog }
        ]}
      />
    </div>

    <div className="flex flex-col gap-4">
      <SearchField
        id="games-search-input"
        value={search}
        onChange={onSearchChange}
        placeholder="게임명, 장르, 보관 장소"
      />
      <FilterTabs options={OWNERSHIP_FILTERS} value={ownership} onChange={onOwnershipChange} />
    </div>

    {filteredGames.length > 0 ? (
      <ul className="divide-y divide-rule border-t-2 border-ink">
        {filteredGames.map((game) => (
          <li key={game.id}>
            <button
              type="button"
              onClick={() => onSelectGame(game)}
              className="flex w-full items-center gap-4 py-4 text-left hover:bg-ink/[0.03]"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-[15px] font-semibold leading-6">{game.title}</span>
                <span className="truncate text-xs leading-4 text-graphite">{gameMeta(game)}</span>
              </span>
              <span className={`shrink-0 text-[13px] leading-5 ${game.playCount > 0 ? '' : 'text-graphite'}`}>
                <span className="font-mono">{game.playCount}</span>회
              </span>
            </button>
          </li>
        ))}
      </ul>
    ) : games.length === 0 ? (
      <EmptyNote>
        아직 등록한 게임이 없어요. 자주 하는 게임부터 하나 추가해 보세요. 박스 사진으로 여러 개를 한 번에 등록할
        수도 있어요.
      </EmptyNote>
    ) : (
      <EmptyNote>
        조건에 맞는 게임이 없어요.{' '}
        {search.trim() && (
          <button type="button" onClick={onAddGame} className="text-ink underline underline-offset-4">
            '{search.trim()}' 직접 등록
          </button>
        )}
      </EmptyNote>
    )}
  </div>
);
