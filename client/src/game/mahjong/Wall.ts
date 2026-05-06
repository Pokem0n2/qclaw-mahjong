// ===== 牌墙管理 =====

import { Tile } from './types';
import { createAllTiles, shuffleTiles } from './Tile';

export class Wall {
  private tiles: Tile[] = [];
  private deadEnd: number = 0;
  private index: number = 0;
  private doraIndicators: Tile[] = [];
  private kanIndicatorIndex: number = 0;

  constructor(seed?: number, extraDoraCount: number = 0) {
    this.reset(seed, extraDoraCount);
  }

  reset(seed?: number, extraDoraCount: number = 0): void {
    this.tiles = shuffleTiles(createAllTiles(), seed);
    this.index = 0;
    this.deadEnd = this.tiles.length - 1;
    this.kanIndicatorIndex = this.tiles.length - 14;
    this.doraIndicators = [];
  }

  draw(): Tile | null {
    if (this.index >= this.deadEnd) return null;
    return this.tiles[this.index++];
  }

  drawRinshan(): Tile | null {
    if (this.index >= this.tiles.length) return null;
    return this.tiles[this.index++];
  }

  remaining(): number {
    return Math.max(0, this.deadEnd - this.index);
  }

  drawn(): number {
    return this.index;
  }

  setDeadEnd(turns: number): void {
    this.deadEnd = this.tiles.length - 2;
  }

  revealDora(extraCount: number = 0): Tile[] {
    const startIndex = 14;
    const count = 1 + extraCount;
    this.doraIndicators = [];
    for (let i = 0; i < count; i++) {
      if (startIndex + i < this.tiles.length) {
        this.doraIndicators.push(this.tiles[startIndex + i]);
      }
    }
    return this.doraIndicators;
  }

  revealNextDora(): Tile | null {
    const pos = 14 + this.doraIndicators.length;
    if (pos < this.tiles.length) {
      const dora = this.tiles[pos];
      this.doraIndicators.push(dora);
      return dora;
    }
    return null;
  }

  getDoraIndicators(): Tile[] {
    return [...this.doraIndicators];
  }

  getDoraCount(): number {
    return this.doraIndicators.length;
  }

  getDeadWallIndex(): number {
    return this.tiles.length - 14;
  }

  getAllTiles(): Tile[] {
    return [...this.tiles];
  }
}
