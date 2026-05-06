import React from 'react';
import { useGameStore } from '../../store/gameStore';
import './ActionPanel.css';

const ActionPanel: React.FC = () => {
  const {
    gameState,
    selectedTile,
    availableActions,
    chi,
    pon,
    kan,
    riichi,
    ron,
    tsumo,
    skip,
    discard,
  } = useGameStore();

  if (!gameState) return null;

  const isMyTurn = gameState.players[gameState.currentPlayer]?.isHuman;
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
        
        {phase === 'action-prompt' && (
          <>
            {availableActions.includes('chi') && (
              <button className="action-btn action-btn-chi" onClick={() => chi([])}>
                吃
              </button>
            )}
            {availableActions.includes('pon') && (
              <button className="action-btn action-btn-pon" onClick={() => pon({ id: 0, suit: 'man', rank: 1, isRed: false })}>
                碰
              </button>
            )}
            {availableActions.includes('kan') && (
              <button className="action-btn action-btn-kan" onClick={() => kan({ id: 0, suit: 'man', rank: 1, isRed: false })}>
                杠
              </button>
            )}
            {availableActions.includes('riichi') && (
              <button
                className="action-btn action-btn-riichi"
                onClick={() => selectedTile && riichi(selectedTile)}
                disabled={!selectedTile}
              >
                立直
              </button>
            )}
            {availableActions.includes('ron') && (
              <button className="action-btn action-btn-ron" onClick={ron}>
                荣和
              </button>
            )}
            {availableActions.includes('tsumo') && (
              <button className="action-btn action-btn-tsumo" onClick={tsumo}>
                自摸
              </button>
            )}
            <button className="action-btn action-btn-skip" onClick={skip}>
              跳过
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ActionPanel;
