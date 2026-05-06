// ===== 麻将游戏引擎 =====

import { GameState, PlayerState, Tile, Meld, GamePhase, GameAction, ActionType, WinResult, Yaku, AvailableActions } from './types';
import { Wall } from './Wall';
import { WinChecker, checkWin, getWaitingTiles } from './WinChecker';
import { detectYakus, calculateFu, calculateHan, calculateBasePoints, YakuContext } from './Yakuman';
import { shuffleTiles, tilesEqual } from './Tile';
import { AIPlayer } from './AIPlayer';

export interface GameEngineConfig {
  seed?: number;
  extraDoraCount?: number;
  dealerIndex?: number;
  honba?: number;
  riichiSticks?: number;
  playerScores?: number[];
  difficulty?: number; // 1-3 AI难度
}

export class GameEngine {
  private state!: GameState;
  private wall!: Wall;
  private winChecker!: WinChecker;
  private aiPlayers: AIPlayer[] = [];
  private rng!: () => number;
  private seed: number = Date.now();
  private ippatsuPlayer: number = -1;
  private lastDiscardPlayer: number = -1;
  private lastDiscardTile: Tile | null = null;
  private waitingActions: Map<number, AvailableActions> = new Map();
  private kanAfterDraw: boolean = false; // 杠后摸牌
  private lastAction: GameAction | null = null;

  constructor(config: GameEngineConfig = {}) {
    this.seed = config.seed ?? Date.now();
    this.initRng(this.seed);
    this.initGame(config);
  }

  private initRng(seed: number): void {
    let s = seed;
    this.rng = () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  }

  initGame(config: GameEngineConfig = {}): void {
    this.seed = config.seed ?? Date.now();
    this.initRng(this.seed);
    this.wall = new Wall(this.seed, config.extraDoraCount ?? 0);
    this.winChecker = new WinChecker();

    const dealer = config.dealerIndex ?? 0;
    const honba = config.honba ?? 0;
    const riichiSticks = config.riichiSticks ?? 0;

    // 初始分数
    const initScores = config.playerScores ?? [25000, 25000, 25000, 25000];

    this.state = {
      roundNumber: 1,
      honba,
      riichiSticks,
      doraIndicators: [],
      wallRemaining: 0,
      players: [],
      currentPlayer: dealer,
      phase: 'deal',
      discardPile: [[], [], [], []],
      lastAction: null,
      extraDoraCount: config.extraDoraCount ?? 0,
      turnCount: 0,
      seed: this.seed
    };

    // 初始化玩家
    const names = ['你', 'AI-东', 'AI-南', 'AI-西'];
    for (let i = 0; i < 4; i++) {
      this.state.players.push({
        index: i,
        name: names[i],
        isHuman: i === 0,
        hand: [],
        melds: [],
        discards: [],
        isRiichi: false,
        score: initScores[i],
        isDealer: i === dealer,
        canRiichi: false,
        waitingTiles: [],
        handSize: 13
      });
    }

    // AI
    const difficulty = config.difficulty ?? 2;
    this.aiPlayers = [];
    for (let i = 1; i < 4; i++) {
      this.aiPlayers.push(new AIPlayer(i, difficulty));
    }

    // 发牌
    this.deal();

    // 翻开宝牌
    this.state.doraIndicators = this.wall.revealDora(config.extraDoraCount ?? 0);

    this.state.phase = 'draw';
    this.state.wallRemaining = this.wall.remaining();

    // 检查AI自动动作
    this.processAutoActions();
  }

  private deal(): void {
    // 每位玩家13张，最后一张给庄家
    for (let p = 0; p < 4; p++) {
      for (let c = 0; c < 13; c++) {
        const tile = this.wall.draw();
        if (tile) this.state.players[p].hand.push(tile);
      }
    }
    // 庄家多摸1张
    const dealerTile = this.wall.draw();
    if (dealerTile) {
      this.state.players[this.state.currentPlayer].hand.push(dealerTile);
    }
    // 排序
    for (const p of this.state.players) {
      p.hand.sort((a, b) => {
        if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
        return a.rank - b.rank;
      });
    }
  }

  // ===== 核心操作 =====

