// ===== Express服务器入口 =====

import express from 'express';
import cors from 'cors';
import { createRouter } from './api/routes';

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API路由
app.use('/api', createRouter());

// 404处理
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not Found' });
});

// 错误处理
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🎴 麻将Roguelike服务器已启动`);
  console.log(`🌐 访问地址: http://localhost:${PORT}`);
  console.log(`📡 API前缀: http://localhost:${PORT}/api`);
  console.log('');
  console.log('可用API端点:');
  console.log('  POST /api/game/start          - 创建新游戏');
  console.log('  GET  /api/game/:id/state      - 获取游戏状态');
  console.log('  POST /api/game/:id/action     - 执行动作');
  console.log('  GET  /api/game/:id/actions    - 获取可用动作');
  console.log('  GET  /api/game/:id/rewards    - 获取奖励选项');
  console.log('  POST /api/game/:id/reward    - 选择奖励');
  console.log('  POST /api/game/:id/shop/enter - 进入商店');
  console.log('  POST /api/game/:id/shop/buy  - 购买物品');
  console.log('  POST /api/game/:id/event      - 触发/处理事件');
  console.log('  POST /api/game/:id/next-stage - 进入下一局');
  console.log('  POST /api/game/:id/start      - 开始当前局');
});

export { app };
