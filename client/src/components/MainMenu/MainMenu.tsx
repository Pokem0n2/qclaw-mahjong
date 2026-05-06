import React from 'react';
import { useGameStore } from '../../store/gameStore';
import './MainMenu.css';

const MainMenu: React.FC = () => {
  const { startGame, isLoading, error } = useGameStore();

  return (
    <div className="main-menu">
      <div className="menu-content">
        <div className="menu-title">
          <h1 className="title-main">🀄 麻将 Roguelike</h1>
          <p className="title-sub">青云之志</p>
        </div>
        
        <div className="menu-description">
          <p>类似雀魂「青云之志」模式的单机Roguelike麻将游戏</p>
          <p>在日麻规则下对战3个AI，每局获得增益，追求高分！</p>
        </div>
        
        <div className="menu-actions">
          <button
            className="menu-btn menu-btn-start"
            onClick={startGame}
            disabled={isLoading}
          >
            {isLoading ? '加载中...' : '开始游戏'}
          </button>
          
          <button className="menu-btn menu-btn-continue" disabled>
            继续游戏（开发中）
          </button>
        </div>
        
        <div className="menu-rules">
          <h3>游戏规则</h3>
          <ul>
            <li>共10局，每局对战3个AI</li>
            <li>和牌获得分数和金币</li>
            <li>每局结束选择奖励增益</li>
            <li>商店购买道具强化能力</li>
            <li>随机事件带来意外惊喜</li>
          </ul>
        </div>
        
        {error && (
          <div className="menu-error">
            <p>错误: {error}</p>
            <p className="error-hint">请确保后端服务已启动 (http://localhost:3001)</p>
          </div>
        )}
      </div>
      
      <div className="menu-footer">
        <p>使用 React + TypeScript + Vite 构建</p>
      </div>
    </div>
  );
};

export default MainMenu;
