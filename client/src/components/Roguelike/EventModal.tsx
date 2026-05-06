import React from 'react';
import { useGameStore } from '../../store/gameStore';
import './EventModal.css';

const EventModal: React.FC = () => {
  const { showEvent, currentEvent, chooseEventOption } = useGameStore();

  if (!showEvent || !currentEvent) return null;

  return (
    <div className="event-overlay">
      <div className="event-modal">
        <div className="event-icon">⚡</div>
        <h2 className="event-title">{currentEvent.name}</h2>
        <p className="event-description">{currentEvent.description}</p>
        
        <div className="event-choices">
          {currentEvent.choices.map((choice, idx) => (
            <button
              key={choice.id}
              className="event-choice-btn"
              onClick={() => chooseEventOption(idx)}
            >
              <span className="choice-text">{choice.text}</span>
              <span className="choice-reward">
                {getRewardText(choice.reward)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

function getRewardText(reward: any): string {
  if (reward.type === 'gold') {
    return `💰 +${reward.amount} 金币`;
  }
  if (reward.name) {
    return `✨ ${reward.name}`;
  }
  return '';
}

export default EventModal;
