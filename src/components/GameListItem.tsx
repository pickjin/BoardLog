import React from 'react';
import { Users, Clock, Flame, CheckSquare, Trash2 } from 'lucide-react';
import { UserGame } from '../types';
import { getOwnershipBadgeColor } from './GameCard';
import { applyImageFallback } from '../utils/imageFallback';

interface GameListItemProps {
  game: UserGame;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export const GameListItem: React.FC<GameListItemProps> = ({ game, onClick, onDelete }) => {
  return (
    <div
      id={`game-list-item-${game.id}`}
      onClick={onClick}
      className="group bg-white rounded-2xl border border-[#E9ECEF] p-3.5 shadow-sm hover:border-[#4834D4]/30 hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5"
    >
      {/* Thumbnail */}
      <div className="relative w-16 h-16 rounded-xl bg-[#F8F9FA] overflow-hidden shrink-0 border border-[#E9ECEF]">
        <img
          src={game.imageUrl || 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80'}
          alt={game.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          onError={applyImageFallback}
        />
      </div>

      {/* Center content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${getOwnershipBadgeColor(
              game.ownershipStatus
            )}`}
          >
            {game.ownershipStatus}
          </span>
          <h4 className="text-xs font-black text-[#1E272E] truncate group-hover:text-[#4834D4] transition-colors">
            {game.title}
          </h4>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-[#636E72]">
          <span className="flex items-center gap-0.5">
            <Users className="w-3 h-3 text-[#A8ABAF]" />
            {game.minPlayers === game.maxPlayers ? `${game.minPlayers}인` : `${game.minPlayers}~${game.maxPlayers}인`}
          </span>
          <span>•</span>
          <span className="flex items-center gap-0.5">
            <Clock className="w-3 h-3 text-[#A8ABAF]" />
            {game.playTime}분
          </span>
          {game.weight > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-[#4834D4] font-bold">
                <Flame className="w-3 h-3" />
                {game.weight.toFixed(1)}
              </span>
            </>
          )}
        </div>

        {game.storageLocation && (
          <p className="text-[9px] text-[#A8ABAF] truncate mt-0.5">📍 {game.storageLocation}</p>
        )}
      </div>

      {/* Right stats & Actions */}
      <div className="text-right shrink-0 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#636E72] bg-[#F1F3F5] px-2.5 py-1 rounded-full border border-[#E9ECEF]">
          <CheckSquare className="w-3 h-3 text-[#4834D4]" />
          {game.playCount || 0}회
        </span>

        {onDelete && (
          <button
            type="button"
            title="게임 삭제"
            onClick={onDelete}
            className="w-7 h-7 rounded-full text-[#A8ABAF] hover:text-[#EB4D4B] hover:bg-[#FEEBEC] flex items-center justify-center transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

