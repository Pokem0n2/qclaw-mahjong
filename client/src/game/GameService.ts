// ===== 游戏服务 - 整合所有逻辑 =====

import { GameState, PlayerState, Tile, Meld, GamePhase, ActionType, WinResult, Yaku } from './mahjong/types';
import { Wall } from './mahjong/Wall';
import { Hand } from './mahjong/Hand';
import { WinChecker, checkWin, getWaitingTiles } from './mahjong/WinChecker';
import { detectYakus, calculateHan, calculatePoints } from './mahjong/Yakuman';
import { AIPlayer } from './mahjong/AIPlayer';
import { RunState, RunPhase, Buff, RewardOption, StageResult, DIFFICULTY_CONFIGS } from './roguelike/types';
import { BuffSystem } from './roguelike/BuffSystem';
import { ShopSystem } from './roguelike/ShopSystem';
import { EventSystem } from './roguelike/EventSystem';
import { RewardSystem } from './roguelike/RewardSystem';
import { shuffleTiles, createAllTiles, tilesEqual, tileKey } from './mahjong/Tile';

let globalIdCounter = 0;

export class GameService {
  private runState: RunState | null = null;
  private gameState: GameState | null = null;
  private wall: Wall | null = null;
  private aiPlayers: AIPlayer[] = [];
  private rng: () => number;
  private seed: number = 0;
  
  private buffSystem: BuffSystem = new BuffSystem();
  private shopSystem: ShopSystem = new ShopSystem();
  private eventSystem: EventSystem = new EventSystem();
  private rewardSystem: RewardSystem = new RewardSystem();

  constructor(seed?: number) {
    this.seed = seed ?? Date.now();
    let state = this.seed;
    this.rng = () => {
      state = (state * 1664525 + 1013904223) & 0xffffffff;
      return (state >>> 0) / 0xffffffff;
    };
  }

  // ===== 游戏初始化 =====
  startNewRun(): RunState {
    this.runState = {
      id: `run_${++globalIdCounter}_${Date.now()}`,
      currentStage: 1,
      totalStages: 10,
      baseScore: 0,
      scoreMultiplier: 1.0,
      gold: 0,
      buffs: [],
      items: [],
      currentGame: null,
      phase: 'playing',
      history: [],
      seed: this.seed,
      playerScores: [25000, 25000, 25000, 25000],
      honba: 0,
      riichiSticks: 0
    };
    this.buffSystem = new BuffSystem();
    return this.runState;
  }

  // ===== 开始一局麻将 =====
  startGame(): { gameState: GameState; runState: RunState } | null {
    if (!this.runState) return null;

    const stage = this.runState.currentStage;
    const config = DIFFICULTY_CONFIGS[stage] ?? DIFFICULTY_CONFIGS[1];
    
    const extraDora = this.buffSystem.getExtraDoraCount();
    const handBonus = this.buffSystem.getHandSizeBonus();
    
    // 创建牌墙
    this.wall = new Wall(this.seed + stage, extraDora);
    
    // 初始化AI
    this.aiPlayers = [];
    for (let i = 1; i < 4; i++) {
      this.aiPlayers.push(new AIPlayer(i, config.aiDifficulty));
    }

    // 发牌
    const players: PlayerState[] = [];
    const names = ['你', 'AI-东', 'AI-南', 'AI-西'];
    
    for (let i = 0; i < 4; i++) {
      const hand = new Hand();
      const tiles = this.dealTiles(13 + (i === 0 ? handBonus : 0));
      tiles.forEach(t => hand.draw(t));
      hand.sort();
      
      players.push({
        index: i,
        name: names[i],
        isHuman: i === 0,
        hand: hand.getTiles(),
        melds: [],
        discards: [],
        isRiichi: false,
        score: this.runState.playerScores[i],
        isDealer: i === (stage - 1) % 4,
        canRiichi: false,
        waitingTiles: [],
        handSize: 13 + handBonus
      });
    }

    // 摸第一张牌给庄家
    const firstTile = this.wall.draw();
    if (firstTile) {
      players[(stage - 1) % 4].hand.push(firstTile);
    }

    // 翻开宝牌
    this.wall.revealDora(extraDora);

    this.gameState = {
      roundNumber: stage,
      honba: this.runState.honba,
      riichiSticks: this.runState.riichiSticks,
      doraIndicators: this.wall.getDoraIndicators(),
      wallRemaining: this.wall.remaining(),
      players,
      currentPlayer: (stage - 1) % 4,
      phase: 'draw',
      discardPile: [[], [], [], []],
      lastAction: null,
      extraDoraCount: extraDora,
      turnCount: 0,
      seed: this.seed + stage
    };

    this.runState.phase = 'playing';
    this.runState.currentGame = this.gameState;

    return { gameState: this.gameState, runState: this.runState };
  }

