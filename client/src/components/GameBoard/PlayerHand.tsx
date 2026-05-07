import React from 'react';
import Tile from '../Tile/Tile';
import { Tile as TileType } from '../../game';
import { useGameStore } from '../../store/gameStore';
import './PlayerHand.css';

const PlayerHand: React.FC = () => {
  const { gameState, selectedTile, selectTile, discard } = useGameStore();
  
  if (!gameState) return null;
  
  const player = gameState.players.find(p => p.isHuman);
  if (!player) return null;

  const handleTileClick = (tile: TileType) => {
    if (selectedTile?.id === tile.id) {
      // 双击打牌
      discard(tile);
    } else {
      selectTile(tile);
    }
  };

  const sortedHand = [...player.hand].sort((a, b) => {
    // 按花色和数字排序
    if (a.suit !== b.suit) {
      const suitOrder = ['man', 'pin', 'sou', 'wind', 'dragon'];
      return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
    }
    return a.rank - b.rank;
  });

  return (
    <div className="player-hand">
      <div className="hand-label">{player.name} 的手牌</div>
      <div className="hand-tiles">
        {sortedHand.map(tile => (
          <Tile
            key={tile.id}
            tile={tile}
            isSelected={selectedTile?.id === tile.id}
            onClick={() => handleTileClick(tile)}
          />
        ))}
      </div>
      {player.melds.length > 0 && (
        <div className="hand-melds">
          {player.melds.map((meld, idx) => (
            <div key={idx} className="meld-group">
              <span className="meld-type">{meld.type}</span>
              {meld.tiles.map(tile => (
                <Tile key={tile.id} tile={tile} small />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerHand;
