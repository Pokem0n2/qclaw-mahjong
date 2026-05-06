// ===== 麻将牌定义 =====

import { Tile, TileSuit } from './types';

let globalTileId = 0;

// 万子 1-9, 每种4张
function makeManTiles(): Tile[] {
  const tiles: Tile[] = [];
  for (let rank = 1; rank <= 9; rank++) {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({ id: globalTileId++, suit: TileSuit.Man, rank, isRed: false });
    }
  }
  return tiles;
}

// 筒子 1-9, 每种4张
function makePinTiles(): Tile[] {
  const tiles: Tile[] = [];
  for (let rank = 1; rank <= 9; rank++) {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({ id: globalTileId++, suit: TileSuit.Pin, rank, isRed: false });
    }
  }
  return tiles;
}

// 条子 1-9, 每种4张
function makeSouTiles(): Tile[] {
  const tiles: Tile[] = [];
  for (let rank = 1; rank <= 9; rank++) {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({ id: globalTileId++, suit: TileSuit.Sou, rank, isRed: false });
    }
  }
  return tiles;
}

// 风牌 东南西北, 每种4张
function makeWindTiles(): Tile[] {
  const tiles: Tile[] = [];
  for (let rank = 1; rank <= 4; rank++) {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({ id: globalTileId++, suit: TileSuit.Wind, rank, isRed: false });
    }
  }
  return tiles;
}

// 三元牌 白发中, 每种4张
function makeDragonTiles(): Tile[] {
  const tiles: Tile[] = [];
  for (let rank = 1; rank <= 3; rank++) {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({ id: globalTileId++, suit: TileSuit.Dragon, rank, isRed: false });
    }
  }
  return tiles;
}

// 创建全部144张牌
export function createAllTiles(): Tile[] {
  globalTileId = 0;
  return [
    ...makeManTiles(),
    ...makePinTiles(),
    ...makeSouTiles(),
    ...makeWindTiles(),
    ...makeDragonTiles()
  ];
}

// Fisher-Yates 洗牌
export function shuffleTiles(tiles: Tile[], seed?: number): Tile[] {
  const arr = [...tiles];
  let rng: () => number;
  if (seed !== undefined) {
    let state = seed;
    rng = () => {
      state = (state * 1664525 + 1013904223) & 0xffffffff;
      return (state >>> 0) / 0xffffffff;
    };
  } else {
    rng = Math.random;
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 获取牌的显示名称
export function getTileName(tile: Tile): string {
  const suits: Record<string, string[]> = {
    [TileSuit.Man]: ['一', '二', '三', '四', '五', '六', '七', '八', '九'],
    [TileSuit.Pin]: ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'],
    [TileSuit.Sou]: ['１', '２', '３', '４', '５', '６', '７', '８', '９'],
    [TileSuit.Wind]: ['東', '南', '西', '北'],
    [TileSuit.Dragon]: ['白', '發', '中']
  };
  const names = suits[tile.suit];
  const name = names ? names[tile.rank - 1] : '?';
  return tile.isRed ? `赤${name}` : name;
}

// 获取牌的唯一键（用于比较）
export function tileKey(tile: Tile): string {
  return `${tile.suit}-${tile.rank}`;
}

// 牌是否相同（按 suit+rank）
export function tilesEqual(a: Tile, b: Tile): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

// 牌是否属于数牌
export function isNumberTile(tile: Tile): boolean {
  return tile.suit === TileSuit.Man || tile.suit === TileSuit.Pin || tile.suit === TileSuit.Sou;
}

// 判断顺子关系
export function isNextInSequence(tile1: Tile, tile2: Tile): boolean {
  return tile1.suit === tile2.suit &&
    tile1.suit !== TileSuit.Wind &&
    tile1.suit !== TileSuit.Dragon &&
    tile2.rank === tile1.rank + 1;
}

// 判断三张牌是否构成顺子
export function isSequence(tiles: Tile[]): boolean {
  if (tiles.length !== 3) return false;
  if (tiles[0].suit !== tiles[1].suit || tiles[1].suit !== tiles[2].suit) return false;
  if (tiles[0].suit === TileSuit.Wind || tiles[0].suit === TileSuit.Dragon) return false;
  return tiles[1].rank === tiles[0].rank + 1 && tiles[2].rank === tiles[1].rank + 1;
}

// 判断三张牌是否构成刻子
export function isTriplet(tiles: Tile[]): boolean {
  if (tiles.length !== 3) return false;
  return tiles.every(t => t.suit === tiles[0].suit && t.rank === tiles[0].rank);
}

// 判断两张牌是否构成对子
export function isPair(t1: Tile, t2: Tile): boolean {
  return t1.suit === t2.suit && t1.rank === t2.rank;
}