  private dealTiles(count: number): Tile[] {
    const tiles: Tile[] = [];
    for (let i = 0; i < count; i++) {
      const tile = this.wall?.draw();
      if (tile) tiles.push(tile);
    }
    return tiles;
  }

  // ===== 执行动作 =====
  executeAction(playerIndex: number, action: ActionType, tileIds?: number[]): { success: boolean; gameState?: GameState; winResult?: WinResult; error?: string } {
    if (!this.gameState || !this.wall) {
      return { success: false, error: '游戏未初始化' };
    }

    const player = this.gameState.players[playerIndex];
    
    switch (action) {
      case 'discard':
        return this.handleDiscard(playerIndex, tileIds?.[0]);
      
      case 'draw':
        return this.handleDraw(playerIndex);
      
      case 'riichi':
        return this.handleRiichi(playerIndex, tileIds?.[0]);
      
      case 'tsumo':
      case 'ron':
        return this.handleWin(playerIndex, action === 'tsumo');
      
      case 'skip':
        return this.handleSkip(playerIndex);
        
      default:
        return { success: false, error: '未知动作' };
    }
  }

  private handleDiscard(playerIndex: number, tileId?: number): { success: boolean; gameState?: GameState; error?: string } {
    if (!this.gameState || !this.wall) return { success: false, error: '游戏未初始化' };
    
    const player = this.gameState.players[playerIndex];
    const tileIdx = player.hand.findIndex(t => t.id === tileId);
    if (tileIdx === -1) return { success: false, error: '找不到该牌' };

    const discardedTile = player.hand.splice(tileIdx, 1)[0];
    player.discards.push(discardedTile);
    this.gameState.discardPile[playerIndex].push(discardedTile);
    this.gameState.lastAction = { type: 'discard', player: playerIndex, tile: discardedTile };

    // 检查其他玩家是否可以碰/杠/荣和
    this.checkWaitingActions(playerIndex, discardedTile);

    // 切换到下一个玩家摸牌
    this.gameState.currentPlayer = (playerIndex + 1) % 4;
    this.gameState.phase = 'draw';
    this.gameState.turnCount++;

    // 检查流局
    if (this.wall.remaining() <= 0) {
      this.handleDrawGame();
    }

    return { success: true, gameState: this.gameState };
  }

  private handleDraw(playerIndex: number): { success: boolean; gameState?: GameState; error?: string } {
    if (!this.gameState || !this.wall) return { success: false, error: '游戏未初始化' };

    const tile = this.wall.draw();
    if (!tile) {
      this.handleDrawGame();
      return { success: true, gameState: this.gameState };
    }

    const player = this.gameState.players[playerIndex];
    player.hand.push(tile);
    
    // 检查是否可以立直
    const waiting = getWaitingTiles(player.hand);
    player.canRiichi = waiting.length > 0 && player.melds.length === 0;
    player.waitingTiles = waiting;

    this.gameState.phase = 'discard';
    this.gameState.wallRemaining = this.wall.remaining();

    return { success: true, gameState: this.gameState };
  }

  private handleRiichi(playerIndex: number, tileId?: number): { success: boolean; gameState?: GameState; error?: string } {
    if (!this.gameState) return { success: false, error: '游戏未初始化' };

    const player = this.gameState.players[playerIndex];
    
    // 检查是否免费立直
    if (!this.buffSystem.isRiichiFree()) {
      if (player.score < 1000) {
        return { success: false, error: '分数不足' };
      }
      player.score -= 1000;
      this.gameState.riichiSticks++;
    }

    player.isRiichi = true;
    
    // 如果指定了打出的牌，执行打牌
    if (tileId !== undefined) {
      return this.handleDiscard(playerIndex, tileId);
    }

    return { success: true, gameState: this.gameState };
  }

