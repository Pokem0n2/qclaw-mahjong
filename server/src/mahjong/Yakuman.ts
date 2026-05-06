// ===== 役种定义与判定 =====

import { Tile, Meld, Yaku, TileSuit, PlayerState } from './types';
import { tilesEqual, tileKey, isNumberTile } from './Tile';
import { WinChecker } from './WinChecker';

export interface YakuContext {
  hand: Tile[];
  melds: Meld[];
  isMenzen: boolean;          // 门前清（无副露）
  isRiichi: boolean;          // 立直
  isIppatsu: boolean;          // 一发
  isTsumo: boolean;           // 自摸
  isRinshan: boolean;         // 岭上开花
  isChankan: boolean;         // 枪杠
  isLastDraw: boolean;        // 海底摸月 / 河底荣和
  isDaburi: boolean;          // 多牌（不可能发生）
  isDoubleRiichi: boolean;    // 两立直
  doraIndicators: Tile[];     // 宝牌指示牌
  extraDoraCount: number;     // 额外宝牌数
  extraYaku?: string;          // Roguelike额外役
  extraHan?: number;           // Roguelike额外番
  player: PlayerState;         // 当前玩家
  winnerIndex: number;         // 和牌者索引
  dealerIndex: number;         // 庄家索引
  discardTile?: Tile;          // 点炮的牌
}

// 获取所有成立的役
export function detectYakus(ctx: YakuContext): Yaku[] {
  const yakus: Yaku[] = [];

  // === 基础役 ===
  if (ctx.isRiichi) yakus.push({ name: '立直', han: 1, isYakuman: false });
  if (ctx.isDoubleRiichi) yakus.push({ name: '两立直', han: 2, isYakuman: false });
  if (ctx.isTsumo) yakus.push({ name: '门清自摸', han: 1, isYakuman: false });
  if (ctx.isIppatsu) yakus.push({ name: '一发', han: 1, isYakuman: false });

  // 宝牌
  const doraCount = countDora(ctx);
  if (doraCount > 0) yakus.push({ name: '宝牌', han: doraCount, isYakuman: false });

  // 役牌
  const yakuHai = detectYakuHai(ctx);
  if (yakuHai > 0) yakus.push({ name: '役牌', han: yakuHai, isYakuman: false });

  // === 门前清限定役 ===
  if (ctx.isMenzen && ctx.melds.length === 0) {
    // 断幺九
    if (isTanyao(ctx.hand)) yakus.push({ name: '断幺九', han: 1, isYakuman: false });
    // 一杯口
    if (isIipeikou(ctx.hand)) yakus.push({ name: '一杯口', han: 1, isYakuman: false });
    // 平和（需门清+特定型）
    if (isPinfu(ctx.hand, ctx.melds, ctx.discardTile)) yakus.push({ name: '平和', han: 1, isYakuman: false });
  }

  // === 非门前清可 ====
  // 混全带幺
  if (isChanta(ctx.hand, ctx.melds, ctx.isMenzen)) yakus.push({ name: '混全带幺', han: ctx.isMenzen ? 2 : 1, isYakuman: false });
  // 纯全带幺
  if (isJunchan(ctx.hand, ctx.melds, ctx.isMenzen)) yakus.push({ name: '纯全带幺', han: ctx.isMenzen ? 3 : 2, isYakuman: false });
  // 一气通贯
  if (isIttsuu(ctx.hand, ctx.melds, ctx.isMenzen)) yakus.push({ name: '一气通贯', han: ctx.isMenzen ? 2 : 1, isYakuman: false });
  // 三色同顺
  if (isSanshoku(ctx.hand, ctx.melds, ctx.isMenzen)) yakus.push({ name: '三色同顺', han: ctx.isMenzen ? 2 : 1, isYakuman: false });
  // 混一色
  if (isHonitsu(ctx.hand, ctx.melds)) yakus.push({ name: '混一色', han: 3, isYakuman: false });
  // 清一色
  if (isChinitsu(ctx.hand, ctx.melds)) yakus.push({ name: '清一色', han: 6, isYakuman: false });
  // 二杯口
  if (isRyanpeikou(ctx.hand, ctx.isMenzen)) yakus.push({ name: '二杯口', han: 3, isYakuman: false });

  // === 特殊役 ===
  if (isChitoitsu(ctx.hand)) yakus.push({ name: '七对子', han: 2, isYakuman: false });
  if (isKokushimusou(ctx.hand)) yakus.push({ name: '国士无双', han: 13, isYakuman: true });

  // 字一色
  if (isTsuuiSou(ctx.hand, ctx.melds)) yakus.push({ name: '字一色', han: 13, isYakuman: true });
  // 绿一色
  if (isRyuiisou(ctx.hand, ctx.melds)) yakus.push({ name: '绿一色', han: 13, isYakuman: true });
  // 清老头
  if (isChinroutou(ctx.hand, ctx.melds)) yakus.push({ name: '清老头', han: 13, isYakuman: true });
  // 小四喜
  if (isShousuushii(ctx.hand, ctx.melds)) yakus.push({ name: '小四喜', han: 13, isYakuman: true });
  // 大四喜
  if (isDaisuushii(ctx.hand, ctx.melds)) yakus.push({ name: '大四喜', han: 13, isYakuman: true });
  // 九莲宝灯
  if (isChuurenpoutou(ctx.hand, ctx.isMenzen)) yakus.push({ name: '九莲宝灯', han: 13, isYakuman: true });

  // === 流局役 ===
  // （流局判定由 GameEngine 处理）

  // === 宝牌 ====
  // 宝牌在前面已处理

  // === Roguelike额外 ====
  if (ctx.extraYaku && ctx.extraHan) {
    yakus.push({ name: ctx.extraYaku, han: ctx.extraHan, isYakuman: false });
  }

  return yakus;
}

