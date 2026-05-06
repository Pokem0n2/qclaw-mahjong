// ===== 手牌管理 =====

import { Tile, Meld, MeldType, AvailableActions, ChiOption, PlayerState } from './types';
import { tilesEqual, tileKey, isSequence, isTriplet, isPair, isNumberTile } from './Tile';

export class Hand {
  private tiles: Tile[] = [];

  constructor(initialTiles: Tile[] = []) {
    this.tiles = [...initialTiles];
  }

  getTiles(): Tile[] {
    return [...this.tiles];
  }

  // 摸牌
  draw(tile: Tile): void {
    this.tiles.push(tile);
  }

  // 打牌（按 tile id）
  discard(tileId: number): Tile | null {
    const idx = this.tiles.findIndex(t => t.id === tileId);
    if (idx === -1) return null;
    return this.tiles.splice(idx, 1)[0];
  }

  // 排序（按 suit 优先级，再按 rank）
  sort(): void {
    const suitOrder: Record<string, number> = {
      'man': 0, 'pin': 1, 'sou': 2, 'wind': 3, 'dragon': 4
    };
    this.tiles.sort((a, b) => {
      const s1 = suitOrder[a.suit] ?? 5;
      const s2 = suitOrder[b.suit] ?? 5;
      if (s1 !== s2) return s1 - s2;
      return a.rank - b.rank;
    });
  }

  // 手牌数量
  size(): number {
    return this.tiles.length;
  }

  // 检查听牌
  isTenpai(): boolean {
    // 检查每张牌打出后能否和牌（简化：检查是否有搭子）
    // 完整实现需要调用 WinChecker
    return false; // 由 WinChecker 判定
  }

  // ===== 副露操作 =====

  // 吃：需要3张牌构成顺子
  // 下家打 tile，手里有 tile-1 和 tile-2
  // chiOptions: 从手牌中找出所有可以吃的组合
  getChiOptions(discardTile: Tile): ChiOption[] {
    const options: ChiOption[] = [];
    if (!isNumberTile(discardTile)) return options;
    if (discardTile.rank === 1) {
      // 只能吃 1+2+3，去掉 rank 2 的牌
      options.push(...this.findChiSequence(discardTile, 2));
    } else if (discardTile.rank === 9) {
      // 只能吃 7+8+9，去掉 rank 8 的牌
      options.push(...this.findChiSequence(discardTile, 8));
    } else {
      // rank 2-8: 可能有两种吃法
      options.push(...this.findChiSequence(discardTile, discardTile.rank - 1));
      options.push(...this.findChiSequence(discardTile, discardTile.rank + 1));
    }
    return options;
  }

  private findChiSequence(discardTile: Tile, middleRank: number): ChiOption[] {
    const options: ChiOption[] = [];
    const { suit } = discardTile;
    const lowRank = middleRank - 1;
    const highRank = middleRank + 1;

    // 找 lowRank 的牌（去掉 discardTile）
    const lowTiles = this.tiles.filter(t =>
      t.suit === suit && t.rank === lowRank && !tilesEqual(t, discardTile)
    );
    // 找 highRank 的牌（去掉 discardTile）
    const highTiles = this.tiles.filter(t =>
      t.suit === suit && t.rank === highRank && !tilesEqual(t, discardTile)
    );

    if (lowTiles.length > 0 && highTiles.length > 0) {
      // 取第一张
      options.push({
        tiles: [lowTiles[0], discardTile, highTiles[0]],
        fromPlayer: -1 // 待确定
      });
    }
    return options;
  }

  // 碰：手里有2张相同牌
  canPon(discardTile: Tile): boolean {
    return this.tiles.filter(t => tilesEqual(t, discardTile)).length >= 2;
  }

  // 杠：手里有3张相同牌
  canKan(discardTile: Tile): boolean {
    return this.tiles.filter(t => tilesEqual(t, discardTile)).length >= 3;
  }

  // 手牌暗杠检查
  getKanCandidates(): Tile[][] {
    const groups = new Map<string, Tile[]>();
    for (const t of this.tiles) {
      const key = tileKey(t);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    const candidates: Tile[][] = [];
    for (const [, tiles] of groups) {
      if (tiles.length >= 4) {
        candidates.push(tiles.slice(0, 4));
      }
    }
    return candidates;
  }

  // ===== 可用动作 =====

  getAvailableActions(
    discardTile: Tile | null,
    lastDiscardPlayer: number,
    isAfterDraw: boolean,
    currentPlayer: number
  ): AvailableActions {
    const result: AvailableActions = {
      canChi: false,
      canPon: false,
      canKan: false,
      canRon: false,
      canRiichi: false,
      canTsumo: false,
      canSkip: true
    };

    if (!discardTile || !isAfterDraw) {
      // 摸牌后：只能自摸
      if (this.isTenpai()) {
        result.canTsumo = true;
        result.canRon = true;
      }
      return result;
    }

    // 荣和检查
    if (discardTile) {
      result.canRon = true; // 由 WinChecker 判定
    }

    // 吃：仅下家
    if (lastDiscardPlayer === (currentPlayer + 3) % 4 && discardTile) {
      result.canChi = true;
      result.chiOptions = this.getChiOptions(discardTile);
    }

    // 碰
    if (discardTile && this.canPon(discardTile)) {
      result.canPon = true;
      result.ponTile = discardTile;
    }

    // 杠
    if (discardTile && this.canKan(discardTile)) {
      result.canKan = true;
      result.kanTile = discardTile;
    }

    // 暗杠
    // （简化：摸牌后检查）

    return result;
  }

  // ===== 搭子分析 =====

  // 计算向听数（离听牌还差多少张）
  countShanten(hand: Tile[], melds: Meld[]): number {
    // 提取所有面子
    const allTiles = [...hand];
    for (const m of melds) {
      allTiles.push(...m.tiles);
    }
    // 简化计算：14张牌，4面子+1对=7组，需3+3+3+3+2=14张
    // 完整实现很复杂，这里用经验公式
    return 6; // 占位
  }

  // ===== 副露相关 =====

  // 添加副露（吃/碰/杠后从手牌移除）
  applyMeld(meld: Meld): void {
    const tilesToRemove = meld.tiles.filter(t => !t.isRed || meld.type === 'chi');
    for (const tile of meld.tiles) {
      if (meld.type !== 'chi' || tile.suit === meld.tiles[0].suit) {
        const idx = this.tiles.findIndex(t => t.id === tile.id);
        if (idx !== -1) this.tiles.splice(idx, 1);
      }
    }
  }
}
