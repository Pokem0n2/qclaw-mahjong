// ===== 奖励系统 =====

import { RewardOption, Buff } from './types';
import { BuffSystem } from './BuffSystem';

export class RewardSystem {
  private rng: () => number;

  constructor(rng?: () => number) {
    this.rng = rng ?? Math.random;
  }

  generateRewardOptions(stage: number): RewardOption[] {
    const options: RewardOption[] = [];
    const rarities: Array<'common' | 'rare' | 'epic'> = ['common', 'rare', 'epic'];
    
    const shuffled = [...rarities];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    for (const rarity of shuffled) {
      const template = BuffSystem.generateRandomBuff(this.rng);
      const buff: Buff = {
        ...template,
        id: `reward_${rarity}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        stacks: 1
      };

      options.push({
        buff,
        description: buff.description,
        rarity
      });
    }

    return options;
  }

  calculateGoldReward(winPoints: number, stage: number, goldMultiplier: number = 1.0): number {
    const baseGold = Math.floor(winPoints / 100);
    const stageBonus = stage * 10;
    return Math.floor((baseGold + stageBonus) * goldMultiplier);
  }
}
