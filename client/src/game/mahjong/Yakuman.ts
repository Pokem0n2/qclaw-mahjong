// ===== 简化版役种判定 =====

import { Tile, Meld, Yaku, TileSuit } from './types';
import { tileKey, isNumberTile } from './Tile';

export interface YakuContext {
  hand: Tile[];
  melds: Meld[];
  isMenzen: boolean;
  isRiichi: boolean;
  isIppatsu: boolean;
  isTsumo: boolean;
  doraIndicators: Tile[];
}

export function detectYakus(ctx: YakuContext): Yaku[] {
  const yakus: Yaku[] = [];

  if (ctx.isRiichi) yakus.push({ name: '立直', han: 1, isYakuman: false });
  if (ctx.isTsumo && ctx.isMenzen) yakus.push({ name: '门清自摸', han: 1, isYakman: false });
  
  // 断幺九
  if (isTanyao(ctx.hand)) yakus.push({ name: '断幺九', han: 1, isYakuman: false });
  
  // 役牌
  const yakuHai = countYakuHai(ctx);
  if (yakuHai > 0) yakus.push({ name: '役牌', han: yakuHai, isYakuman: false });

  // 七对子
  if (isChitoitsu(ctx.hand)) yakus.push({ name: '七对子', han: 2, isYakuman: false });
  
  // 国士无双
  if (isKokushi(ctx.hand)) yakus.push({ name: '国士无双', han: 13, isYakuman: true });

  // 宝牌
  const doraCount = countDora(ctx);
  if (doraCount > 0) yakus.push({ name: '宝牌', han: doraCount, isYakuman: false });

  return yakus;
}

function isTanyao(hand: Tile[]): boolean {
  for (const t of hand) {
    if (!isNumberTile(t)) return false;
    if (t.rank === 1 || t.rank === 9) return false;
  }
  return true;
}

function countYakuHai(ctx: YakuContext): number {
  let count = 0;
  const allTiles = [...ctx.hand];
  for (const m of ctx.melds) allTiles.push(...m.tiles);
  
  const groups = new Map<string, number>();
  for (const t of allTiles) {
    groups.set(tileKey(t), (groups.get(tileKey(t)) || 0) + 1);
  }

  // 三元牌
  for (let r = 1; r <= 3; r++) {
    if ((groups.get(`${TileSuit.Dragon}-${r}`) || 0) >= 3) count++;
  }
  // 风
  if ((groups.get(`${TileSuit.Wind}-1`) || 0) >= 3) count++;
  
  return count;
}

function isChitoitsu(hand: Tile[]): boolean {
  if (hand.length !== 14) return false;
  const groups = new Map<string, number>();
  for (const t of hand) {
    groups.set(tileKey(t), (groups.get(tileKey(t)) || 0) + 1);
  }
  if (groups.size !== 7) return false;
  for (const [, c] of groups) {
    if (c !== 2) return false;
  }
  return true;
}

function isKokushi(hand: Tile[]): boolean {
  if (hand.length !== 14) return false;
  const needed = new Set([
    `${TileSuit.Man}-1`, `${TileSuit.Man}-9`,
    `${TileSuit.Pin}-1`, `${TileSuit.Pin}-9`,
    `${TileSuit.Sou}-1`, `${TileSuit.Sou}-9`,
    `${TileSuit.Wind}-1`, `${TileSuit.Wind}-2`,
    `${TileSuit.Wind}-3`, `${TileSuit.Wind}-4`,
    `${TileSuit.Dragon}-1`, `${TileSuit.Dragon}-2`,
    `${TileSuit.Dragon}-3`,
  ]);
  const seen = new Set<string>();
  let pair = false;
  for (const t of hand) {
    const key = tileKey(t);
    if (needed.has(key)) {
      if (seen.has(key)) pair = true;
      else seen.add(key);
    } else {
      return false;
    }
  }
  return seen.size === 13 && pair;
}

function countDora(ctx: YakuContext): number {
  let count = 0;
  const allTiles = [...ctx.hand];
  for (const m of ctx.melds) allTiles.push(...m.tiles);
  
  const doraKeys = new Set(ctx.doraIndicators.map(d => {
    if (d.suit === TileSuit.Wind && d.rank === 4) return `${TileSuit.Wind}-1`;
    if (d.suit === TileSuit.Wind) return `${TileSuit.Wind}-${d.rank + 1}`;
    if (d.suit === TileSuit.Dragon && d.rank === 3) return `${TileSuit.Dragon}-1`;
    if (d.suit === TileSuit.Dragon) return `${TileSuit.Dragon}-${d.rank + 1}`;
    if (d.rank === 9) return `${d.suit}-1`;
    return `${d.suit}-${d.rank + 1}`;
  }));

  for (const t of allTiles) {
    if (doraKeys.has(tileKey(t))) count++;
    if (t.isRed) count++;
  }
  return count;
}

export function calculateHan(yakus: Yaku[]): number {
  return yakus.reduce((sum, y) => sum + y.han, 0);
}

export function calculatePoints(han: number, fu: number, isDealer: boolean): number {
  if (han >= 13) return isDealer ? 48000 : 32000;
  if (han >= 11) return isDealer ? 36000 : 24000;
  if (han >= 8) return isDealer ? 24000 : 16000;
  if (han >= 6) return isDealer ? 18000 : 12000;
  if (han >= 5) return isDealer ? 12000 : 8000;
  
  let base = fu * Math.pow(2, han + 2);
  if (base > 2000) base = 2000;
  
  return isDealer ? Math.ceil(base * 6 / 100) * 100 : Math.ceil(base * 4 / 100) * 100;
}