  // 摸牌
  draw(playerIndex: number): Tile | null {
    if (this.state.currentPlayer !== playerIndex) return null;
    if (this.state.phase !== 'draw') return null;

    const tile = this.wall.draw();
    if (!tile) {
      // 牌墙摸完 → 流局
      this.handleRyuukyoku();
      return null;
    }

    this.state.players[playerIndex].hand.push(tile);
    this.state.phase = 'discard';
    this.state.wallRemaining = this.wall.remaining();
    this.lastAction = { type: 'draw', player: playerIndex, tile };
    this.kanAfterDraw = false;

    // 杠后摸牌，不检查荣和
    if (this.ippatsuPlayer === playerIndex) {
      this.ippatsuPlayer = -1;
    }

    // 自摸检查
    if (this.canTsumo(playerIndex)) {
      // 记录等待动作
      this.waitingActions.set(playerIndex, {
        canChi: false, canPon: false, canKan: false,
        canRon: false, canRiichi: false, canTsumo: true, canSkip: false
      });
      this.state.phase = 'action-prompt';
    }

    return tile;
  }

  // 打牌
  discard(playerIndex: number, tileId: number): Tile | null {
    if (this.state.currentPlayer !== playerIndex) return null;
    if (this.state.phase !== 'discard' && this.state.phase !== 'action-prompt') return null;

    const player = this.state.players[playerIndex];
    const tileIdx = player.hand.findIndex(t => t.id === tileId);
    if (tileIdx === -1) return null;

    const tile = player.hand.splice(tileIdx, 1)[0];
    player.discards.push(tile);
    this.state.discardPile[playerIndex].push(tile);
    this.lastDiscardPlayer = playerIndex;
    this.lastDiscardTile = tile;
    this.state.lastAction = { type: 'discard', player: playerIndex, tile };

    // 立直后打出摸到的牌
    if (player.isRiichi) {
      player.isRiichi = false; // 立直状态应在立直时锁定，这里简化处理
    }

    // 检查是否有人荣和
    const ronPlayer = this.checkRon(tile);
    if (ronPlayer !== -1) {
      this.state.currentPlayer = ronPlayer;
      this.state.phase = 'action-prompt';
      this.waitingActions.set(ronPlayer, {
        canChi: false, canPon: false, canKan: false,
        canRon: true, canRiichi: false, canTsumo: false, canSkip: false,
        ronTile: tile
      });
      return tile;
    }

    // 下一玩家摸牌
    this.state.currentPlayer = (playerIndex + 1) % 4;
    this.state.phase = 'draw';
    this.state.wallRemaining = this.wall.remaining();

    // 一发标记
    this.ippatsuPlayer = (playerIndex + 1) % 4;

    this.processAutoActions();
    return tile;
  }

  // 吃
  chi(playerIndex: number, tiles: Tile[]): Meld | null {
    if (tiles.length !== 3) return null;
    if (!this.lastDiscardTile) return null;
    const player = this.state.players[playerIndex];
    // 移除手牌中的3张
    for (const t of tiles) {
      const idx = player.hand.findIndex(h => h.id === t.id);
      if (idx === -1) return null;
      player.hand.splice(idx, 1);
    }
    const meld: Meld = {
      type: 'chi',
      tiles: [...tiles],
      fromPlayer: this.lastDiscardPlayer
    };
    player.melds.push(meld);
    this.state.currentPlayer = playerIndex;
    this.state.phase = 'discard';
    this.lastAction = { type: 'chi', player: playerIndex, tiles };
    this.waitingActions.clear();

    // 排序
    player.hand.sort((a, b) => {
      if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
      return a.rank - b.rank;
    });

    this.processAutoActions();
    return meld;
  }

  // 碰
  pon(playerIndex: number, discardTile: Tile): Meld | null {
    const player = this.state.players[playerIndex];
    const fromPlayer = this.lastDiscardPlayer;
    if (fromPlayer === -1 || !discardTile) return null;

    const handTiles = player.hand.filter(t => tilesEqual(t, discardTile));
    if (handTiles.length < 2) return null;

    // 移除2张手牌
    let removed = 0;
    player.hand = player.hand.filter(t => {
      if (removed < 2 && tilesEqual(t, discardTile)) {
        removed++;
        return false;
      }
      return true;
    });

    const meld: Meld = { type: 'pon', tiles: [...handTiles.slice(0, 2), discardTile], fromPlayer };
    player.melds.push(meld);
    this.state.currentPlayer = playerIndex;
    this.state.phase = 'discard';
    this.lastAction = { type: 'pon', player: playerIndex, tiles: meld.tiles };
    this.waitingActions.clear();

    this.processAutoActions();
    return meld;
  }

