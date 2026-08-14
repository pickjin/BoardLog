export type GameOwnershipStatus =
  | '보유중'
  | '빌려줌'
  | '빌림'
  | '판매예정'
  | '판매완료'
  | '분실'
  | '처분';

export type GameCondition = '미개봉' | '최상' | '상' | '중' | '하';

export interface PriceMeta {
  source: string;
  verifiedDate: string;
  isManual: boolean;
}

export interface UserGame {
  id: string;
  title: string;
  titleEn: string;
  imageUrl: string;
  genre: string[];
  minPlayers: number;
  maxPlayers: number;
  bestPlayers: string;
  recommendedAge: number;
  playTime: number; // 분
  weight: number; // 난이도 (1.0 ~ 5.0)
  publisher: string;
  purchaseDate: string; // YYYY.MM.DD
  purchasePrice: number;
  originalPrice: number;
  marketPrice: number;
  storageLocation: string;
  condition: GameCondition;
  tags: string[];
  notes: string;
  ownershipStatus: GameOwnershipStatus;
  playCount: number;
  priceMeta: PriceMeta;
  createdAt: string;
  updatedAt: string;
}

export interface PlayParticipant {
  id: string;
  name: string;
  score: number | null;
  rank: number | null;
  isWinner: boolean;
  characterOrFaction?: string;
  notes?: string;
}

export interface PlayPhoto {
  id: string;
  url: string; // compressed dataUrl or blob url
  caption: string;
  rotation: number; // 0, 90, 180, 270
}

export type MyGameResult = '승리' | '패배' | '무승부' | '참여';

export interface PlayRecord {
  id: string;
  gameId: string | null; // 내 게임 id (연동된 경우)
  gameTitle: string;
  gameImageUrl: string;
  date: string; // YYYY.MM.DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationMinutes: number; // 분 단위
  location: string;
  participants: PlayParticipant[];
  winnerNames: string[];
  myResult: MyGameResult;
  isTeamPlay: boolean;
  hasExpansion: boolean;
  expansionName: string;
  rating: number; // 1~5
  review: string;
  photos: PlayPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  nickname: string;
  isAnonymous: boolean;
  createdAt: string;
  theme?: 'light' | 'dark' | 'auto';
}

export interface SeedGame {
  id: string;
  title: string;
  titleEn: string;
  imageUrl: string;
  genre: string[];
  minPlayers: number;
  maxPlayers: number;
  bestPlayers: string;
  recommendedAge: number;
  playTime: number;
  weight: number;
  publisher: string;
  description?: string;
}

export type TabType = 'home' | 'games' | 'add_play' | 'plays' | 'mypage';