// ===== 役种具体判定 =====

// 宝牌数
function countDora(ctx: YakuContext): number {
  let count = 0;
  const allTiles = [...ctx.hand];
  for (const m of ctx.melds) allTiles.push(...m.tiles);
  const doraSet = new Set(ctx.doraIndicators.map(t => tileKey(t)));
  const redDoraSet = new Set<string>();
  // 赤宝牌：万5、筒5、条5
  for (const t of allTiles) {
    if (t.isRed) {
      // 找对应的宝牌
      const doraKey = getDoraKey({ suit: t.suit, rank: t.rank, id: -1, isRed: false });
      if (doraSet.has(doraKey)) count++;
    }
  }
  // 指示牌计数
  for (const d of ctx.doraIndicators) {
    const dKey = tileKey(d);
    for (const t of allTiles) {
      if (tileKey(t) === dKey) count++;
    }
  }
  return count;
}

function getDoraKey(dora: Tile): string {
  // 宝牌指示牌的下一张
  if (dora.suit === TileSuit.Man && dora.rank === 9) return `${TileSuit.Man}-1`;
  if (dora.suit === TileSuit.Pin && dora.rank === 9) return `${TileSuit.Pin}-1`;
  if (dora.suit === TileSuit.Sou && dora.rank === 9) return `${TileSuit.Sou}-1`;
  if (dora.suit === TileSuit.Wind && dora.rank === 4) return `${TileSuit.Wind}-1`;
  if (dora.suit === TileSuit.Wind && dora.rank === 1) return `${TileSuit.Wind}-2`;
  if (dora.suit === TileSuit.Wind && dora.rank === 2) return `${TileSuit.Wind}-3`;
  if (dora.suit === TileSuit.Dragon && dora.rank === 3) return `${TileSuit.Dragon}-1`;
  if (dora.suit === TileSuit.Dragon && dora.rank === 1) return `${TileSuit.Dragon}-2`;
  if (dora.suit === TileSuit.Dragon && dora.rank === 2) return `${TileSuit.Dragon}-3`;
  return `${dora.suit}-${dora.rank + 1}`;
}

// 役牌：三元牌 + 自风 + 场风
function detectYakuHai(ctx: YakuContext): number {
  let count = 0;
  const allTiles = [...ctx.hand];
  for (const m of ctx.melds) allTiles.push(...m.tiles);

  const yakuTileKeys = new Set<string>();
  // 三元牌
  yakuTileKeys.add(`${TileSuit.Dragon}-1`); // 白
  yakuTileKeys.add(`${TileSuit.Dragon}-2`); // 发
  yakuTileKeys.add(`${TileSuit.Dragon}-3`); // 中
  // 自风
  const windNames = ['east', 'south', 'west', 'north'];
  // 场风=东
  yakuTileKeys.add(`${TileSuit.Wind}-1`);
  // 自风
  const playerWindMap = [1, 2, 3, 4]; // 东风=1,南风=2...
  yakuTileKeys.add(`${TileSuit.Wind}-${playerWindMap[ctx.winnerIndex]}`);

  const tileSet = new Set(allTiles.map(t => tileKey(t)));
  for (const key of yakuTileKeys) {
    if (tileSet.has(key)) count++;
  }
  return count;
}

