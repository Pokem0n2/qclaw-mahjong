import React from 'react';
import Tile from '../Tile/Tile';
import { PlayerState } from '../../types';
import './OpponentHand.css';

interface OpponentHandProps {
  player: PlayerState;
  position: 'left' | 'top' | 'right';
}

const OpponentHand: React.FC<OpponentHandProps> = ({ player, position }) => {
  const tileCount = player.hand.length;
  const meldCount = player.melds.length;

  return (
    <div className={`opponent-hand opponent-${position}`}>
      <div className="opponent-label">{player.name}</div>
      <div className={`opponent-tiles opponent-tiles-${position}`}>
        {Array.from({ length: tileCount }).map((_, idx) => (
          <Tile key={idx} tile={{ id: idx, suit: 'man' as const, rank: 1, isRed: false }} isBack small />
        ))}
      </div>
      {meldCount > 0 && (
        <div className="opponent-melds">
          <span className="meld-count">{meldCount} 组副露</span>
        </div>
      )}
      {player.isRiichi && (
        <div className="riichi-indicator">立直</div>
      )}
    </div>
  );
};

export default OpponentHand;
