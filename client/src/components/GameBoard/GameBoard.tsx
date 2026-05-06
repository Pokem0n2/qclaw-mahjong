import React from 'react';
import { useGameStore } from '../../store/gameStore';
import PlayerHand from './PlayerHand';
import OpponentHand from './OpponentHand';
import DiscardPile from './DiscardPile';
import ActionPanel from './ActionPanel';
import DrawPile from './DrawPile';
import './GameBoard.css';

const GameBoard: React.FC = () => {
  const { gameState } = useGameStore();

  if (!gameState) {
    return <div className="game-board-loading">加载中...</div>;
  }

  const players = gameState.players;
  const humanIndex = players.findIndex(p => p.isHuman);
  
  // 计算对手位置（相对于玩家）
  const getOpponentIndex = (offset: number) => (humanIndex + offset) % 4;
  
  const rightOpponent = players[getOpponentIndex(1)];
  const topOpponent = players[getOpponentIndex(2)];
  const leftOpponent = players[getOpponentIndex(3)];

  return (
    <div className="game-board">
      {/* 中央区域 */}
      <div className="board-center">
        <DrawPile />
        
        {/* 宝牌指示牌 */}
        <div className="dora-area">
          <div className="dora-label">宝牌</div>
          <div className="dora-indicators">
            {gameState.doraIndicators.map((tile, idx) => (
              <div key={idx} className="dora-tile">
                {tile.suit} {tile.rank}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 对手手牌 - 上方 */}
      <div className="board-top">
        <OpponentHand player={topOpponent} position="top" />
        <DiscardPile
          discards={topOpponent.discards}
          playerName={topOpponent.name}
          position="top"
        />
      </div>

      {/* 对手手牌 - 左侧 */}
      <div className="board-left">
        <OpponentHand player={leftOpponent} position="left" />
        <DiscardPile
          discards={leftOpponent.discards}
          playerName={leftOpponent.name}
          position="left"
        />
      </div>

      {/* 对手手牌 - 右侧 */}
      <div className="board-right">
        <OpponentHand player={rightOpponent} position="right" />
        <DiscardPile
          discards={rightOpponent.discards}
          playerName={rightOpponent.name}
          position="right"
        />
      </div>

      {/* 玩家区域 - 下方 */}
      <div className="board-bottom">
        <DiscardPile
          discards={players[humanIndex].discards}
          playerName={players[humanIndex].name}
          position="bottom"
        />
        <PlayerHand />
        <ActionPanel />
      </div>

      {/* 游戏信息 */}
      <div className="board-info">
        <div className="info-item">
          <span className="info-label">局数:</span>
          <span className="info-value">{gameState.roundNumber}</span>
        </div>
        <div className="info-item">
          <span className="info-label">本场:</span>
          <span className="info-value">{gameState.honba}</span>
        </div>
        <div className="info-item">
          <span className="info-label">立直棒:</span>
          <span className="info-value">{gameState.riichiSticks}</span>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
