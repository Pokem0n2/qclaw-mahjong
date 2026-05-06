import React from 'react';
import { useGameStore } from '../../store/gameStore';
import './StageProgress.css';

const StageProgress: React.FC = () => {
  const { runState } = useGameStore();

  if (!runState) return null;

  const { currentStage, totalStages, history } = runState;
  const progress = ((currentStage - 1) / totalStages) * 100;

  return (
    <div className="stage-progress">
      <div className="progress-header">
        <span className="progress-label">关卡进度</span>
        <span className="progress-stage">
          第 {currentStage} / {totalStages} 局
        </span>
      </div>
      
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        {Array.from({ length: totalStages }).map((_, idx) => (
          <div
            key={idx}
            className={`progress-marker ${idx < currentStage - 1 ? 'completed' : idx === currentStage - 1 ? 'current' : ''}`}
            style={{ left: `${((idx + 1) / totalStages) * 100}%` }}
          >
            <span className="marker-number">{idx + 1}</span>
          </div>
        ))}
      </div>
      
      {history.length > 0 && (
        <div className="progress-history">
          {history.map((result, idx) => (
            <div key={idx} className="history-item">
              <span className="history-stage">第{result.stage}局</span>
              <span className="history-score">+{result.scoreGained}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StageProgress;
