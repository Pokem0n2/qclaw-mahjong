import React from 'react';
import Tile from '../Tile/Tile';
import { Tile as TileType } from '../../types';
import './DiscardPile.css';

interface DiscardPileProps {
  discards: TileType[];
  playerName: string;
  position: 'bottom' | 'left' | 'top' | 'right';
}

const DiscardPile: React.FC<DiscardPileProps> = ({ discards, playerName, position }) => {
  return (
    <div className={`discard-pile discard-${position}`}>
      <div className="discard-label">{playerName}</div>
      <div className={`discard-tiles discard-tiles-${position}`}>
        {discards.map((tile, idx) => (
          <Tile key={tile.id || idx} tile={tile} small />
        ))}
      </div>
    </div>
  );
};

export default DiscardPile;