  // 明杠
  kan(playerIndex: number, discardTile: Tile): Meld | null {
    const player = this.state.players[playerIndex];
    const fromPlayer = this.lastDiscardPlayer;
    if (fromPlayer === -1) return null;

    const handTiles = player.hand.filter(t => tilesEqual(t, discardTile));
    if (handTiles.length < 3) return null;

    let removed = 0;
    player.hand = player.hand.filter(t => {
      if (removed < 3 && tilesEqual(t, discardTile)) {
        removed++;
        return false;
      }
      return true;
    });

    const meld: Meld = { type: 'kan', tiles: [...handTiles.slice(0, 3), discardTile], fromPlayer };
    player.melds.push(meld);
    this.state.currentPlayer = playerIndex;
    this.state.phase = 'draw';
    this.kanAfterDraw = true;
    this.lastAction = { type: 'kan', player: playerIndex, tiles: meld.tiles };
    this.waitingActions.clear();

    // 开杠，翻新宝牌
    this.wall.revealNextDora();

    this.processAutoActions();
    return meld;
  }

  // 暗杠
  ankan(playerIndex: number, tileIds: number[]): Meld | null {
    if (tileIds.length !== 4) return null;
    const player = this.state.players[playerIndex];
    const tiles = player.hand.filter(t => tileIds.includes(t.id));
    if (tiles.length !== 4) return null;

    // 检查是否真的是4张相同的牌
    const key = `${tiles[0].suit}-${tiles[0].rank}`;
    if (!tiles.every(t => `${t.suit}-${t.rank}` === key)) return null;

    // 从手牌移除4张
    player.hand = player.hand.filter(t => !tileIds.includes(t.id));

    const meld: Meld = { type: 'kan', tiles, fromPlayer: playerIndex };
    player.melds.push(meld);
    this.state.phase = 'draw';
    this.kanAfterDraw = true;
    this.lastAction = { type: 'kan', player: playerIndex, tiles };
    this.waitingActions.clear();

    // 翻新宝牌
    this.wall.revealNextDora();

    this.processAutoActions();
    return meld;
  }

  // 立直
  riichi(playerIndex: number, tileId: number): boolean {
    const player = this.state.players[playerIndex];
    // 门前清才能立直
    if (player.melds.length > 0) return false;
    if (player.score < 1000) return false; // 需支付立直棒

    // 检查听牌
    const waiting = getWaitingTiles(player.hand);
    if (waiting.length === 0) return false;

    player.isRiichi = true;
    player.waitingTiles = waiting;
    player.score -= 1000;
    this.state.riichiSticks++;

    // 打出立直的牌
    this.discard(playerIndex, tileId);
    return true;
  }

  // 自摸
  tsumo(playerIndex: number): WinResult | null {
    const player = this.state.players[playerIndex];
    const ctx = this.buildYakuContext(playerIndex, null);
    ctx.isTsumo = true;

    const hand = player.hand;
    const winChecker = new WinChecker();
    winChecker.setHand(hand, player.melds, player.melds.length === 0);
    if (!winChecker.canWin()) return null;

    const yakus = detectYakus(ctx);
    const han = calculateHan(yakus);
    const fu = calculateFu(ctx);
    const basePoints = calculateBasePoints(han, fu, true, player.isDealer);
    const multiplier = 1; // Roguelike倍率由外面处理

    const result: WinResult = {
      winner: playerIndex,
      hand: [...hand],
      melds: [...player.melds],
      yakus,
      han,
      fu,
      basePoints,
      finalPoints: basePoints * multiplier,
      isTsumo: true
    };

    this.resolveWin(result);
    return result;
  }

  // 荣和
  ron(playerIndex: number): WinResult | null {
    if (!this.lastDiscardTile) return null;
    if (this.lastDiscardPlayer === playerIndex) return null;

    const player = this.state.players[playerIndex];
    const ctx = this.buildYakuContext(playerIndex, this.lastDiscardTile);
    ctx.isTsumo = false;

    const hand = player.hand;
    const winChecker = new WinChecker();
    winChecker.setHand(hand, player.melds, player.melds.length === 0);
    // 荣和需要把点炮的牌加入手牌
    const tenpaiHand = [...hand, this.lastDiscardTile];
    winChecker.setHand(tenpaiHand, player.melds, player.melds.length === 0);
    if (!winChecker.canWin()) return null;

    const yakus = detectYakus(ctx);
    const han = calculateHan(yakus);
    const fu = calculateFu(ctx);
    const basePoints = calculateBasePoints(han, fu, false, player.isDealer);

    const result: WinResult = {
      winner: playerIndex,
      loser: this.lastDiscardPlayer,
      hand: tenpaiHand,
      melds: [...player.melds],
      yakus,
      han,
      fu,
      basePoints,
      finalPoints: basePoints,
      isTsumo: false
    };

    this.resolveWin(result);
    return result;
  }

