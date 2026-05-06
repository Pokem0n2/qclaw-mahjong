import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Buff } from '../../types';
import './RewardSelect.css';

const RewardSelect: React.FC = () => {
  const { showReward, rewardOptions, selectReward } = useGameStore();

  if (!showReward || rewardOptions.length === 0) return null;

  return (
    <div className="reward-overlay">
      <div className="reward-modal">
        <h2 className="reward-title">🎉 选择奖励</h2>
        <p className="reward-subtitle">恭喜完成本局！请选择一个增益：</p>
        
        <div className="reward-options">
          {rewardOptions.map((option, idx) => (
            <div
              key={idx}
              className="reward-card"
              onClick={() => selectReward(idx)}
            >
              <div className="reward-icon">{option.buff.icon}</div>
              <h3 className="reward-name">{option.buff.name}</h3>
              <p className="reward-desc">{option.description}</p>
              <div className="reward-effect">
                {getEffectText(option.buff)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function getEffectText(buff: Buff): string {
  const { effect } = buff;
  switch (effect.type) {
    case 'score-multiplier':
      return `分数 ×${effect.value}`;
    case 'draw-bonus':
      return `额外摸 ${effect.tiles} 张牌`;
    case 'riichi-free':
      return '立直不需点棒';
    case 'dora-extra':
      return `额外 ${effect.count} 张宝牌`;
    case 'yaku-bonus':
      return `${effect.yakuName} +${effect.extraHan}番`;
    case 'hand-size-bonus':
      return `手牌上限 +${effect.extraTiles}`;
    case 'peek-discard':
      return `预览对手 ${effect.count} 张舍牌`;
    case 'lucky-draw':
      return `好牌概率 +${Math.round(effect.probability * 100)}%`;
    default:
      return '';
  }
}

export default RewardSelect;
