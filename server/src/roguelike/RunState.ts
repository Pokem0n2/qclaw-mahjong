// ===== Roguelike运行状态管理 =====

import { RunState, RunPhase, Buff, StageResult, WinResultLog, DIFFICULTY_CONFIGS } from './types';
import { GameEngine, GameEngineConfig } from '../mahjong/GameEngine';
import { BuffSystem } from './BuffSystem';
import { RewardSystem } from './RewardSystem';
import { ShopSystem } from './ShopSystem';
import { EventSystem } from './EventSystem';
import { v4 as uuidv4 } from 'uuid';
import { WinResult, GameState } from '../mahjong/types';

export class RunStateManager {
  private runs: Map<string, RunState> = new Map();
  private engines: Map<string, GameEngine> = new Map();
  private rewardSystems: Map<string, RewardSystem> = new Map();
  private shopSystems: Map<string, ShopSystem> = new Map();
  private eventSystems: Map<string, EventSystem> = new Map();
  private rng: () => number;

  constructor(seed?: number) {
    const s = seed ?? Date.now();
    let state = s;
    this.rng = () => {
      state = (state * 1664525 + 1013904223) & 0xffffffff;
      return (state >>> 0) / 0xffffffff;
    };
  }

  // ===== 创建新游戏 =====
  createRun(playerName: string = 'Player'): RunState {
    const id = uuidv4();
    const seed = Math.floor(this.rng() * 2147483647);

    const runState: RunState = {
      id,
      currentStage: 1,
      totalStages: 10,
      baseScore: 0,
      scoreMultiplier: 1.0,
      gold: 0,
      buffs: [],
      items: [],
      currentGame: null,
      phase: 'menu',
      history: [],
      seed,
      playerScores: [25000, 25000, 25000, 25000],
      honba: 0,
      riichiSticks: 0
    };

    this.runs.set(id, runState);
    this.rewardSystems.set(id, new RewardSystem(this.rng));
    this.shopSystems.set(id, new ShopSystem(this.rng));
    this.eventSystems.set(id, new EventSystem(this.rng));

    return runState;
  }

  // ===== 开始一局麻将 =====
  startGame(runId: string): { success: boolean; runState?: RunState; gameState?: GameState; error?: string } {
    const run = this.runs.get(runId);
    if (!run) return { success: false, error: 'Run不存在' };

    const stage = run.currentStage;
    const diffConfig = DIFFICULTY_CONFIGS[stage] ?? DIFFICULTY_CONFIGS[1];

    // Buff系统
    const buffSys = new BuffSystem(run.buffs);
    const extraDora = buffSys.getExtraDoraCount();
    const drawBonus = buffSys.getDrawBonus();
    const handBonus = buffSys.getHandSizeBonus();
    const goldMult = buffSys.getGoldMultiplier();
    const scoreMult = buffSys.getScoreMultiplier();
    const aiReduction = buffSys.getAiDifficultyReduction();

    // 计算AI难度
    const aiDiff = Math.max(1, diffConfig.aiDifficulty - aiReduction);

    // 起始分数加成
    const scoreKeep = buffSys.getScoreKeep();
    const playerScores = [...run.playerScores];
    for (let i = 0; i < 4; i++) {
      playerScores[i] += i === 0 ? scoreKeep : 0;
    }

    const engineConfig: GameEngineConfig = {
      seed: run.seed + stage,
      extraDoraCount: extraDora,
      dealerIndex: stage % 4,
      honba: run.honba,
      riichiSticks: run.riichiSticks,
      playerScores,
      difficulty: aiDiff
    };

    const engine = new GameEngine(engineConfig);
    const gameState = engine.getState();

    // 更新Run状态
    run.phase = 'playing';
    run.currentGame = gameState;

    this.engines.set(runId, engine);
    return { success: true, runState: run, gameState };
  }

  // ===== 执行麻将操作 =====
  executeAction(runId: string, playerIndex: number, actionType: string, tileIds?: number[]): { success: boolean; result?: any; error?: string } {
    const engine = this.engines.get(runId);
    if (!engine) return { success: false, error: '游戏引擎不存在' };

    const tiles = tileIds?.map(id => ({ id } as any)) ?? [];
    const result = engine.executeAction(playerIndex, actionType as any, tiles);

    // 更新gameState
    const run = this.runs.get(runId);
    if (run) {
      run.currentGame = engine.getState();
    }

    return result;
  }

  // ===== 获取当前游戏状态 =====
  getGameState(runId: string): GameState | null {
    const run = this.runs.get(runId);
    return run?.currentGame ?? null;
  }

  // ===== 获取Run状态 =====
  getRunState(runId: string): RunState | null {
    return this.runs.get(runId) ?? null;
  }

  // ===== 获取可用动作 =====
  getAvailableActions(runId: string, playerIndex: number): any {
    const engine = this.engines.get(runId);
    if (!engine) return null;
    return engine.getAvailableActions(playerIndex);
  }

  // ===== 获取奖励选项 =====
  getRewardOptions(runId: string): any[] {
    const run = this.runs.get(runId);
    if (!run) return [];
    const rewardSys = this.rewardSystems.get(runId);
    if (!rewardSys) return [];
    return rewardSys.generateRewardOptions(run.currentStage);
  }

