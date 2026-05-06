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
  roundNumber: number;       // 当前局数
  honba: number;             // 本场数
  riichiSticks: number;      // 立直棒
  doraIndicators: Tile[];    // 宝牌指示牌
  wallRemaining: number;     // 牌墙剩余
  players: PlayerState[];    // 4个玩家
  currentPlayer: number;     // 当前玩家索引
  phase: GamePhase;          // 游戏阶段
  discardPile: Tile[][];     // 各家舍牌
  lastAction: GameAction | null;
  extraDoraCount: number;     // Roguelike: 额外宝牌数
  turnCount: number;         // 回合计数
  seed?: number;              // 随机种子
}

export interface PlayerState {
  index: number;
  name: string;
  isHuman: boolean;
  hand: Tile[];              // 手牌
  melds: Meld[];             // 副露
  discards: Tile[];          // 舍牌
  isRiichi: boolean;
  score: number;
  isDealer: boolean;
  canRiichi: boolean;        // 能否立直
  waitingTiles: Tile[];      // 听牌列表（立直后）
  handSize: number;          // 手牌上限
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
  loser?: number;             // 点炮者（荣和时）
  hand: Tile[];
  melds: Meld[];
  yakus: Yaku[];              // 成立的役
  han: number;                // 番数
  fu: number;                 // 符数
  basePoints: number;         // 基础点数
  finalPoints: number;        // 最终点数（含Roguelike加成）
  isTsumo: boolean;           // 是否自摸
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
  tiles?: number[];   // tile IDs
  discardTile?: number; // 打牌时的牌ID
}

export interface RewardRequest {
  rewardIndex: number;  // 选择第几个奖励 (0-2)
}

export interface ShopBuyRequest {
  shopIndex: number;    // 购买商店中第几个物品
}

export interface EventChoiceRequest {
  choiceIndex?: number;  // 选择第几个选项
  event?: any;           // 当前事件（处理事件时传入）
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
