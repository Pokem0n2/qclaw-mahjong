import React from 'react';
import { useGameStore } from '../../store/gameStore';
import './ScoreBoard.css';

const ScoreBoard: React.FC = () => {
  const { runState, gameState } = useGameStore();

  if (!runState || !gameState) return null;

  const { baseScore, scoreMultiplier, gold } = runState;
  const totalScore = Math.floor(baseScore * scoreMultiplier);

  return (
    <div className="score-board">
      <div className="score-item score-main">
        <span className="score-label">总分</span>
        <span className="score-value">{totalScore.toLocaleString()}</span>
      </div>
      
      <div className="score-details">
        <div className="score-item">
          <span className="score-label">基础分</span>
          <span className="score-value">{baseScore.toLocaleString()}</span>
        </div>
        
        <div className="score-item">
          <span className="score-label">倍率</span>
          <span className="score-value score-multiplier">×{scoreMultiplier.toFixed(2)}</span>
        </div>
        
        <div className="score-item">
          <span className="score-label">金币</span>
          <span className="score-value score-gold">💰 {gold}</span>
        </div>
      </div>
      
      <div className="score-players">
        {gameState.players.map(player => (
          <div key={player.index} className={`player-score ${player.isHuman ? 'player-human' : ''}`}>
            <span className="player-name">{player.name}</span>
            <span className="player-points">{player.score}</span>
            {player.isDealer && <span className="dealer-badge">庄</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreBoard;
