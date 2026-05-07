import React from 'react';
import { useGameStore } from '../../store/gameStore';
import './Shop.css';

const Shop: React.FC = () => {
  const { runState, loading } = useGameStore();

  if (!runState || runState.phase !== 'shop') return null;

  return (
    <div className="shop-overlay">
      <div className="shop-modal">
        <div className="shop-header">
          <h2 className="shop-title">🏪 商店</h2>
          <div className="shop-gold">
            💰 {runState.gold} 金币
          </div>
        </div>
        
        <div className="shop-actions">
          <button 
            className="shop-continue-btn"
            onClick={() => useGameStore.getState().nextStage()}
            disabled={loading}
          >
            跳过商店，继续下一关
          </button>
        </div>
      </div>
    </div>
  );
};

export default Shop;
