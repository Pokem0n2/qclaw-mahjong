// ===== 事件系统 =====

import { GameEvent } from './types';

let eventIdCounter = 0;

export const EVENT_TEMPLATES: Omit<GameEvent, 'id'>[] = [
  {
    name: '神社祈愿',
    description: '路过的神社，似乎可以祈求好运...',
    choices: [
      { id: 'e1', text: '祈求宝牌', reward: { type: 'gold', amount: 50 } },
      { id: 'e2', text: '祈求分数', reward: { type: 'gold', amount: 100 } },
      { id: 'e3', text: '默默离开', reward: { type: 'debuff', description: '什么都没发生' } }
    ]
  },
  {
    name: '天降横财',
    description: '天空掉下了一袋金币！',
    choices: [
      { id: 'e4', text: '捡起来！', reward: { type: 'gold', amount: 300 } },
      { id: 'e5', text: '谨慎地捡起来', reward: { type: 'gold', amount: 150 } },
      { id: 'e6', text: '交给警察叔叔', reward: { type: 'gold', amount: 50 } }
    ]
  },
  {
    name: '神秘商人',
    description: '一个神秘的商人向你招手...',
    choices: [
      { id: 'e7', text: '查看商品', reward: { type: 'gold', amount: 100 } },
      { id: 'e8', text: '拒绝并离开', reward: { type: 'debuff', description: '错过了好机会' } }
    ]
  },
  {
    name: '麻将之神',
    description: '传说中的麻将之神出现了！',
    choices: [
      { id: 'e9', text: '请求赐予好运', reward: { type: 'gold', amount: 500 } },
      { id: 'e10', text: '谦虚地感谢', reward: { type: 'gold', amount: 200 } }
    ]
  }
];

export class EventSystem {
  private rng: () => number;

  constructor(rng?: () => number) {
    this.rng = rng ?? Math.random;
  }

  selectRandomEvent(): GameEvent {
    const idx = Math.floor(this.rng() * EVENT_TEMPLATES.length);
    const template = EVENT_TEMPLATES[idx];
    return {
      ...template,
      id: `event_${++eventIdCounter}_${Date.now()}`,
      choices: template.choices.map(c => ({ ...c }))
    };
  }

  resolveChoice(event: GameEvent, choiceIndex: number): { goldDelta: number; message: string } {
    const choice = event.choices[choiceIndex];
    if (!choice) return { goldDelta: 0, message: '无效选择' };

    const reward = choice.reward;
    if ('type' in reward && reward.type === 'gold') {
      return { goldDelta: (reward as any).amount ?? 0, message: choice.text };
    }
    return { goldDelta: 0, message: (reward as any).description ?? choice.text };
  }

  shouldTriggerEvent(stage: number): boolean {
    const baseChance = 0.3;
    const stageBonus = Math.min(0.3, stage * 0.02);
    return this.rng() < baseChance + stageBonus;
  }
}
