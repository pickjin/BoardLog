import React from 'react';
import { Trophy, Clock, Calendar, MapPin, Users, Star, Camera } from 'lucide-react';
import { PlayRecord } from '../types';
import { formatDuration } from '../utils/formatters';
import { applyImageFallback } from '../utils/imageFallback';

interface PlayCardProps {
  play: PlayRecord;
  onClick: () => void;
}

export const PlayCard: React.FC<PlayCardProps> = ({ play, onClick }) => {
  return (
    <div
      id={`play-card-${play.id}`}
      onClick={onClick}
      className="group bg-white rounded-[28px] border border-[#E9ECEF] p-4.5 shadow-sm hover:shadow-md hover:border-[#4834D4]/30 transition-all cursor-pointer space-y-3.5"
    >
      {/* Header: Date, Location & My Result Pill */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-[#A8ABAF] font-medium tracking-tight">
          <Calendar className="w-3.5 h-3.5" />
          <span>{play.date}</span>
          {play.location && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-[#636E72] truncate max-w-[120px]">
                <MapPin className="w-3 h-3 text-[#A8ABAF]" />
                {play.location}
              </span>
            </>
          )}
        </div>

        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
            play.myResult === '승리'
              ? 'bg-[#EBFAEF] text-[#27AE60] border-[#27AE60]/30'
              : play.myResult === '패배'
              ? 'bg-[#FEEBEC] text-[#EB4D4B] border-[#EB4D4B]/30'
              : 'bg-[#F1F3F5] text-[#636E72] border-[#E9ECEF]'
          }`}
        >
          {play.myResult === '승리' ? '👑 내 승리' : play.myResult}
        </span>
      </div>

      {/* Main Game Info */}
      <div className="flex items-center gap-3.5">
        <div className="w-14 h-14 rounded-2xl bg-[#F8F9FA] overflow-hidden shrink-0 border border-[#E9ECEF]">
          <img
            src={play.gameImageUrl || 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80'}
            alt={play.gameTitle}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            onError={applyImageFallback}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-[#1E272E] truncate group-hover:text-[#4834D4] transition-colors">
            {play.gameTitle}
          </h3>
          <div className="flex items-center gap-2 text-[11px] text-[#636E72] mt-0.5">
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3 text-[#A8ABAF]" />
              {formatDuration(play.durationMinutes)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-0.5">
              <Users className="w-3 h-3 text-[#A8ABAF]" />
              {play.participants.length}명
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-0.5 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < play.rating ? 'text-amber-400 fill-amber-400' : 'text-[#E9ECEF]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Participants & Winners chips */}
      <div className="pt-2.5 border-t border-[#E9ECEF] flex items-center justify-between text-xs">
        <div className="flex flex-wrap gap-1.5 items-center">
          {play.participants.slice(0, 4).map((p) => (
            <span
              key={p.id}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${
                p.isWinner
                  ? 'bg-[#4834D4]/10 text-[#4834D4] font-bold border border-[#4834D4]/20'
                  : 'bg-[#F1F3F5] text-[#636E72]'
              }`}
            >
              {p.isWinner && '👑 '}
              {p.name}
              {p.score !== null && <span className="opacity-70 font-normal">({p.score}점)</span>}
            </span>
          ))}
          {play.participants.length > 4 && (
            <span className="text-[10px] text-[#A8ABAF] font-medium">
              +{play.participants.length - 4}명
            </span>
          )}
        </div>

        {play.photos && play.photos.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-[#636E72] bg-[#F1F3F5] px-2 py-0.5 rounded-full font-bold shrink-0 ml-2 border border-[#E9ECEF]">
            <Camera className="w-3 h-3 text-[#A8ABAF]" />
            <span>{play.photos.length}</span>
          </div>
        )}
      </div>

      {/* Review preview */}
      {play.review && (
        <p className="text-[11px] text-[#636E72] bg-[#F8F9FA] p-2.5 rounded-2xl border border-[#E9ECEF] line-clamp-2 leading-relaxed italic">
          "{play.review}"
        </p>
      )}
    </div>
  );
};

