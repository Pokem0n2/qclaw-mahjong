// ===== AI玩家决策 =====

import { GameState, PlayerState, Tile, TileSuit } from './types';
import { tilesEqual, tileKey, isNumberTile } from './Tile';
import { getWaitingTiles } from './WinChecker';

export class AIPlayer {
  public playerIndex: number;
  private difficulty: number; // 1=简单, 2=中等, 3=困难

  constructor(playerIndex: number, difficulty: number = 2) {
    this.playerIndex = playerIndex;
    this.difficulty = difficulty;
  }

  // ===== 核心决策：打哪张牌 =====
  decideDiscard(player: PlayerState, gameState: GameState): Tile | null {
    if (player.hand.length === 0) return null;

    // 立直后只能打摸到的牌（简化：直接打最新摸到的）
    if (player.isRiichi && player.hand.length === 14) {
      return player.hand[player.hand.length - 1];
    }

    // 计算每张牌的价值，取最低的打
    const discardValues = player.hand.map(tile => ({
      tile,
      value: this.calculateDiscardValue(tile, player, gameState)
    }));

    // 按价值升序排列
    discardValues.sort((a, b) => a.value - b.value);

    // 取价值最低的牌
    return discardValues[0]?.tile ?? null;
  }

  // ===== 计算单张打牌价值 =====
  private calculateDiscardValue(tile: Tile, player: PlayerState, gameState: GameState): number {
    let value = 0;

    // 1. 安全度评估（打掉字牌和边缘牌更安全）
    value += this.getSafetyValue(tile, gameState);

    // 2. 搭子价值评估（保留有效搭子）
    value -= this.getTileUtility(tile, player);

    // 3. 孤立程度（孤张牌优先打）
    value += this.getIsolationPenalty(tile, player);

    // 4. 向听数影响
    value += this.getShantenImpact(tile, player);

    // 5. 随机扰动（简单难度）
    if (this.difficulty === 1) {
      value += (Math.random() - 0.5) * 2;
    }

    return value;
  }

  // 安全度评估
  private getSafetyValue(tile: Tile, gameState: GameState): number {
    let safety = 0;

    // 字牌（风/三元）相对安全（被人碰走概率低）
    if (tile.suit === TileSuit.Wind || tile.suit === TileSuit.Dragon) {
      safety += 1;
    }

    // 检查是否有人在立直
    for (const p of gameState.players) {
      if (p.isRiichi) {
        // 检查这张牌是否是某人听牌中的危险牌
        if (p.waitingTiles.length > 0) {
          const isDangerous = p.waitingTiles.some(wt => tilesEqual(wt, tile));
          if (isDangerous) safety -= 5;
        }
      }
    }

    // 检查近期舍牌（打出过的牌相对安全）
    for (const disc of gameState.discardPile) {
      for (const d of disc) {
        if (tilesEqual(d, tile)) {
          safety += 0.5; // 已被打过，降低危险
          break;
        }
      }
    }

    return safety;
  }

  // 搭子效用评估
  private getTileUtility(tile: Tile, player: PlayerState): number {
    if (!isNumberTile(tile)) return 0;
    const rank = tile.rank;
    const suit = tile.suit;

    let utility = 0;

    // 顺子搭子：1-2、2-3、7-8、8-9 是好的边搭
    const isEdge = (rank === 1 || rank === 9);
    const isNearEdge = (rank === 2 || rank === 8);
    const isCenter = (rank >= 3 && rank <= 7);

    if (isCenter) {
      // 中张牌价值高（可构成多种顺子）
      utility += 3;
    } else if (isNearEdge) {
      utility += 1;
    }

    // 检查是否有相邻牌可构成搭子
    const handKeys = new Set(player.hand.map(t => tileKey(t)));
    const rankOptions = [rank - 2, rank - 1, rank + 1, rank + 2]
      .filter(r => r >= 1 && r <= 9);

    for (const r of rankOptions) {
      const key = `${suit}-${r}`;
      if (handKeys.has(key)) {
        utility += 2; // 搭子连接
      }
    }

    // 对子价值高，不要拆
    const pairCount = player.hand.filter(t => tilesEqual(t, tile)).length;
    if (pairCount >= 2) {
      utility += 10;
    }
    if (pairCount >= 3) {
      utility += 20; // 可以做刻子
    }

    return utility;
  }

