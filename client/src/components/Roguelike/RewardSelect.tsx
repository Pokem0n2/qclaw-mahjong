import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Buff } from '../../game';
import './RewardSelect.css';

const RewardSelect: React.FC = () => {
  const { showRewardSelect, pendingRewards, selectReward } = useGameStore();

  if (!showRewardSelect || pendingRewards.length === 0) return null;

  return (
    <div className="reward-overlay">
      <div className="reward-modal">
        <h2 className="reward-title">🎉 选择奖励</h2>
        <p className="reward-subtitle">恭喜完成本局！请选择一个增益：</p>
        
        <div className="reward-options">
          {pendingRewards.map((buff, idx) => (
            <div
              key={buff.id}
              className="reward-card"
              onClick={() => selectReward(idx)}
            >
              <div className="reward-icon">{buff.icon}</div>
              <h3 className="reward-name">{buff.name}</h3>
              <p className="reward-desc">{buff.description}</p>
              <div className="reward-effect">
                {getEffectText(buff)}
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
    case 'defense-bonus':
      return `防守强化`;
    case 'lucky-draw':
      return `好牌概率 +${Math.round(effect.probability * 100)}%`;
    case 'gold-bonus':
      return `金币 ×${effect.multiplier}`;
    default:
      return '';
  }
}

export default RewardSelect;
