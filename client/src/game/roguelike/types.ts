// ===== Roguelike 类型定义 =====

import { GameState, Tile, Meld } from '../mahjong/types';

export interface RunState {
  id: string;
  currentStage: number;
  totalStages: number;
  baseScore: number;
  scoreMultiplier: number;
  gold: number;
  buffs: Buff[];
  items: Item[];
  currentGame: GameState | null;
  phase: RunPhase;
  history: StageResult[];
  seed: number;
  playerScores: number[];
  honba: number;
  riichiSticks: number;
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
  | { type: 'defense-bonus'; reduction: number }
  | { type: 'lucky-draw'; probability: number }
  | { type: 'gold-bonus'; multiplier: number };

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
  discount?: number;
}

export interface EventChoice {
  id: string;
  text: string;
  reward: Buff | Item | { type: 'gold'; amount: number } | { type: 'debuff'; description: string };
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
  rarity: 'common' | 'rare' | 'epic';
}

export interface StageResult {
  stage: number;
  winResult: WinResultLog | null;
  scoreGained: number;
  goldGained: number;
  buffsGained: string[];
  completed: boolean;
}

export interface WinResultLog {
  winner: number;
  isHumanWin: boolean;
  hand: Tile[];
  melds: Meld[];
  yakus: string[];
  han: number;
  finalPoints: number;
  isTsumo: boolean;
}

export interface DifficultyConfig {
  aiDifficulty: number;
  bonusRules: string[];
  goldMultiplier: number;
  scoreMultiplier: number;
}

export const DIFFICULTY_CONFIGS: Record<number, DifficultyConfig> = {
  1: { aiDifficulty: 1, bonusRules: [], goldMultiplier: 1.0, scoreMultiplier: 1.0 },
  2: { aiDifficulty: 1, bonusRules: [], goldMultiplier: 1.0, scoreMultiplier: 1.0 },
  3: { aiDifficulty: 1, bonusRules: [], goldMultiplier: 1.0, scoreMultiplier: 1.0 },
  4: { aiDifficulty: 2, bonusRules: [], goldMultiplier: 1.2, scoreMultiplier: 1.2 },
  5: { aiDifficulty: 2, bonusRules: [], goldMultiplier: 1.2, scoreMultiplier: 1.2 },
  6: { aiDifficulty: 2, bonusRules: [], goldMultiplier: 1.5, scoreMultiplier: 1.5 },
  7: { aiDifficulty: 3, bonusRules: [], goldMultiplier: 1.5, scoreMultiplier: 1.5 },
  8: { aiDifficulty: 3, bonusRules: [], goldMultiplier: 2.0, scoreMultiplier: 2.0 },
  9: { aiDifficulty: 3, bonusRules: [], goldMultiplier: 2.0, scoreMultiplier: 2.0 },
  10: { aiDifficulty: 3, bonusRules: ['double-dora'], goldMultiplier: 3.0, scoreMultiplier: 3.0 },
};
