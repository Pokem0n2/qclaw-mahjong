// ===== 麻将牌 =====

export enum TileSuit {
  Man = 'man',       // 万
  Pin = 'pin',       // 筒
  Sou = 'sou',       // 条
  Wind = 'wind',     // 风
  Dragon = 'dragon'  // 三元
}

export const WIND_TILES = ['east', 'south', 'west', 'north'] as const;
export const DRAGON_TILES = ['white', 'green', 'red'] as const;

export interface Tile {
  id: number;        // 唯一ID (0-143)
  suit: TileSuit;
  rank: number;      // 1-9 (数牌) 或 1-4 (风) 或 1-3 (三元)
  isRed: boolean;    // 赤宝牌
}

// ===== 牌局状态 =====

export interface GameState {
  roundNumber: number;
  honba: number;
  riichiSticks: number;
  doraIndicators: Tile[];
  wallRemaining: number;
  players: PlayerState[];
  currentPlayer: number;
  phase: GamePhase;
  discardPile: Tile[][];
  lastAction: GameAction | null;
  extraDoraCount: number;
  turnCount: number;
  seed?: number;
}

export interface PlayerState {
  index: number;
  name: string;
  isHuman: boolean;
  hand: Tile[];
  melds: Meld[];
  discards: Tile[];
  isRiichi: boolean;
  score: number;
  isDealer: boolean;
  canRiichi: boolean;
  waitingTiles: Tile[];
  handSize: number;
}

export type GamePhase = 'deal' | 'draw' | 'discard' | 'action-prompt' | 'round-end' | 'waiting-actions';
export type MeldType = 'chi' | 'pon' | 'kan' | 'kan-added';

export interface Meld {
  type: MeldType;
  tiles: Tile[];
  fromPlayer: number;
}

export interface GameAction {
  type: ActionType;
  player: number;
  tiles?: Tile[];
  tile?: Tile;
  targetPlayer?: number;
}

export type ActionType = 'draw' | 'discard' | 'chi' | 'pon' | 'kan' | 'riichi' | 'ron' | 'tsumo' | 'skip' | 'none';

// ===== 和牌结果 =====

export interface WinResult {
  winner: number;
  loser?: number;
  hand: Tile[];
  melds: Meld[];
  yakus: Yaku[];
  han: number;
  fu: number;
  basePoints: number;
  finalPoints: number;
  isTsumo: boolean;
}

export interface Yaku {
  name: string;
  han: number;
  isYakuman: boolean;
}

// ===== 可用动作 =====

export interface AvailableActions {
  canChi: boolean;
  canPon: boolean;
  canKan: boolean;
  canRon: boolean;
  canRiichi: boolean;
  canTsumo: boolean;
  canSkip: boolean;
  chiOptions?: ChiOption[];
  ponTile?: Tile;
  kanTile?: Tile;
  ronTile?: Tile;
}

export interface ChiOption {
  tiles: Tile[];
  fromPlayer: number;
}

// ===== API 请求/响应 =====

export interface ActionRequest {
  type: ActionType;
  tiles?: number[];
  discardTile?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