  // 跳过（不吃/碰/杠）
  skip(playerIndex: number): void {
    this.waitingActions.delete(playerIndex);
    // 如果所有人都不行动，恢复游戏
    if (this.waitingActions.size === 0 && this.state.phase === 'action-prompt') {
      this.state.currentPlayer = (this.lastDiscardPlayer + 1) % 4;
      this.state.phase = 'draw';
    }
    this.processAutoActions();
  }

  // ===== 辅助方法 =====

  private canTsumo(playerIndex: number): boolean {
    const player = this.state.players[playerIndex];
    const winChecker = new WinChecker();
    winChecker.setHand(player.hand, player.melds, player.melds.length === 0);
    return winChecker.canWin();
  }

  private checkRon(discardTile: Tile): number {
    for (let i = 0; i < 4; i++) {
      if (i === this.lastDiscardPlayer) continue;
      const player = this.state.players[i];
      const testHand = [...player.hand, discardTile];
      const winChecker = new WinChecker();
      winChecker.setHand(testHand, player.melds, player.melds.length === 0);
      if (winChecker.canWin()) return i;
    }
    return -1;
  }

  private buildYakuContext(winnerIndex: number, discardTile: Tile | null): YakuContext {
    const winner = this.state.players[winnerIndex];
    return {
      hand: winner.hand,
      melds: winner.melds,
      isMenzen: winner.melds.length === 0,
      isRiichi: winner.isRiichi,
      isIppatsu: this.ippatsuPlayer === winnerIndex,
      isTsumo: false,
      isRinshan: false,
      isChankan: false,
      isLastDraw: false,
      isDaburi: false,
      isDoubleRiichi: false,
      doraIndicators: this.state.doraIndicators,
      extraDoraCount: this.state.extraDoraCount,
      player: winner,
      winnerIndex,
      dealerIndex: this.state.players.findIndex(p => p.isDealer),
      discardTile: discardTile ?? undefined
    };
  }

  private handleRyuukyoku(): void {
    this.state.phase = 'round-end';
    // 流局时检查听牌者
    const tenpaiPlayers = this.state.players
      .map((p, i) => ({ i, waiting: getWaitingTiles(p.hand) }))
      .filter(p => p.waiting.length > 0)
      .map(p => p.i);

    // 听牌者获得3000点，未听者支付1000点
    const tenpaiCount = tenpaiPlayers.length;
    if (tenpaiCount > 0) {
      for (let i = 0; i < 4; i++) {
        if (tenpaiPlayers.includes(i)) {
          this.state.players[i].score += Math.floor(3000 / tenpaiCount);
        } else {
          this.state.players[i].score -= 1000;
        }
      }
    }
  }

  private resolveWin(result: WinResult): void {
    const winner = this.state.players[result.winner];
    const loser = result.loser !== undefined ? this.state.players[result.loser] : null;

    if (result.isTsumo) {
      // 自摸：向其他3家收取
      const payPerPlayer = Math.ceil(result.finalPoints / 3);
      for (let i = 0; i < 4; i++) {
        if (i === result.winner) continue;
        if (winner.isDealer) {
          // 庄家自摸：闲家各付
          const pay = winner.isDealer ? Math.ceil(payPerPlayer * 2) : payPerPlayer;
          this.state.players[i].score -= pay;
        }
        winner.score += this.state.players[i].score < 0 ? 0 : payPerPlayer;
      }
    } else if (loser) {
      // 荣和：点炮者支付
      loser.score -= result.finalPoints;
      winner.score += result.finalPoints;
    }

    // 归还立直棒
    winner.score += this.state.riichiSticks * 1000;
    this.state.riichiSticks = 0;

    // 本场数增加
    if (!winner.isDealer) {
      this.state.honba++;
    } else {
      this.state.honba++;
    }

    this.state.phase = 'round-end';
    this.state.lastAction = { type: result.isTsumo ? 'tsumo' : 'ron', player: result.winner };
  }

  // ===== 自动处理（AI）=====
  private processAutoActions(): void {
    const cp = this.state.currentPlayer;
    if (this.state.players[cp].isHuman) return;
    if (this.state.phase === 'draw') {
      // AI摸牌
      const tile = this.draw(cp);
      if (tile) {
        // AI打牌
        setTimeout(() => {
          const ai = this.aiPlayers.find(a => a.playerIndex === cp);
          if (ai) {
            const tileToDiscard = ai.decideDiscard(this.state.players[cp], this.state);
            if (tileToDiscard) {
              this.discard(cp, tileToDiscard.id);
            }
          }
        }, 100);
      }
    } else if (this.state.phase === 'discard') {
      const ai = this.aiPlayers.find(a => a.playerIndex === cp);
      if (ai) {
        const tileToDiscard = ai.decideDiscard(this.state.players[cp], this.state);
        if (tileToDiscard) {
          this.discard(cp, tileToDiscard.id);
        }
      }
    }
  }

