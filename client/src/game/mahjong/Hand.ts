// ===== 手牌管理 =====

import { Tile, Meld, AvailableActions, ChiOption, PlayerState } from './types';
import { tilesEqual, tileKey, isSequence, isTriplet, isPair, isNumberTile } from './Tile';

export class Hand {
  private tiles: Tile[] = [];

  constructor(initialTiles: Tile[] = []) {
    this.tiles = [...initialTiles];
  }

  getTiles(): Tile[] {
    return [...this.tiles];
  }

  draw(tile: Tile): void {
    this.tiles.push(tile);
  }

  discard(tileId: number): Tile | null {
    const idx = this.tiles.findIndex(t => t.id === tileId);
    if (idx === -1) return null;
    return this.tiles.splice(idx, 1)[0];
  }

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

  size(): number {
    return this.tiles.length;
  }

  getChiOptions(discardTile: Tile): ChiOption[] {
    const options: ChiOption[] = [];
    if (!isNumberTile(discardTile)) return options;
    if (discardTile.rank === 1) {
      options.push(...this.findChiSequence(discardTile, 2));
    } else if (discardTile.rank === 9) {
      options.push(...this.findChiSequence(discardTile, 8));
    } else {
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

    const lowTiles = this.tiles.filter(t =>
      t.suit === suit && t.rank === lowRank && !tilesEqual(t, discardTile)
    );
    const highTiles = this.tiles.filter(t =>
      t.suit === suit && t.rank === highRank && !tilesEqual(t, discardTile)
    );

    if (lowTiles.length > 0 && highTiles.length > 0) {
      options.push({
        tiles: [lowTiles[0], discardTile, highTiles[0]],
        fromPlayer: -1
      });
    }
    return options;
  }

  canPon(discardTile: Tile): boolean {
    return this.tiles.filter(t => tilesEqual(t, discardTile)).length >= 2;
  }

  canKan(discardTile: Tile): boolean {
    return this.tiles.filter(t => tilesEqual(t, discardTile)).length >= 3;
  }

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

  applyMeld(meld: Meld): void {
    for (const tile of meld.tiles) {
      const idx = this.tiles.findIndex(t => t.id === tile.id);
      if (idx !== -1) this.tiles.splice(idx, 1);
    }
  }
}
