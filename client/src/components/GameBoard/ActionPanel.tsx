import React from 'react';
import { useGameStore } from '../../store/gameStore';
import './ActionPanel.css';

const ActionPanel: React.FC = () => {
  const {
    gameState,
    selectedTile,
    availableActions,
    skip,
    discard,
  } = useGameStore();

  if (!gameState) return null;

  const humanIndex = gameState.players.findIndex(p => p.isHuman);
  const isMyTurn = gameState.currentPlayer === humanIndex;
  const phase = gameState.phase;

  const handleDiscard = () => {
    if (selectedTile) {
      discard(selectedTile);
    }
  };

  return (
    <div className="action-panel">
      <div className="action-status">
        {isMyTurn ? (
          <span className="status-my-turn">轮到你了！</span>
        ) : (
          <span className="status-waiting">等待 {gameState.players[gameState.currentPlayer]?.name}...</span>
        )}
        <span className="status-phase">阶段: {phase}</span>
      </div>
      
      <div className="action-buttons">
        {phase === 'discard' && isMyTurn && (
          <button
            className="action-btn action-btn-primary"
            onClick={handleDiscard}
            disabled={!selectedTile}
          >
            打牌
          </button>
        )}
        
        {(phase === 'action-prompt' || availableActions.length > 0) && isMyTurn && (
          <>
            {availableActions.includes('tsumo') && (
              <button className="action-btn action-btn-tsumo" onClick={() => useGameStore.getState().tsumo()}>
                自摸
              </button>
            )}
            {availableActions.includes('riichi') && (
              <button 
                className="action-btn action-btn-riichi" 
                onClick={() => selectedTile && useGameStore.getState().riichi(selectedTile)}
                disabled={!selectedTile}
              >
                立直
              </button>
            )}
            <button className="action-btn action-btn-skip" onClick={() => skip()}>
              跳过
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ActionPanel;
