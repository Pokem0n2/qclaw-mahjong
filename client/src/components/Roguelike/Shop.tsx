import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { ShopItem } from '../../types';
import './Shop.css';

const Shop: React.FC = () => {
  const { showShop, shopItems, runState, buyFromShop } = useGameStore();

  if (!showShop || shopItems.length === 0) return null;

  return (
    <div className="shop-overlay">
      <div className="shop-modal">
        <div className="shop-header">
          <h2 className="shop-title">🏪 商店</h2>
          <div className="shop-gold">
            💰 {runState?.gold || 0} 金币
          </div>
        </div>
        
        <div className="shop-items">
          {shopItems.map((shopItem, idx) => (
            <ShopItemCard
              key={idx}
              shopItem={shopItem}
              index={idx}
              gold={runState?.gold || 0}
              onBuy={() => buyFromShop(idx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface ShopItemCardProps {
  shopItem: ShopItem;
  index: number;
  gold: number;
  onBuy: () => void;
}

const ShopItemCard: React.FC<ShopItemCardProps> = ({ shopItem, gold, onBuy }) => {
  const { item, sold } = shopItem;
  const canBuy = !sold && gold >= item.price;

  return (
    <div className={`shop-card ${sold ? 'shop-card-sold' : ''}`}>
      <div className="shop-card-icon">{item.icon}</div>
      <h3 className="shop-card-name">{item.name}</h3>
      <p className="shop-card-desc">{item.description}</p>
      <div className="shop-card-footer">
        <span className="shop-card-price">💰 {item.price}</span>
        {!sold && (
          <button
            className={`shop-buy-btn ${canBuy ? '' : 'shop-buy-btn-disabled'}`}
            onClick={onBuy}
            disabled={!canBuy}
          >
            {canBuy ? '购买' : '金币不足'}
          </button>
        )}
        {sold && <span className="shop-sold-label">已售出</span>}
      </div>
    </div>
  );
};

export default Shop;
