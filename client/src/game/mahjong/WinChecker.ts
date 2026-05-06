// ===== 和牌判定 =====

import { Tile, Meld, TileSuit } from './types';
import { tilesEqual, tileKey, isNumberTile } from './Tile';

export class WinChecker {
  private hand: Tile[] = [];
  private fixedMelds: Meld[] = [];
  private isMenzen: boolean = true;

  setHand(hand: Tile[], fixedMelds: Meld[], isMenzen: boolean = true): void {
    this.hand = [...hand];
    this.fixedMelds = [...fixedMelds];
    this.isMenzen = isMenzen;
  }

  canWin(): boolean {
    if (this.hand.length % 3 !== 2) return false;
    if (this.checkSevenPairs()) return true;
    if (this.checkThirteenOrphans()) return true;
    return this.checkNormalForm();
  }

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
    const neededSet = new Set(needed.map(n => `${n.suit}-${n.rank}`));
    let hasPair = false;
    const seen = new Set<string>();
    for (const t of this.hand) {
      const key = tileKey(t);
      if (neededSet.has(key)) {
        if (seen.has(key)) {
          if (!hasPair) hasPair = true;
          else return false;
        } else {
          seen.add(key);
        }
      } else {
        return false;
      }
    }
    return seen.size === 13 && hasPair;
  }

  private checkNormalForm(): boolean {
    const sorted = [...this.hand].sort((a, b) => {
      if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
      return a.rank - b.rank;
    });
    for (let i = 0; i < sorted.length - 1; i++) {
      if (tilesEqual(sorted[i], sorted[i + 1])) {
        const rest = [...sorted.slice(0, i), ...sorted.slice(i + 2)];
        if (this.splitIntoMelds(rest)) return true;
      }
    }
    return false;
  }

  private splitIntoMelds(tiles: Tile[]): boolean {
    if (tiles.length === 0) return true;
    if (tiles.length % 3 !== 0) return false;

    const first = tiles[0];
    const count = tiles.filter(t => tilesEqual(t, first)).length;

    if (count >= 3) {
      const used = new Set<number>();
      let c = 0;
      for (let i = 0; i < tiles.length && c < 3; i++) {
        if (tilesEqual(tiles[i], first)) {
          used.add(i);
          c++;
        }
      }
      const rest = tiles.filter((_, i) => !used.has(i));
      if (this.splitIntoMelds(rest)) return true;
    }

    if (isNumberTile(first)) {
      const next1 = tiles.find(t => t.suit === first.suit && t.rank === first.rank + 1);
      const next2 = tiles.find(t => t.suit === first.suit && t.rank === first.rank + 2);
      if (next1 && next2) {
        const rest = tiles.filter(t => t.id !== first.id && t.id !== next1.id && t.id !== next2.id);
        if (this.splitIntoMelds(rest)) return true;
      }
    }

    return false;
  }

  getWaitingTiles(): Tile[] {
    const waiting: Tile[] = [];
    for (let suit = 0; suit < 5; suit++) {
      const maxRank = suit < 3 ? 9 : (suit === 3 ? 4 : 3);
      for (let rank = 1; rank <= maxRank; rank++) {
        const testTile: Tile = {
          id: -1,
          suit: [TileSuit.Man, TileSuit.Pin, TileSuit.Sou, TileSuit.Wind, TileSuit.Dragon][suit] as TileSuit,
          rank,
          isRed: false
        };
        const testHand = [...this.hand, testTile];
        this.hand = testHand;
        if (this.canWin()) {
          waiting.push(testTile);
        }
        this.hand = testHand.slice(0, -1);
      }
    }
    return waiting;
  }
}

export function checkWin(hand: Tile[], melds: Meld[], isMenzen: boolean): boolean {
  const checker = new WinChecker();
  checker.setHand(hand, melds, isMenzen);
  return checker.canWin();
}

export function getWaitingTiles(hand: Tile[]): Tile[] {
  const checker = new WinChecker();
  checker.setHand(hand, [], true);
  return checker.getWaitingTiles();
}
