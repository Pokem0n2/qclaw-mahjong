// ===== 牌墙管理 =====

import { Tile } from './types';
import { createAllTiles, shuffleTiles } from './Tile';

export class Wall {
  private tiles: Tile[] = [];
  private deadEnd: number = 0; // 岭上牌位置（摸到这里停止）
  private index: number = 0;   // 当前摸牌位置
  private doraIndicators: Tile[] = [];
  private kanIndicatorIndex: number = 0; // 杠后宝牌指示位置

  constructor(seed?: number, extraDoraCount: number = 0) {
    this.reset(seed, extraDoraCount);
  }

  reset(seed?: number, extraDoraCount: number = 0): void {
    this.tiles = shuffleTiles(createAllTiles(), seed);
    this.index = 0;
    this.deadEnd = this.tiles.length - 1; // 默认到倒数第1张
    // 设置岭上牌区域：倒数14张为岭上+王牌
    // 每杠一次，摸牌位置前移，补1张岭上牌
    // 通常麻将：14张王牌（岭上4+宝牌指示5+杠宝牌5），实际用倒数16张
    this.kanIndicatorIndex = this.tiles.length - 14;
    this.doraIndicators = [];
  }

  // 摸牌（正常摸）
  draw(): Tile | null {
    if (this.index >= this.deadEnd) return null;
    return this.tiles[this.index++];
  }

  // 摸岭上牌（杠后补牌）
  drawRinshan(): Tile | null {
    if (this.index >= this.tiles.length) return null;
    return this.tiles[this.index++];
  }

  // 获取当前剩余牌数
  remaining(): number {
    return Math.max(0, this.deadEnd - this.index);
  }

  // 获取已摸牌数
  drawn(): number {
    return this.index;
  }

  // 设置和牌结束位置（流局判定）
  setDeadEnd(turns: number): void {
    // 每轮回14张（4人×3+2王牌），留2张王牌
    // 通常14张留尾，实际游戏可以调整
    this.deadEnd = this.tiles.length - 2;
  }

  // 翻开宝牌指示牌
  revealDora(extraCount: number = 0): Tile[] {
    // 第一张：index 14（摸14张后），后续每杠翻一张
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

  // 翻开下一张宝牌指示牌（杠后）
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

  // 获取宝牌数量
  getDoraCount(): number {
    return this.doraIndicators.length;
  }

  // 获取王牌指示位置（用于计算流局）
  getDeadWallIndex(): number {
    return this.tiles.length - 14;
  }

  // 获取所有牌（测试用）
  getAllTiles(): Tile[] {
    return [...this.tiles];
  }
}
