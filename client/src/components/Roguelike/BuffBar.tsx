import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Buff } from '../../types';
import './BuffBar.css';

const BuffBar: React.FC = () => {
  const { runState } = useGameStore();

  if (!runState || runState.buffs.length === 0) return null;

  return (
    <div className="buff-bar">
      <div className="buff-bar-label">当前增益</div>
      <div className="buff-list">
        {runState.buffs.map(buff => (
          <BuffItem key={buff.id} buff={buff} />
        ))}
      </div>
    </div>
  );
};

interface BuffItemProps {
  buff: Buff;
}

const BuffItem: React.FC<BuffItemProps> = ({ buff }) => {
  return (
    <div className="buff-item" title={buff.description}>
      <span className="buff-icon">{buff.icon}</span>
      <span className="buff-name">{buff.name}</span>
      {buff.stackable && buff.stacks > 1 && (
        <span className="buff-stacks">×{buff.stacks}</span>
      )}
    </div>
  );
};

export default BuffBar;