  // ===== 选择奖励 =====
  selectReward(runId: string, rewardIndex: number): { success: boolean; buff?: Buff; error?: string } {
    const run = this.runs.get(runId);
    if (!run) return { success: false, error: 'Run不存在' };

    const rewardSys = this.rewardSystems.get(runId);
    if (!rewardSys) return { success: false, error: '奖励系统不存在' };

    const options = rewardSys.generateRewardOptions(run.currentStage);
    if (rewardIndex < 0 || rewardIndex >= options.length) {
      return { success: false, error: '无效奖励索引' };
    }

    const chosen = options[rewardIndex];
    run.buffs.push(chosen.buff);
    run.phase = 'playing'; // 或 'shop' / 'event'

    return { success: true, buff: chosen.buff };
  }

  // ===== 进入商店 =====
  enterShop(runId: string): { success: boolean; items?: any[]; error?: string } {
    const run = this.runs.get(runId);
    if (!run) return { success: false, error: 'Run不存在' };

    const shopSys = this.shopSystems.get(runId);
    if (!shopSys) return { success: false, error: '商店系统不存在' };

    const items = shopSys.generateShop(4);
    run.phase = 'shop';
    return { success: true, items };
  }

  // ===== 购买物品 =====
  buyItem(runId: string, shopIndex: number): { success: boolean; item?: any; goldSpent?: number; error?: string } {
    const run = this.runs.get(runId);
    if (!run) return { success: false, error: 'Run不存在' };

    const shopSys = this.shopSystems.get(runId);
    if (!shopSys) return { success: false, error: '商店系统不存在' };

    const result = shopSys.buyItem(shopIndex, run.gold);
    if (result.success) {
      run.gold -= result.goldSpent!;
      if (result.item) {
        run.items.push(result.item);
      }
    }

    return result;
  }

  // ===== 随机事件 =====
  triggerEvent(runId: string): { success: boolean; event?: any; error?: string } {
    const run = this.runs.get(runId);
    if (!run) return { success: false, error: 'Run不存在' };

    const eventSys = this.eventSystems.get(runId);
    if (!eventSys) return { success: false, error: '事件系统不存在' };

    const event = eventSys.selectRandomEvent();
    run.phase = 'event';
    return { success: true, event };
  }

  // ===== 处理事件选择 =====
  resolveEventChoice(runId: string, choiceIndex: number, event: any): { success: boolean; goldDelta: number; message: string } {
    const run = this.runs.get(runId);
    if (!run) return { success: false, goldDelta: 0, message: 'Run不存在' };

    const eventSys = this.eventSystems.get(runId);
    if (!eventSys) return { success: false, goldDelta: 0, message: '事件系统不存在' };

    const result = eventSys.resolveChoice(event, choiceIndex);
    run.gold = Math.max(0, run.gold + result.goldDelta);

    run.phase = 'playing';
    return { success: true, goldDelta: result.goldDelta, message: result.message };
  }

  // ===== 局后结算 =====
  resolveRoundEnd(runId: string): { success: boolean; runState?: RunState; stageResult?: StageResult } {
    const run = this.runs.get(runId);
    const engine = this.engines.get(runId);
    if (!run || !engine) return { success: false };

    const gameState = engine.getState();
    const player = gameState.players[0]; // 人类玩家

    // 计算分数变化
    const oldScores = run.playerScores;
    const newScores = gameState.players.map(p => p.score);
    const playerScoreDelta = newScores[0] - oldScores[0];

    // 金币奖励
    const buffSys = new BuffSystem(run.buffs);
    const goldMult = buffSys.getGoldMultiplier();
    const goldReward = Math.max(0, Math.floor(playerScoreDelta / 100 * goldMult));

    // 结算记录
    const stageResult: StageResult = {
      stage: run.currentStage,
      winResult: playerScoreDelta > 0 ? {
        winner: 0,
        isHumanWin: playerScoreDelta > 0,
        hand: player.hand,
        melds: player.melds,
        yakus: [],
        han: 0,
        finalPoints: Math.max(0, playerScoreDelta),
        isTsumo: false
      } : null,
      scoreGained: playerScoreDelta,
      goldGained: goldReward,
      buffsGained: [],
      completed: false
    };

    run.playerScores = newScores;
    run.gold += goldReward;
    run.honba = gameState.honba;
    run.riichiSticks = gameState.riichiSticks;
    run.phase = 'reward';

    this.runs.set(runId, run);
    return { success: true, runState: run, stageResult };
  }

  // ===== 进入下一局 =====
  nextStage(runId: string): { success: boolean; runState?: RunState; error?: string } {
    const run = this.runs.get(runId);
    if (!run) return { success: false, error: 'Run不存在' };

    run.currentStage++;
    run.phase = 'playing';
    run.currentGame = null;
    this.engines.delete(runId);

    if (run.currentStage > run.totalStages) {
      run.phase = 'game-over';
    }

    this.runs.set(runId, run);
    return { success: true, runState: run };
  }

  // ===== 删除游戏 =====
  deleteRun(runId: string): void {
    this.runs.delete(runId);
    this.engines.delete(runId);
    this.rewardSystems.delete(runId);
    this.shopSystems.delete(runId);
    this.eventSystems.delete(runId);
  }
}
