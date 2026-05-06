// ===== 增益系统 =====

import { Buff, BuffEffect, Item } from './types';
import { v4 as uuidv4 } from 'uuid';

// 预定义增益库
export const BUFF_TEMPLATES: Omit<Buff, 'id' | 'stacks'>[] = [
  // === 分数类 ===
  {
    name: '一发万两',
    description: '和牌时分数 ×1.5',
    icon: '💰',
    stackable: false,
    effect: { type: 'score-multiplier', value: 1.5 }
  },
  {
    name: '财源滚滚',
    description: '和牌时分数 ×2.0',
    icon: '🪙',
    stackable: false,
    effect: { type: 'score-multiplier', value: 2.0 }
  },
  {
    name: '日进斗金',
    description: '和牌时分数 ×3.0',
    icon: '💎',
    stackable: false,
    effect: { type: 'score-multiplier', value: 3.0 }
  },

  // === 摸牌类 ===
  {
    name: '顺风满帆',
    description: '每局开始额外摸1张牌',
    icon: '⛵',
    stackable: true,
    effect: { type: 'draw-bonus', tiles: 1 }
  },
  {
    name: '双倍起手',
    description: '开局额外摸2张牌',
    icon: '🚀',
    stackable: true,
    effect: { type: 'draw-bonus', tiles: 2 }
  },

  // === 宝牌类 ===
  {
    name: '金光闪闪',
    description: '额外翻开1张宝牌',
    icon: '✨',
    stackable: true,
    effect: { type: 'dora-extra', count: 1 }
  },
  {
    name: '赤牌亲和',
    description: '额外翻开2张宝牌',
    icon: '🔴',
    stackable: true,
    effect: { type: 'dora-extra', count: 2 }
  },

  // === 立直类 ===
  {
    name: '无本立直',
    description: '立直不需支付点棒',
    icon: '🎯',
    stackable: false,
    effect: { type: 'riichi-free' }
  },

  // === 役种类 ===
  {
    name: '清一色之道',
    description: '清一色额外+2番',
    icon: '🌈',
    stackable: false,
    effect: { type: 'yaku-bonus', yakuName: '清一色', extraHan: 2 }
  },
  {
    name: '对对和之道',
    description: '对对和额外+2番',
    icon: '🎲',
    stackable: false,
    effect: { type: 'yaku-bonus', yakuName: '对对和', extraHan: 2 }
  },
  {
    name: '役满直觉',
    description: '七对子和国士无双额外+3番',
    icon: '👁️',
    stackable: false,
    effect: { type: 'yaku-bonus', yakuName: '七对子/国士无双', extraHan: 3 }
  },

  // === 手牌类 ===
  {
    name: '大器晚成',
    description: '手牌上限+2（15张）',
    icon: '🃏',
    stackable: true,
    effect: { type: 'hand-size-bonus', extraTiles: 2 }
  },
  {
    name: '巨人气魄',
    description: '手牌上限+4（17张）',
    icon: '🏋️',
    stackable: false,
    effect: { type: 'hand-size-bonus', extraTiles: 4 }
  },

  // === 防守类 ===
  {
    name: '铜墙铁壁',
    description: '点炮时损失减半',
    icon: '🛡️',
    stackable: false,
    effect: { type: 'defense-bonus', reduction: 0.5 }
  },
  {
    name: '不死之身',
    description: '点炮时损失减至1/4',
    icon: '💀',
    stackable: false,
    effect: { type: 'defense-bonus', reduction: 0.25 }
  },

  // === 幸运类 ===
  {
    name: '天选之人',
    description: '摸到宝牌概率+20%',
    icon: '🌟',
    stackable: true,
    effect: { type: 'lucky-draw', probability: 0.2 }
  },
  {
    name: '运势如虹',
    description: '摸到宝牌概率+40%',
    icon: '🌈',
    stackable: false,
    effect: { type: 'lucky-draw', probability: 0.4 }
  },

  // === 金币类 ===
  {
    name: '淘金热',
    description: '金币获取+50%',
    icon: '⚡',
    stackable: true,
    effect: { type: 'gold-bonus', multiplier: 1.5 }
  },
  {
    name: '黄金时代',
    description: '金币获取翻倍',
    icon: '🏆',
    stackable: false,
    effect: { type: 'gold-bonus', multiplier: 2.0 }
  },

  // === 起始增益 ===
  {
    name: '领先一步',
    description: '开局额外+5000分',
    icon: '🎖️',
    stackable: true,
    effect: { type: 'starting-hand', extraTiles: 0 }
  },
  {
    name: '分数守护',
    description: '每局结束时保留2000分',
    icon: '🔒',
    stackable: true,
    effect: { type: 'score-keep', amount: 2000 }
  },

  // === AI削弱 ===
  {
    name: '降维打击',
    description: 'AI对手难度降低1级',
    icon: '📉',
    stackable: false,
    effect: { type: 'ai-difficulty-down' }
  },

  // === 保命 ===
  {
    name: '绝境逢生',
    description: '破产时保留5000分',
    icon: '🌱',
    stackable: false,
    effect: { type: 'bankrupt-protection' }
  }
];

// 道具模板
export const ITEM_TEMPLATES: Omit<Item, 'id'>[] = [
  {
    name: '秘传手筋',
    description: '本局内听牌面翻倍',
    icon: '📖',
    price: 200,
    consumable: true,
    effect: { type: 'lucky-draw', probability: 0.5 }
  },
  {
    name: '作弊之骰',
    description: '本局多翻1张宝牌',
    icon: '🎲',
    price: 150,
    consumable: true,
    effect: { type: 'dora-extra', count: 1 }
  },
  {
    name: '幸运符',
    description: '本局和牌分数+30%',
    icon: '🍀',
    price: 100,
    consumable: true,
    effect: { type: 'score-multiplier', value: 1.3 }
  },
  {
    name: '透视眼镜',
    description: '查看所有玩家手牌1回合',
    icon: '🕶️',
    price: 300,
    consumable: true,
    effect: { type: 'peek-discard', count: 1 }
  }
];

