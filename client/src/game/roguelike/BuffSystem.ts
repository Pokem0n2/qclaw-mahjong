// ===== 增益系统 =====

import { Buff, BuffEffect, Item } from './types';

let buffIdCounter = 0;
let itemIdCounter = 0;

export const BUFF_TEMPLATES: Omit<Buff, 'id' | 'stacks'>[] = [
  { name: '一发万两', description: '和牌时分数 ×1.5', icon: '💰', stackable: false, effect: { type: 'score-multiplier', value: 1.5 } },
  { name: '财源滚滚', description: '和牌时分数 ×2.0', icon: '🪙', stackable: false, effect: { type: 'score-multiplier', value: 2.0 } },
  { name: '顺风满帆', description: '每局开始额外摸1张牌', icon: '⛵', stackable: true, effect: { type: 'draw-bonus', tiles: 1 } },
  { name: '金光闪闪', description: '额外翻开1张宝牌', icon: '✨', stackable: true, effect: { type: 'dora-extra', count: 1 } },
  { name: '无本立直', description: '立直不需支付点棒', icon: '🎯', stackable: false, effect: { type: 'riichi-free' } },
  { name: '铜墙铁壁', description: '点炮时损失减半', icon: '🛡️', stackable: false, effect: { type: 'defense-bonus', reduction: 0.5 } },
  { name: '天选之人', description: '摸到宝牌概率+20%', icon: '🌟', stackable: true, effect: { type: 'lucky-draw', probability: 0.2 } },
  { name: '淘金热', description: '金币获取+50%', icon: '⚡', stackable: true, effect: { type: 'gold-bonus', multiplier: 1.5 } },
  { name: '大器晚成', description: '手牌上限+2', icon: '🃏', stackable: true, effect: { type: 'hand-size-bonus', extraTiles: 2 } },
];

export const ITEM_TEMPLATES: Omit<Item, 'id'>[] = [
  { name: '秘传手筋', description: '本局听牌面翻倍', icon: '📖', price: 200, consumable: true, effect: { type: 'lucky-draw', probability: 0.5 } },
  { name: '作弊之骰', description: '本局多翻1张宝牌', icon: '🎲', price: 150, consumable: true, effect: { type: 'dora-extra', count: 1 } },
  { name: '幸运符', description: '本局和牌分数+30%', icon: '🍀', price: 100, consumable: true, effect: { type: 'score-multiplier', value: 1.3 } },
];

export class BuffSystem {
  private buffs: Buff[] = [];

  constructor(existingBuffs: Buff[] = []) {
    this.buffs = [...existingBuffs];
  }

  addBuff(template: Omit<Buff, 'id' | 'stacks'>): Buff {
    if (template.stackable) {
      const existing = this.buffs.find(b => b.name === template.name);
      if (existing) {
        existing.stacks++;
        return existing;
      }
    }

    const newBuff: Buff = {
      ...template,
      id: `buff_${++buffIdCounter}_${Date.now()}`,
      stacks: 1
    };
    this.buffs.push(newBuff);
    return newBuff;
  }

  getAll(): Buff[] {
    return [...this.buffs];
  }

  getByType<T extends BuffEffect>(type: T['type']): Buff[] {
    return this.buffs.filter(b => b.effect.type === type);
  }

  getScoreMultiplier(): number {
    const buffs = this.getByType('score-multiplier');
    return buffs.reduce((max, b) => Math.max(max, (b.effect as any).value), 1.0);
  }

  getExtraDoraCount(): number {
    const buffs = this.getByType('dora-extra');
    return buffs.reduce((sum, b) => sum + (b.effect as any).count * b.stacks, 0);
  }

  getDrawBonus(): number {
    const buffs = this.getByType('draw-bonus');
    return buffs.reduce((sum, b) => sum + (b.effect as any).tiles * b.stacks, 0);
  }

  getHandSizeBonus(): number {
    const buffs = this.getByType('hand-size-bonus');
    return buffs.reduce((sum, b) => sum + (b.effect as any).extraTiles * b.stacks, 0);
  }

  getGoldMultiplier(): number {
    const buffs = this.getByType('gold-bonus');
    return buffs.reduce((mult, b) => mult * (b.effect as any).multiplier, 1.0);
  }

  isRiichiFree(): boolean {
    return this.buffs.some(b => b.effect.type === 'riichi-free');
  }

  static generateRandomBuff(rng: () => number): Omit<Buff, 'id' | 'stacks'> {
    const idx = Math.floor(rng() * BUFF_TEMPLATES.length);
    return { ...BUFF_TEMPLATES[idx] };
  }
}
