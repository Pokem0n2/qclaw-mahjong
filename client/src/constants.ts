import { TileSuit, Tile } from './types';

// 牌面显示名称
export const SUIT_NAMES: Record<TileSuit, string> = {
  [TileSuit.Man]: '万',
  [TileSuit.Pin]: '筒',
  [TileSuit.Sou]: '条',
  [TileSuit.Wind]: '风',
  [TileSuit.Dragon]: '三元',
};

// 风牌名称
export const WIND_NAMES = ['东', '南', '西', '北'];

// 三元牌名称
export const DRAGON_NAMES = ['白', '發', '中'];

// 数字中文表示（万子用）
export const NUMBER_NAMES = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

// 颜色配置
export const COLORS = {
  man: '#dc2626',    // 红色（万子）
  pin: '#2563eb',    // 蓝色（筒子）
  sou: '#16a34a',    // 绿色（条子）
  wind: '#1f2937',   // 深灰（风牌）
  dragon: '#1f2937', // 深灰（三元牌）
  tile: '#fefce8',   // 牌面底色（米黄色）
  tileBack: '#166534', // 牌背（深绿色）
  table: '#14532d',  // 牌桌（深绿色）
};

// 创建完整牌墙（136张牌 + 4张赤宝牌 = 140张）
export function createFullWall(): Tile[] {
  const tiles: Tile[] = [];
  let id = 0;

  // 数牌：万、筒、条各1-9，每种4张
  [TileSuit.Man, TileSuit.Pin, TileSuit.Sou].forEach(suit => {
    for (let rank = 1; rank <= 9; rank++) {
      for (let i = 0; i < 4; i++) {
        tiles.push({
          id: id++,
          suit,
          rank,
          isRed: false,
        });
      }
    }
  });

  // 风牌：东南西北各4张
  for (let rank = 1; rank <= 4; rank++) {
    for (let i = 0; i < 4; i++) {
      tiles.push({
        id: id++,
        suit: TileSuit.Wind,
        rank,
        isRed: false,
      });
    }
  }

  // 三元牌：白发中各4张
  for (let rank = 1; rank <= 3; rank++) {
    for (let i = 0; i < 4; i++) {
      tiles.push({
        id: id++,
        suit: TileSuit.Dragon,
        rank,
        isRed: false,
      });
    }
  }

  return tiles;
}

// 获取牌面显示文本
export function getTileDisplay(tile: Tile): string {
  if (tile.suit === TileSuit.Wind) {
    return WIND_NAMES[tile.rank - 1];
  }
  if (tile.suit === TileSuit.Dragon) {
    return DRAGON_NAMES[tile.rank - 1];
  }
  if (tile.suit === TileSuit.Man) {
    return `${NUMBER_NAMES[tile.rank - 1]}万`;
  }
  if (tile.suit === TileSuit.Pin) {
    // 筒子用圆圈数字
    const circles = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];
    return circles[tile.rank - 1];
  }
  if (tile.suit === TileSuit.Sou) {
    return `${tile.rank}条`;
  }
  return '';
}

// 获取牌面颜色
export function getTileColor(tile: Tile): string {
  return COLORS[tile.suit];
}
