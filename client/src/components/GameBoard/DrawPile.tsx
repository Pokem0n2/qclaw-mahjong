import React from 'react';
import { useGameStore } from '../../store/gameStore';
import './DrawPile.css';

const DrawPile: React.FC = () => {
  const { gameState, draw } = useGameStore();

  if (!gameState) return null;

  const remaining = gameState.wallRemaining;
  const isMyTurn = gameState.players[gameState.currentPlayer]?.isHuman;
  const canDraw = isMyTurn && gameState.phase === 'draw';

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
      {canDraw && (
        <button className="draw-btn" onClick={draw}>
          摸牌
        </button>
      )}
    </div>
  );
};

export default DrawPile;