  // 孤立程度惩罚
  private getIsolationPenalty(tile: Tile, player: PlayerState): number {
    if (!isNumberTile(tile)) {
      // 字牌：检查是否已有一对
      const pairCount = player.hand.filter(t => tilesEqual(t, tile)).length;
      if (pairCount === 0) return 0; // 单张字牌惩罚
      return 0;
    }

    const rank = tile.rank;
    const suit = tile.suit;

    // 检查两侧1格是否有牌
    let adjacent = 0;
    for (const t of player.hand) {
      if (t.suit === suit && Math.abs(t.rank - rank) === 1) {
        adjacent++;
      }
    }

    if (adjacent === 0) {
      // 完全孤张，惩罚高
      if (rank === 1 || rank === 9) return 3; // 边张孤张
      if (rank === 2 || rank === 8) return 2; // 次边张
      return 4; // 中张孤张
    }

    return 0;
  }

  // 向听数影响
  private getShantenImpact(tile: Tile, player: PlayerState): number {
    // 简化：模拟打掉这张牌后的向听数变化
    const testHand = player.hand.filter(t => !tilesEqual(t, tile));
    const currentShanten = this.estimateShanten(player.hand);
    const afterShanten = this.estimateShanten(testHand);
    return (currentShanten - afterShanten) * 2; // 打这张牌让向听数变差多少
  }

  // 估计向听数（简化算法）
  private estimateShanten(hand: Tile[]): number {
    // 经验公式：向听数 ≈ 6 - (面子数) - (对子折算)
    // 完整麻将向听数计算很复杂，这里用简化版

    // 统计面子候选
    const groups = new Map<string, number>();
    for (const t of hand) {
      groups.set(tileKey(t), (groups.get(tileKey(t)) || 0) + 1);
    }

    let melds = 0;
    let pairs = 0;

    // 刻子
    for (const [, count] of groups) {
      melds += Math.floor(count / 3);
    }

    // 对子
    for (const [, count] of groups) {
      if (count % 3 === 2) pairs++;
    }

    // 顺子（简化：检查搭子）
    for (const suit of [TileSuit.Man, TileSuit.Pin, TileSuit.Sou]) {
      for (let r = 1; r <= 7; r++) {
        const c1 = groups.get(`${suit}-${r}`) || 0;
        const c2 = groups.get(`${suit}-${r + 1}`) || 0;
        const c3 = groups.get(`${suit}-${r + 2}`) || 0;
        if (c1 > 0 && c2 > 0 && c3 > 0) melds++;
      }
    }

    const tileCount = hand.length;
    const neededForMenzen = tileCount - (melds * 3 + pairs * 2);
    return Math.max(0, Math.ceil(neededForMenzen / 3));
  }

  // ===== 碰/杠/吃决策 =====
  decidePon(player: PlayerState, gameState: GameState): boolean {
    // 简单难度：偶尔碰
    // 中等：通常碰（除非严重影响做牌）
    // 困难：计算期望值

    if (this.difficulty === 1) {
      return Math.random() < 0.5;
    }
    return true; // 简化：基本都碰
  }

  decideKan(player: PlayerState, gameState: GameState): boolean {
    // 杠会损失1张手牌，通常需要很强的手牌才杠
    // 简化：如果有4张相同牌且已听牌，则杠
    const waiting = getWaitingTiles(player.hand);
    return waiting.length > 0;
  }

  decideChi(player: PlayerState, gameState: GameState): boolean {
    // 简化：通常不吃（吃会破坏手牌）
    if (this.difficulty === 3) return false;
    if (player.melds.length > 0) return false; // 已有副露，不吃
    // 检查是否对做牌有很大帮助
    return Math.random() < 0.3;
  }

  // ===== 立直决策 =====
  shouldRiichi(player: PlayerState, gameState: GameState): boolean {
    if (player.melds.length > 0) return false; // 非门前清
    if (player.score < 1000) return false; // 没钱

    // 检查是否听牌
    const waiting = getWaitingTiles(player.hand);
    if (waiting.length === 0) return false;

    // 困难AI：更多立直
    if (this.difficulty === 3) return true;
    if (this.difficulty === 2) return Math.random() < 0.8;
    return Math.random() < 0.5;
  }
}
