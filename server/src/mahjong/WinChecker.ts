// ===== 和牌判定 =====

import { Tile, Meld, WinResult, Yaku, TileSuit } from './types';
import { tilesEqual, tileKey, isNumberTile } from './Tile';

// 手牌（不含副露）分析
export class WinChecker {
  private hand: Tile[] = [];
  private fixedMelds: Meld[] = [];
  private isMenzen: boolean = true; // 是否门前清

  setHand(hand: Tile[], fixedMelds: Meld[], isMenzen: boolean = true): void {
    this.hand = [...hand];
    this.fixedMelds = [...fixedMelds];
    this.isMenzen = isMenzen;
  }

  // 入口：检查是否和牌
  canWin(): boolean {
    if (this.hand.length % 3 !== 2) return false;
    // 先检查特殊形
    if (this.checkSevenPairs()) return true;
    if (this.checkThirteenOrphans()) return true;
    // 再检查普通形
    return this.checkNormalForm();
  }

  // === 七对子 ===
  private checkSevenPairs(): boolean {
    if (this.hand.length !== 14) return false;
    const groups = new Map<string, Tile[]>();
    for (const t of this.hand) {
      const key = tileKey(t);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    if (groups.size !== 7) return false;
    for (const [, tiles] of groups) {
      if (tiles.length !== 2) return false;
    }
    return true;
  }

  // === 国士无双 ===
  private checkThirteenOrphans(): boolean {
    if (this.hand.length !== 14) return false;
    const needed: Array<{ suit: TileSuit; rank: number }> = [
      { suit: TileSuit.Man, rank: 1 }, { suit: TileSuit.Man, rank: 9 },
      { suit: TileSuit.Pin, rank: 1 }, { suit: TileSuit.Pin, rank: 9 },
      { suit: TileSuit.Sou, rank: 1 }, { suit: TileSuit.Sou, rank: 9 },
      { suit: TileSuit.Wind, rank: 1 }, { suit: TileSuit.Wind, rank: 2 },
      { suit: TileSuit.Wind, rank: 3 }, { suit: TileSuit.Wind, rank: 4 },
      { suit: TileSuit.Dragon, rank: 1 }, { suit: TileSuit.Dragon, rank: 2 },
      { suit: TileSuit.Dragon, rank: 3 },
    ];
    const handSet = new Set(this.hand.map(t => tileKey(t)));
    let hasPair = false;
    const neededSet = new Set(needed.map(n => `${n.suit}-${n.rank}`));
    for (const t of this.hand) {
      const key = tileKey(t);
      if (neededSet.has(key)) {
        neededSet.delete(key);
      } else if (handSet.has(key) && !hasPair) {
        // 这张是多余的一张，构成对子
        hasPair = true;
      }
    }
    return neededSet.size === 0 && hasPair;
  }

  // === 普通形：4面子+1对 ===
  private checkNormalForm(): boolean {
    const sorted = [...this.hand].sort((a, b) => {
      if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
      return a.rank - b.rank;
    });
    // 从手牌中取一个对子，其余拆成面子
    const pairIndex = this.findPairIndex(sorted);
    if (pairIndex === -1) return false;
    const pair = [sorted[pairIndex], sorted[pairIndex + 1]];
    const rest = [...sorted.slice(0, pairIndex), ...sorted.slice(pairIndex + 2)];
    return this.splitIntoMelds(rest);
  }

  private findPairIndex(sorted: Tile[]): number {
    for (let i = 0; i < sorted.length - 1; i++) {
      if (tilesEqual(sorted[i], sorted[i + 1])) {
        // 检查是否造成无法分割（简化：取第一个有效对子）
        return i;
      }
    }
    return -1;
  }

  // 递归拆分 rest 为面子（每组3张）
  private splitIntoMelds(tiles: Tile[]): boolean {
    if (tiles.length === 0) return true;
    if (tiles.length % 3 !== 0) return false;

    // 找第一张牌
    const first = tiles[0];
    const firstIdx = tiles.findIndex(t => tilesEqual(t, first));

    // 尝试刻子（3张相同）
    const tripletCount = tiles.filter(t => tilesEqual(t, first)).length;
    if (tripletCount >= 3) {
      const triplet = [first];
      let cnt = 1;
      for (let i = firstIdx + 1; i < tiles.length && cnt < 3; i++) {
        if (tilesEqual(tiles[i], first)) {
          triplet.push(tiles[i]);
          cnt++;
        }
      }
      if (cnt === 3) {
        const rest = tiles.filter((_, i) => !triplet.map(t => t.id).includes(i));
        // 简化：直接构建剩余
        const usedIdxs = new Set<number>();
        let c = 0;
        for (let i = 0; i < tiles.length && c < 3; i++) {
          if (!usedIdxs.has(i) && tilesEqual(tiles[i], first)) {
            usedIdxs.add(i);
            c++;
          }
        }
        const rest2 = tiles.filter((_, i) => !usedIdxs.has(i));
        if (this.splitIntoMelds(rest2)) return true;
      }
    }

    // 尝试顺子（数牌）
    if (isNumberTile(first)) {
      // 找顺子: first, first+1, first+2
      let next1: Tile | null = null;
      let next2: Tile | null = null;
      for (const t of tiles) {
        if (t.id !== first.id && t.suit === first.suit && t.rank === first.rank + 1 && !next1) {
          next1 = t;
        }
      }
      if (next1) {
        for (const t of tiles) {
          if (t.id !== first.id && t.id !== next1.id && t.suit === first.suit && t.rank === first.rank + 2 && !next2) {
            next2 = t;
          }
        }
      }
      if (next1 && next2) {
        const usedIdxs = new Set<number>([firstIdx, tiles.indexOf(next1), tiles.indexOf(next2)]);
        const rest = tiles.filter((_, i) => !usedIdxs.has(i));
        if (this.splitIntoMelds(rest)) return true;
      }
    }

    return false;
  }

  // ===== 计算听牌列表 =====
  getWaitingTiles(): Tile[] {
    // 遍历所有牌，看打哪张能听
    const waiting: Tile[] = [];
    const tileTypes = this.getUniqueTileTypes(this.hand);
    for (const tileType of tileTypes) {
      const testHand = this.hand.filter(t => !tilesEqual(t, tileType));
      if (testHand.length === 13) {
        this.hand = testHand;
        if (this.canWin()) {
          waiting.push(tileType);
        }
        this.hand = this.hand.concat([tileType]);
      }
    }
    return waiting;
  }

  private getUniqueTileTypes(tiles: Tile[]): Tile[] {
    const seen = new Set<string>();
    const result: Tile[] = [];
    for (const t of tiles) {
      const key = tileKey(t);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(t);
      }
    }
    return result;
  }

  // ===== 听牌检查 =====
  isTenpai(): boolean {
    return this.getWaitingTiles().length > 0;
  }

  // ===== 获取和牌形 =====
  getWinningForm(): { hand: Tile[]; pair: Tile[]; melds: Tile[][] } | null {
    // 简化：返回当前手牌
    if (!this.canWin()) return null;
    return { hand: this.hand, pair: [], melds: [] };
  }
}

// 和牌判定函数（静态）
export function checkWin(hand: Tile[], melds: Meld[], isMenzen: boolean): boolean {
  const checker = new WinChecker();
  checker.setHand(hand, melds, isMenzen);
  return checker.canWin();
}

// 获取听牌列表
export function getWaitingTiles(hand: Tile[]): Tile[] {
  const checker = new WinChecker();
  checker.setHand(hand, [], true);
  return checker.getWaitingTiles();
}
