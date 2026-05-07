import React from 'react';
import { useGameStore } from '../../store/gameStore';
import './DrawPile.css';

const DrawPile: React.FC = () => {
  const { gameState } = useGameStore();

  if (!gameState) return null;

  const remaining = gameState.wallRemaining;

  return (
    <div className="draw-pile">
      <div className="draw-pile-label">牌墙</div>
      <div className="draw-pile-count">
        剩余: <span className="count-number">{remaining}</span> 张
      </div>
      <div className="draw-pile-visual">
        {Array.from({ length: Math.ceil(remaining / 10) }).map((_, idx) => (
          <div key={idx} className="draw-pile-stack"></div>
        ))}
      </div>
    </div>
  );
};

export default DrawPile;