// 断幺九：不含1/9/字
function isTanyao(hand: Tile[]): boolean {
  const allTiles = hand;
  for (const t of allTiles) {
    if (!isNumberTile(t)) return false;
    if (t.rank === 1 || t.rank === 9) return false;
  }
  return true;
}

// 一杯口：同种数牌两个顺子（简化：检查手牌是否有两套相同顺子）
function isIipeikou(hand: Tile[]): boolean {
  // 统计所有面子
  const groups = new Map<string, number>();
  for (const t of hand) {
    const key = tileKey(t);
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  // 一杯口：同种花色有两个顺子
  for (const suit of [TileSuit.Man, TileSuit.Pin, TileSuit.Sou]) {
    let seqCount = 0;
    for (let rank = 1; rank <= 7; rank++) {
      const k1 = `${suit}-${rank}`;
      const k2 = `${suit}-${rank + 1}`;
      const k3 = `${suit}-${rank + 2}`;
      const c1 = groups.get(k1) || 0;
      const c2 = groups.get(k2) || 0;
      const c3 = groups.get(k3) || 0;
      if (c1 >= 1 && c2 >= 1 && c3 >= 1) seqCount++;
    }
    if (seqCount >= 2) return true;
  }
  return false;
}

// 平和（简化版）
function isPinfu(hand: Tile[], melds: Meld[], discardTile?: Tile): boolean {
  // 平和：4组顺子+非役牌对子（简化判定）
  // 完整平和需要特殊分析，这里用简化逻辑
  if (melds.length > 0) return false;
  // 检查是否有顺子
  const groups = new Map<string, number>();
  for (const t of hand) {
    groups.set(tileKey(t), (groups.get(tileKey(t)) || 0) + 1);
  }
  let seqCount = 0;
  for (const suit of [TileSuit.Man, TileSuit.Pin, TileSuit.Sou]) {
    for (let rank = 1; rank <= 7; rank++) {
      const c1 = groups.get(`${suit}-${rank}`) || 0;
      const c2 = groups.get(`${suit}-${rank + 1}`) || 0;
      const c3 = groups.get(`${suit}-${rank + 2}`) || 0;
      if (c1 >= 1 && c2 >= 1 && c3 >= 1) seqCount++;
    }
  }
  return seqCount >= 4;
}

// 混全带幺：每组面子都含1/9/字
function isChanta(hand: Tile[], melds: Meld[], isMenzen: boolean): boolean {
  const allTiles = [...hand];
  for (const m of melds) allTiles.push(...m.tiles);
  const yaochuTiles = new Set<string>();
  for (let r = 1; r <= 9; r++) {
    yaochuTiles.add(`${TileSuit.Man}-${r}`);
    yaochuTiles.add(`${TileSuit.Pin}-${r}`);
    yaochuTiles.add(`${TileSuit.Sou}-${r}`);
  }
  yaochuTiles.add(`${TileSuit.Wind}-1`);
  yaochuTiles.add(`${TileSuit.Wind}-2`);
  yaochuTiles.add(`${TileSuit.Wind}-3`);
  yaochuTiles.add(`${TileSuit.Wind}-4`);
  yaochuTiles.add(`${TileSuit.Dragon}-1`);
  yaochuTiles.add(`${TileSuit.Dragon}-2`);
  yaochuTiles.add(`${TileSuit.Dragon}-3`);

  const groupCount = melds.length + Math.floor(hand.length / 3);
  let yaochuCount = 0;
  for (const t of allTiles) {
    if (yaochuTiles.has(tileKey(t))) yaochuCount++;
  }
  return yaochuCount >= groupCount * 3;
}

// 纯全带幺：同混全但只含数牌1/9
function isJunchan(hand: Tile[], melds: Meld[], isMenzen: boolean): boolean {
  const allTiles = [...hand];
  for (const m of melds) allTiles.push(...m.tiles);
  const yaochu = new Set<string>();
  for (const suit of [TileSuit.Man, TileSuit.Pin, TileSuit.Sou]) {
    yaochu.add(`${suit}-1`);
    yaochu.add(`${suit}-9`);
  }
  const groupCount = melds.length + Math.floor(hand.length / 3);
  let yaochuCount = 0;
  for (const t of allTiles) {
    if (yaochu.has(tileKey(t))) yaochuCount++;
  }
  return yaochuCount >= groupCount * 3;
}

// 一气通贯：同花色123-789顺子
function isIttsuu(hand: Tile[], melds: Meld[], isMenzen: boolean): boolean {
  const allTiles = [...hand];
  for (const m of melds) allTiles.push(...m.tiles);
  const groups = new Map<string, number>();
  for (const t of allTiles) {
    groups.set(tileKey(t), (groups.get(tileKey(t)) || 0) + 1);
  }
  for (const suit of [TileSuit.Man, TileSuit.Pin, TileSuit.Sou]) {
    let missing = false;
    for (let r = 1; r <= 9; r++) {
      if ((groups.get(`${suit}-${r}`) || 0) < (r === 1 || r === 9 ? 1 : 1)) {
        missing = true; break;
      }
    }
    // 简化：检查是否有123+456+789的顺子
    let count = 0;
    for (let r = 1; r <= 7; r++) {
      const c1 = groups.get(`${suit}-${r}`) || 0;
      const c2 = groups.get(`${suit}-${r + 1}`) || 0;
      const c3 = groups.get(`${suit}-${r + 2}`) || 0;
      if (c1 >= 1 && c2 >= 1 && c3 >= 1) count++;
    }
    if (count >= 3) return true;
  }
  return false;
}

// 三色同顺
function isSanshoku(hand: Tile[], melds: Meld[], isMenzen: boolean): boolean {
  const allTiles = [...hand];
  for (const m of melds) allTiles.push(...m.tiles);
  const groups = new Map<string, number>();
  for (const t of allTiles) {
    groups.set(tileKey(t), (groups.get(tileKey(t)) || 0) + 1);
  }
  for (let rank = 1; rank <= 7; rank++) {
    const m = groups.get(`${TileSuit.Man}-${rank}`) || 0;
    const p = groups.get(`${TileSuit.Pin}-${rank}`) || 0;
    const s = groups.get(`${TileSuit.Sou}-${rank}`) || 0;
    const m2 = groups.get(`${TileSuit.Man}-${rank + 1}`) || 0;
    const p2 = groups.get(`${TileSuit.Pin}-${rank + 1}`) || 0;
    const s2 = groups.get(`${TileSuit.Sou}-${rank + 1}`) || 0;
    const m3 = groups.get(`${TileSuit.Man}-${rank + 2}`) || 0;
    const p3 = groups.get(`${TileSuit.Pin}-${rank + 2}`) || 0;
    const s3 = groups.get(`${TileSuit.Sou}-${rank + 2}`) || 0;
    if (m >= 1 && p >= 1 && s >= 1 && m2 >= 1 && p2 >= 1 && s2 >= 1 && m3 >= 1 && p3 >= 1 && s3 >= 1) return true;
  }
  return false;
}

// 混一色
function isHonitsu(hand: Tile[], melds: Meld[]): boolean {
  const allTiles = [...hand];
  for (const m of melds) allTiles.push(...m.tiles);
  let numSuit: TileSuit | null = null;
  let hasHonor = false;
  for (const t of allTiles) {
    if (t.suit === TileSuit.Wind || t.suit === TileSuit.Dragon) {
      hasHonor = true;
    } else {
      if (numSuit === null) numSuit = t.suit;
      else if (numSuit !== t.suit) return false;
    }
  }
  return hasHonor && numSuit !== null;
}

// 清一色
function isChinitsu(hand: Tile[], melds: Meld[]): boolean {
  const allTiles = [...hand];
  for (const m of melds) allTiles.push(...m.tiles);
  if (allTiles.length === 0) return false;
  const suit = allTiles[0].suit;
  for (const t of allTiles) {
    if (t.suit !== suit) return false;
    if (t.suit === TileSuit.Wind || t.suit === TileSuit.Dragon) return false;
  }
  return true;
}

// 二杯口
function isRyanpeikou(hand: Tile[], isMenzen: boolean): boolean {
  if (!isMenzen) return false;
  const groups = new Map<string, number>();
  for (const t of hand) {
    groups.set(tileKey(t), (groups.get(tileKey(t)) || 0) + 1);
  }
  let pairSeqs = 0;
  for (const suit of [TileSuit.Man, TileSuit.Pin, TileSuit.Sou]) {
    for (let rank = 1; rank <= 7; rank++) {
      const c1 = groups.get(`${suit}-${rank}`) || 0;
      const c2 = groups.get(`${suit}-${rank + 1}`) || 0;
      const c3 = groups.get(`${suit}-${rank + 2}`) || 0;
      if (c1 >= 2 && c2 >= 2 && c3 >= 2) pairSeqs++;
    }
  }
  return pairSeqs >= 2;
}

// 七对子
function isChitoitsu(hand: Tile[]): boolean {
  if (hand.length !== 14) return false;
  const groups = new Map<string, number>();
  for (const t of hand) {
    groups.set(tileKey(t), (groups.get(tileKey(t)) || 0) + 1);
  }
  if (groups.size !== 7) return false;
  for (const [, count] of groups) {
    if (count !== 2) return false;
  }
  return true;
}

// 国士无双
function isKokushimusou(hand: Tile[]): boolean {
  if (hand.length !== 14) return false;
  const needed = new Set<string>([
    `${TileSuit.Man}-1`, `${TileSuit.Man}-9`,
    `${TileSuit.Pin}-1`, `${TileSuit.Pin}-9`,
    `${TileSuit.Sou}-1`, `${TileSuit.Sou}-9`,
    `${TileSuit.Wind}-1`, `${TileSuit.Wind}-2`,
    `${TileSuit.Wind}-3`, `${TileSuit.Wind}-4`,
    `${TileSuit.Dragon}-1`, `${TileSuit.Dragon}-2`,
    `${TileSuit.Dragon}-3`,
  ]);
  const handSet = new Set(hand.map(t => tileKey(t)));
  let pairCount = 0;
  for (const t of hand) {
    if (!needed.has(tileKey(t))) pairCount++;
  }
  return needed.size === 13 && pairCount === 1;
}

// 字一色
function isTsuuiSou(hand: Tile[], melds: Meld[]): boolean {
  const allTiles = [...hand];
  for (const m of melds) allTiles.push(...m.tiles);
  for (const t of allTiles) {
    if (t.suit !== TileSuit.Wind && t.suit !== TileSuit.Dragon) return false;
  }
  return true;
}

// 绿一色
function isRyuiisou(hand: Tile[], melds: Meld[]): boolean {
  const greenSet = new Set<string>([
    `${TileSuit.Sou}-2`, `${TileSuit.Sou}-3`, `${TileSuit.Sou}-4`,
    `${TileSuit.Sou}-6`, `${TileSuit.Sou}-8`,
    `${TileSuit.Dragon}-2` // 发
  ]);
  const allTiles = [...hand];
  for (const m of melds) allTiles.push(...m.tiles);
  for (const t of allTiles) {
    if (!greenSet.has(tileKey(t))) return false;
  }
  return true;
}

// 清老头
function isChinroutou(hand: Tile[], melds: Meld[]): boolean {
  const yaochuSet = new Set<string>();
  for (const suit of [TileSuit.Man, TileSuit.Pin, TileSuit.Sou]) {
    yaochuSet.add(`${suit}-1`);
    yaochuSet.add(`${suit}-9`);
  }
  const allTiles = [...hand];
  for (const m of melds) allTiles.push(...m.tiles);
  for (const t of allTiles) {
    if (!yaochuSet.has(tileKey(t))) return false;
  }
  return true;
}

// 小四喜
function isShousuushii(hand: Tile[], melds: Meld[]): boolean {
  const allTiles = [...hand];
  for (const m of melds) allTiles.push(...m.tiles);
  const windCounts = new Map<number, number>();
  for (const t of allTiles) {
    if (t.suit === TileSuit.Wind) {
      windCounts.set(t.rank, (windCounts.get(t.rank) || 0) + 1);
    }
  }
  let tripletWinds = 0;
  let pairWind = false;
  for (const [, count] of windCounts) {
    if (count >= 3) tripletWinds++;
    if (count === 2) pairWind = true;
  }
  return tripletWinds >= 3 && pairWind;
}

// 大四喜
function isDaisuushii(hand: Tile[], melds: Meld[]): boolean {
  const allTiles = [...hand];
  for (const m of melds) allTiles.push(...m.tiles);
  const windCounts = new Map<number, number>();
  for (const t of allTiles) {
    if (t.suit === TileSuit.Wind) {
      windCounts.set(t.rank, (windCounts.get(t.rank) || 0) + 1);
    }
  }
  let tripletWinds = 0;
  for (const [, count] of windCounts) {
    if (count >= 3) tripletWinds++;
  }
  return tripletWinds >= 4;
}

// 九莲宝灯
function isChuurenpoutou(hand: Tile[], isMenzen: boolean): boolean {
  if (!isMenzen) return false;
  const groups = new Map<string, number>();
  for (const t of hand) {
    groups.set(tileKey(t), (groups.get(tileKey(t)) || 0) + 1);
  }
  // 需要 1112345678999 + 任意一张同花色
  const suits = [TileSuit.Man, TileSuit.Pin, TileSuit.Sou];
  for (const suit of suits) {
    let ok = true;
    const needed = new Map<string, number>([
      [`${suit}-1`, 3], [`${suit}-2`, 1], [`${suit}-3`, 1],
      [`${suit}-4`, 1], [`${suit}-5`, 1], [`${suit}-6`, 1],
      [`${suit}-7`, 1], [`${suit}-8`, 1], [`${suit}-9`, 3]
    ]);
    for (const [key, need] of needed) {
      const have = groups.get(key) || 0;
      if (have < need) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

// ===== 符数计算 =====
export function calculateFu(ctx: YakuContext): number {
  let fu = 20; // 基础符

  // 平和自摸 +2
  const isPinfu = ctx.hand.length === 14 && ctx.melds.length === 0;
  if (isPinfu && ctx.isTsumo) fu += 2;

  // 刻子符（副露减半）
  const allTiles = [...ctx.hand];
  for (const m of ctx.melds) allTiles.push(...m.tiles);
  const groups = new Map<string, Tile[]>();
  for (const t of allTiles) {
    const key = tileKey(t);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  for (const [key, tiles] of groups) {
    if (tiles.length < 3) continue;
    if (key.startsWith('dragon')) {
      fu += tiles.length === 3 ? 8 : 32; // 三元刻/杠
    } else if (key.startsWith('wind')) {
      fu += tiles.length === 3 ? 4 : 16; // 风刻/杠
    } else {
      const rank = parseInt(key.split('-')[1]);
      if (rank === 1 || rank === 9) {
        fu += tiles.length === 3 ? 8 : 32; // 幺九刻/杠
      } else {
        fu += tiles.length === 3 ? 4 : 16; // 中张刻/杠
      }
    }
  }

  // 雀头符（连风牌+2）
  // 简化：+0

  // 自摸 +2
  if (ctx.isTsumo) fu += 2;

  // 门前清荣和 +10（已含在20基础里）

  // 最小符数
  return Math.ceil(fu / 10) * 10;
}

// ===== 番数计算 =====
export function calculateHan(yakus: Yaku[]): number {
  let total = 0;
  for (const y of yakus) {
    total += y.han;
  }
  return total;
}

// ===== 点数计算 =====

export function calculateBasePoints(han: number, fu: number, isTsumo: boolean, isDealer: boolean): number {
  // 满贯以上查表
  if (han >= 13) return 48000;
  if (han >= 11) return 36000;
  if (han >= 8) return 24000;
  if (han >= 6) return 18000;
  if (han >= 5) return 12000;
  if (han >= 4 && fu >= 40) return 9600;
  if (han >= 3 && fu >= 40) return 7200;
  if (han >= 3 && fu >= 30) return 6400;
  if (han >= 2 && fu >= 70) return 6400;
  if (han >= 2 && fu >= 40) return 4800;
  if (han >= 2 && fu >= 30) return 4000;
  if (han >= 1 && fu >= 70) return 4000;
  if (han >= 1 && fu >= 60) return 3600;
  if (han >= 1 && fu >= 50) return 3200;
  if (han >= 1 && fu >= 40) return 2400;
  if (han >= 1 && fu >= 30) return 2000;
  if (han >= 1 && fu >= 25) return 1600;
  if (han >= 1 && fu >= 20) return 1200;

  // 普通计算
  let base = fu * Math.pow(2, han + 2);
  if (isTsumo) {
    return Math.ceil(base / 100) * 100;
  } else {
    return Math.ceil(base / 100) * 100 * 4;
  }
}