  private handleWin(playerIndex: number, isTsumo: boolean): { success: boolean; gameState?: GameState; winResult?: WinResult; error?: string } {
    if (!this.gameState || !this.runState) return { success: false, error: '游戏未初始化' };

    const player = this.gameState.players[playerIndex];
    
    // 检测役种
    const ctx = {
      hand: player.hand,
      melds: player.melds,
      isMenzen: player.melds.length === 0,
      isRiichi: player.isRiichi,
      isIppatsu: false,
      isTsumo: isTsumo,
      doraIndicators: this.gameState.doraIndicators
    };
    
    const yakus = detectYakus(ctx);
    const han = calculateHan(yakus);
    const isDealer = player.isDealer;
    const points = calculatePoints(han, 20, isDealer);
    
    // 应用Roguelike加成
    const finalPoints = Math.floor(points * this.buffSystem.getScoreMultiplier());

    const winResult: WinResult = {
      winner: playerIndex,
      hand: [...player.hand],
      melds: [...player.melds],
      yakus,
      han,
      fu: 20,
      basePoints: points,
      finalPoints,
      isTsumo
    };

    // 更新分数
    if (isTsumo) {
      for (let i = 0; i < 4; i++) {
        if (i !== playerIndex) {
          const loss = isDealer ? Math.ceil(finalPoints / 3) : Math.ceil(finalPoints / 4);
          this.gameState.players[i].score -= loss;
        }
      }
      player.score += finalPoints;
    } else {
      // 荣和（简化处理）
      player.score += finalPoints;
    }

    this.gameState.phase = 'round-end';
    
    // 结算
    this.resolveRoundEnd(winResult);

    return { success: true, gameState: this.gameState, winResult };
  }

  private handleSkip(playerIndex: number): { success: boolean; gameState?: GameState; error?: string } {
    if (!this.gameState) return { success: false, error: '游戏未初始化' };
    
    // 跳过后继续摸牌
    this.gameState.phase = 'draw';
    return { success: true, gameState: this.gameState };
  }

  private checkWaitingActions(discardPlayer: number, tile: Tile): void {
    // 简化：不实现复杂的吃碰杠判定
  }

  private handleDrawGame(): void {
    if (!this.gameState) return;
    this.gameState.phase = 'round-end';
  }

  // ===== 局后结算 =====
  private resolveRoundEnd(winResult?: WinResult): void {
    if (!this.runState || !this.gameState) return;

    const player = this.gameState.players[0];
    const scoreDelta = player.score - this.runState.playerScores[0];
    
    const goldGained = this.rewardSystem.calculateGoldReward(
      Math.max(0, winResult?.finalPoints ?? 0),
      this.runState.currentStage,
      this.buffSystem.getGoldMultiplier()
    );

    const stageResult: StageResult = {
      stage: this.runState.currentStage,
      winResult: winResult ? {
        winner: winResult.winner,
        isHumanWin: winResult.winner === 0,
        hand: winResult.hand,
        melds: winResult.melds,
        yakus: winResult.yakus.map(y => y.name),
        han: winResult.han,
        finalPoints: winResult.finalPoints,
        isTsumo: winResult.isTsumo
      } : null,
      scoreGained: scoreDelta,
      goldGained,
      buffsGained: [],
      completed: false
    };

    this.runState.history.push(stageResult);
    this.runState.gold += goldGained;
    this.runState.playerScores = this.gameState.players.map(p => p.score);
    this.runState.phase = 'reward';
  }

  // ===== 奖励选择 =====
  getRewardOptions(): RewardOption[] {
    return this.rewardSystem.generateRewardOptions(this.runState?.currentStage ?? 1);
  }

  selectReward(rewardIndex: number): Buff | null {
    if (!this.runState) return null;
    
    const options = this.getRewardOptions();
    if (rewardIndex < 0 || rewardIndex >= options.length) return null;

    const chosen = options[rewardIndex];
    this.runState.buffs.push(chosen.buff);
    this.buffSystem.addBuff(chosen.buff);
    
    this.runState.phase = 'playing';
    return chosen.buff;
  }

  // ===== 进入下一关 =====
  nextStage(): { success: boolean; runState?: RunState; gameState?: GameState; isGameOver?: boolean } {
    if (!this.runState) return { success: false };

    this.runState.currentStage++;
    this.runState.phase = 'playing';

    if (this.runState.currentStage > this.runState.totalStages) {
      this.runState.phase = 'game-over';
      return { success: true, runState: this.runState, isGameOver: true };
    }

    // 开始新一局
    const result = this.startGame();
    return { success: true, runState: result?.runState, gameState: result?.gameState };
  }