  // ===== 状态获取 =====

  getState(): GameState {
    return JSON.parse(JSON.stringify(this.state));
  }

  getPlayer(playerIndex: number): PlayerState {
    return JSON.parse(JSON.stringify(this.state.players[playerIndex]));
  }

  getWaitingActions(playerIndex: number): AvailableActions | null {
    return this.waitingActions.get(playerIndex) ?? null;
  }

  getAvailableActions(playerIndex: number): AvailableActions {
    const player = this.state.players[playerIndex];
    const result: AvailableActions = {
      canChi: false, canPon: false, canKan: false,
      canRon: false, canRiichi: false, canTsumo: false, canSkip: false
    };

    if (this.lastDiscardTile && playerIndex !== this.lastDiscardPlayer) {
      // 荣和检查
      const testHand = [...player.hand, this.lastDiscardTile];
      const wc = new WinChecker();
      wc.setHand(testHand, player.melds, player.melds.length === 0);
      result.canRon = wc.canWin();
      if (result.canRon) result.ronTile = this.lastDiscardTile!;

      const discard = this.lastDiscardTile!;
      const ponCount = player.hand.filter(t => tilesEqual(t, discard)).length;
      result.canPon = ponCount >= 2;
      if (result.canPon) result.ponTile = discard;

      // 杠
      result.canKan = ponCount >= 3;
      if (result.canKan) result.kanTile = discard;

      // 吃（下家）
      if (playerIndex === (this.lastDiscardPlayer + 3) % 4) {
        // 检查是否是数牌
        result.canChi = true;
        // 计算吃牌选项（简化）
      }
    }

    // 自摸
    const wc = new WinChecker();
    wc.setHand(player.hand, player.melds, player.melds.length === 0);
    if (wc.canWin()) {
      result.canTsumo = true;
      result.canRiichi = player.melds.length === 0 && player.score >= 1000 && wc.isTenpai();
    }

    result.canSkip = result.canChi || result.canPon || result.canKan || result.canRon;
    return result;
  }

  // ===== 操作执行（外部API调用）=====
  executeAction(playerIndex: number, action: ActionType, tiles?: Tile[]): { success: boolean; result?: any; error?: string } {
    try {
      switch (action) {
        case 'draw': {
          const tile = this.draw(playerIndex);
          return { success: true, result: { tile } };
        }
        case 'discard': {
          if (!tiles || tiles.length !== 1) return { success: false, error: '需要1张牌' };
          const tile = this.discard(playerIndex, tiles[0].id);
          return { success: !!tile, result: { tile }, error: tile ? undefined : '无效牌' };
        }
        case 'chi': {
          if (!tiles || tiles.length !== 3) return { success: false, error: '需要3张牌' };
          const meld = this.chi(playerIndex, tiles);
          return { success: !!meld, result: { meld }, error: meld ? undefined : '无效吃' };
        }
        case 'pon': {
          if (!this.lastDiscardTile) return { success: false, error: '无点炮牌' };
          const meld = this.pon(playerIndex, this.lastDiscardTile);
          return { success: !!meld, result: { meld }, error: meld ? undefined : '无效碰' };
        }
        case 'kan': {
          if (!this.lastDiscardTile) return { success: false, error: '无点炮牌' };
          const meld = this.kan(playerIndex, this.lastDiscardTile);
          return { success: !!meld, result: { meld }, error: meld ? undefined : '无效杠' };
        }
        case 'riichi': {
          if (!tiles || tiles.length !== 1) return { success: false, error: '需要1张牌' };
          const ok = this.riichi(playerIndex, tiles[0].id);
          return { success: ok, error: ok ? undefined : '无法立直' };
        }
        case 'tsumo': {
          const result = this.tsumo(playerIndex);
          return { success: !!result, result, error: result ? undefined : '无法自摸' };
        }
        case 'ron': {
          const result = this.ron(playerIndex);
          return { success: !!result, result, error: result ? undefined : '无法荣和' };
        }
        case 'skip': {
          this.skip(playerIndex);
          return { success: true };
        }
        default:
          return { success: false, error: '未知动作' };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}
