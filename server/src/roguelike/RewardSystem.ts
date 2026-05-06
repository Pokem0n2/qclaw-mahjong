// ===== 奖励系统 =====

import { RewardOption, Buff } from './types';
import { BuffSystem } from './BuffSystem';
import { v4 as uuidv4 } from 'uuid';

export class RewardSystem {
  private rng: () => number;

  constructor(rng?: () => number) {
    this.rng = rng ?? Math.random;
  }

  // 生成三选一奖励
  generateRewardOptions(stage: number): RewardOption[] {
    const options: RewardOption[] = [];
    
    // 确保不同稀有度
    const rarities: Array<'common' | 'rare' | 'epic'> = ['common', 'rare', 'epic'];
    
    // 随机打乱顺序
    const shuffled = [...rarities];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    for (const rarity of shuffled) {
      const buffTemplate = BuffSystem.generateRandomBuff(this.rng, rarity);
      const buff: Buff = {
        ...buffTemplate,
        id: uuidv4(),
        stacks: 1
      };

      const description = this.generateRewardDescription(buff, stage);
      options.push({ buff, description, rarity });
    }

    return options;
  }

  // 生成奖励描述
  private generateRewardDescription(buff: Buff, stage: number): string {
    const eff = buff.effect;
    switch (eff.type) {
      case 'score-multiplier':
        return `和牌分数 ×${eff.value}，当前关卡加成`;
      case 'draw-bonus':
        return `每局额外摸${eff.tiles}张牌`;
      case 'dora-extra':
        return `额外翻开${eff.count}张宝牌`;
      case 'riichi-free':
        return `立直不需要支付点棒`;
      case 'yaku-bonus':
        return `${eff.yakuName}额外+${eff.extraHan}番`;
      case 'hand-size-bonus':
        return `手牌上限+${eff.extraTiles}张`;
      case 'defense-bonus':
        return `点炮损失减至${(1 - eff.reduction) * 100}%`;
      case 'lucky-draw':
        return `摸到宝牌概率+${eff.probability * 100}%`;
      case 'gold-bonus':
        return `金币获取×${eff.multiplier}`;
      case 'starting-hand':
        return `开局额外+5000分（可叠加）`;
      case 'score-keep':
        return `每局保留${eff.amount}分`;
      case 'ai-difficulty-down':
        return `AI难度降低1级`;
      case 'bankrupt-protection':
        return `破产时保留5000分`;
      default:
        return buff.description;
    }
  }

  // 计算金币奖励
  calculateGoldReward(winPoints: number, stage: number, goldMultiplier: number = 1.0): number {
    const baseGold = Math.floor(winPoints / 100);
    const stageBonus = stage * 10;
    return Math.floor((baseGold + stageBonus) * goldMultiplier);
  }

  // 计算分数奖励
  calculateScoreReward(winPoints: number, stage: number, scoreMultiplier: number = 1.0): number {
    return Math.floor(winPoints * scoreMultiplier);
  }
}
