// ===== 麻将牌 =====
export enum TileSuit {
  Man = 'man',     // 万
  Pin = 'pin',     // 筒
  Sou = 'sou',     // 条
  Wind = 'wind',   // 风
  Dragon = 'dragon' // 三元
}

export interface Tile {
  id: number;        // 唯一ID (0-143)
  suit: TileSuit;
  rank: number;      // 1-9 (数牌) 或 1-4 (风:东南西北) 或 1-3 (三元:白发中)
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
  lastAction: Action | null;
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
}

export type GamePhase = 'deal' | 'draw' | 'discard' | 'action-prompt' | 'round-end';

export type MeldType = 'chi' | 'pon' | 'kan';

export interface Meld {
  type: MeldType;
  tiles: Tile[];
  fromPlayer: number;
}

export interface Action {
  type: 'draw' | 'discard' | 'chi' | 'pon' | 'kan' | 'riichi' | 'ron' | 'tsumo' | 'skip';
  player: number;
  tiles?: Tile[];
}

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
}

export interface Yaku {
  name: string;
  han: number;
}

// ===== Roguelike =====
export interface RunState {
  id: string;
  currentStage: number;      // 当前关卡 (1-10)
  totalStages: number;       // 总关卡数
  baseScore: number;         // 累计基础分
  scoreMultiplier: number;   // 分数倍率
  gold: number;              // 金币
  buffs: Buff[];             // 当前增益列表
  items: Item[];             // 持有道具
  currentGame: GameState | null;
  phase: RunPhase;
  history: StageResult[];    // 每局结果记录
}

export type RunPhase = 'menu' | 'playing' | 'reward' | 'shop' | 'event' | 'game-over';

export interface Buff {
  id: string;
  name: string;
  description: string;
  icon: string;
  stackable: boolean;
  stacks: number;
  effect: BuffEffect;
}

export type BuffEffect =
  | { type: 'score-multiplier'; value: number }
  | { type: 'draw-bonus'; tiles: number }
  | { type: 'riichi-free' }
  | { type: 'dora-extra'; count: number }
  | { type: 'yaku-bonus'; yakuName: string; extraHan: number }
  | { type: 'hand-size-bonus'; extraTiles: number }
  | { type: 'peek-discard'; count: number }
  | { type: 'lucky-draw'; probability: number };

export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  consumable: boolean;
  effect: BuffEffect;
}

export interface ShopItem {
  item: Item;
  sold: boolean;
}

export interface EventChoice {
  id: string;
  text: string;
  reward: Buff | Item | { type: 'gold'; amount: number };
}

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  choices: EventChoice[];
}

export interface RewardOption {
  buff: Buff;
  description: string;
}

export interface StageResult {
  stage: number;
  winResult: WinResult | null;
  scoreGained: number;
  goldGained: number;
  buffsGained: string[];
}

// ===== API请求/响应 =====
export interface StartGameResponse {
  runState: RunState;
  gameState: GameState;
}

export interface ActionRequest {
  type: string;
  tiles?: number[];   // tile IDs
}

export interface RewardRequest {
  rewardIndex: number;  // 选择第几个奖励 (0-2)
}

export interface ShopBuyRequest {
  shopIndex: number;    // 购买商店中第几个物品
}

export interface EventChoiceRequest {
  choiceIndex: number;  // 选择第几个选项
}

// ===== 初始增益 =====
export interface StartingBonus {
  id: string;
  name: string;
  description: string;
  buff: Buff;
}
