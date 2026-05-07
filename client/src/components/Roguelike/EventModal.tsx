import React from 'react';
import { useGameStore } from '../../store/gameStore';
import './EventModal.css';

const EventModal: React.FC = () => {
  const { runState, resolveEvent } = useGameStore();

  if (!runState || runState.phase !== 'event') return null;

  // 暂时隐藏事件，等事件系统完善后再启用
  // 目前游戏直接进入下一关

  return (
    <div className="event-overlay">
      <div className="event-modal">
        <div className="event-icon">⚡</div>
        <h2 className="event-title">随机事件</h2>
        <p className="event-description">游戏继续中...</p>
        <button 
          className="event-continue-btn"
          onClick={() => useGameStore.getState().nextStage()}
        >
          继续
        </button>
      </div>
    </div>
  );
};

export default EventModal;