  // ===== 商店 =====
  enterShop(): { items: any[] } {
    const items = this.shopSystem.generateShop(4);
    if (this.runState) {
      this.runState.phase = 'shop';
    }
    return { items };
  }

  buyItem(shopIndex: number): { success: boolean; item?: any; goldSpent?: number; error?: string } {
    if (!this.runState) return { success: false, error: '游戏未初始化' };

    const result = this.shopSystem.buyItem(shopIndex, this.runState.gold);
    if (result.success) {
      this.runState.gold -= result.goldSpent!;
      if (result.item) {
        this.runState.items.push(result.item);
      }
    }
    return result;
  }

  // ===== 事件 =====
  triggerEvent(): { event: GameEvent } | null {
    if (!this.runState) return null;
    
    const event = this.eventSystem.selectRandomEvent();
    this.runState.phase = 'event';
    return { event };
  }

  resolveEvent(event: any, choiceIndex: number): { goldDelta: number; message: string } {
    if (!this.runState) return { goldDelta: 0, message: '游戏未初始化' };

    const result = this.eventSystem.resolveChoice(event, choiceIndex);
    this.runState.gold = Math.max(0, this.runState.gold + result.goldDelta);
    this.runState.phase = 'playing';
    return result;
  }

  // ===== 状态获取 =====
  getGameState(): GameState | null {
    return this.gameState;
  }

  getRunState(): RunState | null {
    return this.runState;
  }

  // ===== AI回合 =====
  executeAI(): { success: boolean; gameState?: GameState; winResult?: WinResult } {
    if (!this.gameState || !this.wall) return { success: false };
    
    const currentPlayerIndex = this.gameState.currentPlayer;
    const currentPlayer = this.gameState.players[currentPlayerIndex];
    
    // 非玩家回合
    if (currentPlayer.isHuman) return { success: false };
    
    // AI摸牌
    if (this.gameState.phase === 'draw') {
      const tile = this.wall.draw();
      if (tile) {
        currentPlayer.hand.push(tile);
        this.gameState.phase = 'discard';
        this.gameState.wallRemaining = this.wall.remaining();
      } else {
        // 牌墙空了
        this.gameState.phase = 'round-end';
        return { success: true, gameState: this.gameState };
      }
    }
    
    // AI打牌（简单策略：随机打一张不是对子的牌）
    if (this.gameState.phase === 'discard') {
      // 简单AI：找一张安全牌打出
      const discardIdx = this.findSafeTileToDiscard(currentPlayer);
      const discardedTile = currentPlayer.hand.splice(discardIdx, 1)[0];
      currentPlayer.discards.push(discardedTile);
      this.gameState.discardPile[currentPlayerIndex].push(discardedTile);
      this.gameState.lastAction = { type: 'discard', player: currentPlayerIndex, tile: discardedTile };
      
      // 检查流局
      if (this.wall.remaining() <= 0) {
        this.gameState.phase = 'round-end';
        return { success: true, gameState: this.gameState };
      }
      
      // 下一个玩家
      this.gameState.currentPlayer = (currentPlayerIndex + 1) % 4;
      this.gameState.phase = 'draw';
    }
    
    return { success: true, gameState: this.gameState };
  }
  
  private findSafeTileToDiscard(player: PlayerState): number {
    // 简单策略：随机选择一张牌
    // TODO: 更智能的AI可以分析舍牌安全性
    return Math.floor(Math.random() * player.hand.length);
  }

  getAvailableActions(): string[] {
    const actions: string[] = [];
    if (!this.gameState) return actions;
    
    const humanIndex = this.gameState.players.findIndex(p => p.isHuman);
    const player = this.gameState.players[humanIndex];
    const isMyTurn = this.gameState.currentPlayer === humanIndex;
    
    if (!isMyTurn) return actions;
    
    if (this.gameState.phase === 'discard') {
      actions.push('discard');
    }
    
    if (this.gameState.phase === 'draw' && player.hand.length % 3 === 1) {
      actions.push('draw');
    }
    
    // 检查自摸
    if (checkWin(player.hand, player.melds, player.melds.length === 0)) {
      actions.push('tsumo');
    }
    
    return actions;
  }
}

// 导出单例
export const gameService = new GameService();
