import React from 'react';
import { Tile as TileType } from '../../types';
import { TileSuit } from '../../types';
import { getTileDisplay, getTileColor, NUMBER_NAMES } from '../../constants';
import './Tile.css';

interface TileProps {
  tile: TileType;
  isSelected?: boolean;
  onClick?: () => void;
  isBack?: boolean;
  small?: boolean;
}

const Tile: React.FC<TileProps> = ({ tile, isSelected, onClick, isBack, small }) => {
  if (isBack) {
    return (
      <div className={`tile tile-back ${small ? 'tile-small' : ''}`}>
        <div className="tile-back-pattern"></div>
      </div>
    );
  }

  const display = getTileDisplay(tile);
  const color = getTileColor(tile);

  return (
    <div
      className={`tile ${isSelected ? 'tile-selected' : ''} ${small ? 'tile-small' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="tile-face">
        {tile.suit === TileSuit.Man && (
          <div className="tile-content tile-man">
            <span className="tile-number" style={{ color }}>{NUMBER_NAMES[tile.rank - 1]}</span>
            <span className="tile-suit" style={{ color }}>万</span>
          </div>
        )}
        {tile.suit === TileSuit.Pin && (
          <div className="tile-content tile-pin">
            <span className="tile-circle" style={{ color }}>{display}</span>
          </div>
        )}
        {tile.suit === TileSuit.Sou && (
          <div className="tile-content tile-sou">
            <span className="tile-number" style={{ color }}>{tile.rank}</span>
            <span className="tile-suit" style={{ color }}>条</span>
          </div>
        )}
        {tile.suit === TileSuit.Wind && (
          <div className="tile-content tile-wind">
            <span className="tile-character" style={{ color }}>{display}</span>
          </div>
        )}
        {tile.suit === TileSuit.Dragon && (
          <div className="tile-content tile-dragon">
            <span className="tile-character" style={{ color }}>{display}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tile;
