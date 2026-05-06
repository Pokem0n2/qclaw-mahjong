import React from 'react';
import { useGameStore } from './store/gameStore';
import MainMenu from './components/MainMenu/MainMenu';
import GameBoard from './components/GameBoard/GameBoard';
import RewardSelect from './components/Roguelike/RewardSelect';
import Shop from './components/Roguelike/Shop';
import EventModal from './components/Roguelike/EventModal';
import BuffBar from './components/Roguelike/BuffBar';
import StageProgress from './components/Roguelike/StageProgress';
import ScoreBoard from './components/ScoreBoard/ScoreBoard';
import './styles/global.css';
import './styles/game-over.css';

const App: React.FC = () => {
  const { runState, gameState } = useGameStore();

  // 主菜单状态
  if (!runState || runState.phase === 'menu') {
    return <MainMenu />;
  }

  // 游戏结束状态
  if (runState.phase === 'game-over') {
    return (
      <div className="game-over-screen">
        <h1>🏆 游戏结束</h1>
        <div className="final-score">
          <p>最终得分: {Math.floor(runState.baseScore * runState.scoreMultiplier).toLocaleString()}</p>
          <p>完成关卡: {runState.currentStage - 1} / {runState.totalStages}</p>
        </div>
        <button onClick={() => window.location.reload()}>再来一局</button>
      </div>
    );
  }

  return (
    <>
      {/* 主游戏界面 */}
      <GameBoard />
      
      {/* Roguelike UI层 */}
      <BuffBar />
      <StageProgress />
      <ScoreBoard />
      
      {/* 弹窗层 */}
      <RewardSelect />
      <Shop />
      <EventModal />
    </>
  );
};

export default App;
