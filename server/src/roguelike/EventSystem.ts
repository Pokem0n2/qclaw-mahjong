// ===== 事件系统 =====

import { GameEvent, EventChoice } from './types';
import { v4 as uuidv4 } from 'uuid';

// 事件库
export const EVENT_TEMPLATES: Omit<GameEvent, 'id'>[] = [
  {
    name: '神社祈愿',
    description: '路过的神社，似乎可以祈求好运...',
    choices: [
      {
        id: uuidv4(),
        text: '祈求宝牌',
        reward: { type: 'gold', amount: 0 } // 暂用占位
      },
      {
        id: uuidv4(),
        text: '祈求分数',
        reward: { type: 'gold', amount: 0 }
      },
      {
        id: uuidv4(),
        text: '默默离开',
        reward: { type: 'debuff', description: '什么都没发生' }
      }
    ]
  },
  {
    name: '神秘商人',
    description: '一个神秘的商人向你招手，声称有稀有物品出售...',
    choices: [
      {
        id: uuidv4(),
        text: '查看商店（获得折扣）',
        reward: { type: 'gold', amount: 0 }
      },
      {
        id: uuidv4(),
        text: '免费领取福袋',
        reward: { type: 'gold', amount: 100 }
      },
      {
        id: uuidv4(),
        text: '拒绝并离开',
        reward: { type: 'debuff', description: '什么都没发生' }
      }
    ]
  },
  {
    name: '天降横财',
    description: '天空掉下了一袋金币！',
    choices: [
      {
        id: uuidv4(),
        text: '捡起来！',
        reward: { type: 'gold', amount: 300 }
      },
      {
        id: uuidv4(),
        text: '谨慎地捡起来',
        reward: { type: 'gold', amount: 150 }
      },
      {
        id: uuidv4(),
        text: '交给警察叔叔',
        reward: { type: 'debuff', description: '虽然好人有好报，但丢失了100金币' }
      }
    ]
  },
  {
    name: '倒霉小偷',
    description: '一个小偷偷走了你的部分金币！',
    choices: [
      {
        id: uuidv4(),
        text: '追上去！',
        reward: { type: 'gold', amount: 0 }
      },
      {
        id: uuidv4(),
        text: '大喊抓贼',
        reward: { type: 'gold', amount: -100 }
      },
      {
        id: uuidv4(),
        text: '算了，破财消灾',
        reward: { type: 'debuff', description: '损失了50金币' }
      }
    ]
  },
  {
    name: '麻将之神',
    description: '传说中的麻将之神出现在你面前！',
    choices: [
      {
        id: uuidv4(),
        text: '请求赐予役满',
        reward: { type: 'gold', amount: 500 }
      },
      {
        id: uuidv4(),
        text: '请求赐予金币',
        reward: { type: 'gold', amount: 200 }
      },
      {
        id: uuidv4(),
        text: '谦虚地感谢并离开',
        reward: { type: 'gold', amount: 50 }
      }
    ]
  },
  {
    name: '幸运转盘',
    description: '路边有一个幸运转盘，旋转一次需要50金币',
    choices: [
      {
        id: uuidv4(),
        text: '转动转盘 🎰',
        reward: { type: 'gold', amount: 0 }
      },
      {
        id: uuidv4(),
        text: '不转了',
        reward: { type: 'debuff', description: '放弃了好运机会' }
      }
    ]
  },
  {
    name: '强力对手',
    description: '前方出现了一位强力对手，击败他可获得丰厚奖励！',
    choices: [
      {
        id: uuidv4(),
        text: '接受挑战！',
        reward: { type: 'gold', amount: 0 }
      },
      {
        id: uuidv4(),
        text: '谨慎跳过',
        reward: { type: 'debuff', description: '错过了挑战奖励' }
      }
    ]
  },
  {
    name: '温泉休息',
    description: '舒适的温泉可以恢复精力，下一局状态更好',
    choices: [
      {
        id: uuidv4(),
        text: '泡温泉休息',
        reward: { type: 'gold', amount: 0 }
      },
      {
        id: uuidv4(),
        text: '继续前进',
        reward: { type: 'debuff', description: '没有恢复，但也没有损失' }
      }
    ]
  }
];

export class EventSystem {
  private rng: () => number;

  constructor(rng?: () => number) {
    this.rng = rng ?? Math.random;
  }

  // 随机选择一个事件
  selectRandomEvent(): GameEvent {
    const idx = Math.floor(this.rng() * EVENT_TEMPLATES.length);
    const template = EVENT_TEMPLATES[idx];
    return {
      ...template,
      id: uuidv4(),
      choices: template.choices.map(c => ({ ...c, id: uuidv4() }))
    };
  }

  // 处理事件选择结果
  resolveChoice(event: GameEvent, choiceIndex: number): { goldDelta: number; buff?: any; item?: any; message: string } {
    const choice = event.choices[choiceIndex];
    if (!choice) return { goldDelta: 0, message: '无效选择' };

    const reward = choice.reward;

    if ('type' in reward && reward.type === 'gold') {
      return {
        goldDelta: (reward as any).amount ?? 0,
        message: choice.text
      };
    }

    if ('type' in reward && reward.type === 'debuff') {
      const debuff = reward as { type: 'debuff'; description: string };
      // 负金币效果
      const penalty = debuff.description.includes('100') ? -100 :
                      debuff.description.includes('50') ? -50 : 0;
      return {
        goldDelta: penalty,
        message: debuff.description
      };
    }

    return { goldDelta: 0, message: choice.text };
  }

  // 判断是否触发商店
  shouldTriggerShop(stage: number, rng: () => number): boolean {
    const baseChance = 0.4; // 40%基础概率
    const stageBonus = Math.min(0.3, stage * 0.03); // 每关+3%
    return rng() < baseChance + stageBonus;
  }

  // 判断是否触发事件
  shouldTriggerEvent(stage: number, rng: () => number): boolean {
    const baseChance = 0.3;
    const stageBonus = Math.min(0.3, stage * 0.02);
    return rng() < baseChance + stageBonus;
  }

  // 随机事件奖励池
  static getRandomRewardPool(rng: () => number): any[] {
    const pool = [];
    const roll = rng();
    if (roll < 0.3) {
      pool.push({ type: 'gold', amount: 100 + Math.floor(rng() * 200) });
    } else if (roll < 0.5) {
      pool.push({ type: 'gold', amount: 200 + Math.floor(rng() * 300) });
    } else if (roll < 0.7) {
      pool.push({ type: 'buff', rarity: 'common' });
    } else if (roll < 0.9) {
      pool.push({ type: 'buff', rarity: 'rare' });
    } else {
      pool.push({ type: 'buff', rarity: 'epic' });
    }
    return pool;
  }
}