export class BuffSystem {
  private buffs: Buff[] = [];

  constructor(existingBuffs: Buff[] = []) {
    this.buffs = [...existingBuffs];
  }

  // 添加增益
  addBuff(buff: Omit<Buff, 'id' | 'stacks'>): Buff {
    if (buff.stackable) {
      // 找已有的同名增益
      const existing = this.buffs.find(b => b.name === buff.name);
      if (existing) {
        existing.stacks++;
        return existing;
      }
    }

    const newBuff: Buff = {
      ...buff,
      id: uuidv4(),
      stacks: 1
    };
    this.buffs.push(newBuff);
    return newBuff;
  }

  // 移除增益
  removeBuff(buffId: string): void {
    this.buffs = this.buffs.filter(b => b.id !== buffId);
  }

  // 获取所有增益
  getAll(): Buff[] {
    return [...this.buffs];
  }

  // 获取特定类型增益
  getByType<T extends BuffEffect>(type: T['type']): Buff[] {
    return this.buffs.filter(b => b.effect.type === type);
  }

  // 获取分数倍率
  getScoreMultiplier(): number {
    const scoreBuffs = this.getByType('score-multiplier');
    let mult = 1.0;
    for (const b of scoreBuffs) {
      const eff = b.effect as { type: 'score-multiplier'; value: number };
      mult = Math.max(mult, eff.value); // 取最高
    }
    return mult;
  }

  // 获取额外宝牌数
  getExtraDoraCount(): number {
    const doraBuffs = this.getByType('dora-extra');
    let total = 0;
    for (const b of doraBuffs) {
      const eff = b.effect as { type: 'dora-extra'; count: number };
      total += eff.count * b.stacks;
    }
    return total;
  }

  // 获取额外摸牌数
  getDrawBonus(): number {
    const drawBuffs = this.getByType('draw-bonus');
    let total = 0;
    for (const b of drawBuffs) {
      const eff = b.effect as { type: 'draw-bonus'; tiles: number };
      total += eff.tiles * b.stacks;
    }
    return total;
  }

  // 获取手牌上限加成
  getHandSizeBonus(): number {
    const sizeBuffs = this.getByType('hand-size-bonus');
    let total = 0;
    for (const b of sizeBuffs) {
      const eff = b.effect as { type: 'hand-size-bonus'; extraTiles: number };
      total += eff.extraTiles * b.stacks;
    }
    return total;
  }

  // 获取金币加成
  getGoldMultiplier(): number {
    const goldBuffs = this.getByType('gold-bonus');
    let mult = 1.0;
    for (const b of goldBuffs) {
      const eff = b.effect as { type: 'gold-bonus'; multiplier: number };
      mult *= eff.multiplier;
    }
    return mult;
  }

  // 获取防守减免
  getDefenseReduction(): number {
    const defBuffs = this.getByType('defense-bonus');
    let reduction = 0;
    for (const b of defBuffs) {
      const eff = b.effect as { type: 'defense-bonus'; reduction: number };
      reduction = Math.max(reduction, eff.reduction);
    }
    return reduction;
  }

  // 检查是否免立直费
  isRiichiFree(): boolean {
    return this.buffs.some(b => b.effect.type === 'riichi-free');
  }

  // 检查保命
  hasBankruptProtection(): boolean {
    return this.buffs.some(b => b.effect.type === 'bankrupt-protection');
  }

  // 获取AI难度降低
  getAiDifficultyReduction(): number {
    return this.buffs.some(b => b.effect.type === 'ai-difficulty-down') ? 1 : 0;
  }

  // 获取分数保留
  getScoreKeep(): number {
    const keepBuffs = this.getByType('score-keep');
    let total = 0;
    for (const b of keepBuffs) {
      const eff = b.effect as { type: 'score-keep'; amount: number };
      total += eff.amount * b.stacks;
    }
    return total;
  }

  // 随机生成增益（按稀有度）
  static generateRandomBuff(rng: () => number, rarity?: 'common' | 'rare' | 'epic'): Omit<Buff, 'id' | 'stacks'> {
    // 稀有度权重
    const weights: Record<string, number> = {
      common: 60,
      rare: 30,
      epic: 10
    };
    const effectiveRarity = rarity ?? (() => {
      const r = rng() * 100;
      if (r < weights.epic) return 'epic';
      if (r < weights.epic + weights.rare) return 'rare';
      return 'common';
    })();

    const templatesByRarity = {
      common: BUFF_TEMPLATES.slice(0, 8),
      rare: BUFF_TEMPLATES.slice(8, 16),
      epic: BUFF_TEMPLATES.slice(16)
    };

    const pool = templatesByRarity[effectiveRarity];
    const idx = Math.floor(rng() * pool.length);
    return { ...pool[idx] };
  }

  // 生成初始增益选项
  static generateStartingOptions(rng: () => number): Omit<Buff, 'id' | 'stacks'>[] {
    return [
      this.generateRandomBuff(rng, 'common'),
      this.generateRandomBuff(rng, 'rare'),
      this.generateRandomBuff(rng, 'epic')
    ];
  }

  // 升级buff效果
  upgradeBuff(buffId: string): boolean {
    const buff = this.buffs.find(b => b.id === buffId);
    if (!buff || !buff.stackable) return false;
    buff.stacks++;
    return true;
  }
}
