// ===== REST路由定义 =====

import { Router, Request, Response } from 'express';
import { gameSession } from './GameSession';
import { ActionRequest, RewardRequest, ShopBuyRequest, EventChoiceRequest, ApiResponse } from '../mahjong/types';

export function createRouter(): Router {
  const router = Router();

  // 辅助函数：构建响应
  function ok<T>(res: Response, data: T, status = 200): void {
    const response: ApiResponse<T> = { success: true, data };
    res.status(status).json(response);
  }

  function err(res: Response, error: string, status = 400): void {
    const response: ApiResponse = { success: false, error };
    res.status(status).json(response);
  }

  // ===== 游戏会话 =====

  // POST /api/game/start - 创建新游戏
  router.post('/game/start', (req: Request, res: Response) => {
    try {
      const session = gameSession.createSession();
      ok(res, {
        sessionId: session.sessionId,
        runState: session.runState
      });
    } catch (e: any) {
      err(res, e.message, 500);
    }
  });

  // GET /api/game/:id/state - 获取当前状态
  router.get('/game/:sessionId/state', (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const runState = gameSession.getRunState(sessionId);
      if (!runState) {
        err(res, 'Session不存在', 404);
        return;
      }
      const gameState = gameSession.getGameState(sessionId);
      ok(res, { runState, gameState });
    } catch (e: any) {
      err(res, e.message, 500);
    }
  });

  // POST /api/game/:id/action - 执行麻将操作
  router.post('/game/:sessionId/action', (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const body: ActionRequest = req.body;

      // 获取当前状态，确认是玩家操作
      const gameState = gameSession.getGameState(sessionId);
      if (!gameState) {
        err(res, '游戏未开始', 400);
        return;
      }

      const playerIndex = 0; // 玩家固定是索引0
      const tileIds = body.tiles ?? (body.discardTile !== undefined ? [body.discardTile] : undefined);

      const result = gameSession.executeAction(sessionId, playerIndex, body.type, tileIds);
      if (!result.success) {
        err(res, result.error ?? '操作失败', 400);
        return;
      }

      const newGameState = gameSession.getGameState(sessionId);
      const runState = gameSession.getRunState(sessionId);

      // 检查是否局结束
      if (newGameState?.phase === 'round-end') {
        gameSession.resolveRoundEnd(sessionId);
        const updatedRunState = gameSession.getRunState(sessionId);
        ok(res, { action: result, gameState: newGameState, runState: updatedRunState, roundEnded: true });
        return;
      }

      ok(res, { action: result, gameState: newGameState, runState });
    } catch (e: any) {
      err(res, e.message, 500);
    }
  });

  // GET /api/game/:sessionId/actions - 获取可用动作
  router.get('/game/:sessionId/actions', (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const actions = gameSession.getAvailableActions(sessionId, 0);
      ok(res, { actions });
    } catch (e: any) {
      err(res, e.message, 500);
    }
  });

  // ===== Roguelike =====

  // POST /api/game/:id/reward - 选择奖励
  router.post('/game/:sessionId/reward', (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const body: RewardRequest = req.body;

      // 先生成奖励选项
      const options = gameSession.getRewardOptions(sessionId);
      if (body.rewardIndex < 0 || body.rewardIndex >= options.length) {
        err(res, '无效奖励索引', 400);
        return;
      }

      const result = gameSession.selectReward(sessionId, body.rewardIndex);
      if (!result.success) {
        err(res, result.error ?? '选择失败', 400);
        return;
      }

      // 判断是否进入商店或事件
      const runState = gameSession.getRunState(sessionId);
      ok(res, { reward: result.buff, runState });
    } catch (e: any) {
      err(res, e.message, 500);
    }
  });

  // GET /api/game/:sessionId/rewards - 获取奖励选项
  router.get('/game/:sessionId/rewards', (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const options = gameSession.getRewardOptions(sessionId);
      ok(res, { options });
    } catch (e: any) {
      err(res, e.message, 500);
    }
  });

  // POST /api/game/:sessionId/shop/buy - 商店购买
  router.post('/game/:sessionId/shop/buy', (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const body: ShopBuyRequest = req.body;
      const result = gameSession.buyItem(sessionId, body.shopIndex);
      if (!result.success) {
        err(res, result.error ?? '购买失败', 400);
        return;
      }
      const runState = gameSession.getRunState(sessionId);
      ok(res, { item: result.item, goldSpent: result.goldSpent, runState });
    } catch (e: any) {
      err(res, e.message, 500);
    }
  });

  // POST /api/game/:sessionId/shop/enter - 进入商店
  router.post('/game/:sessionId/shop/enter', (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const result = gameSession.enterShop(sessionId);
      if (!result.success) {
        err(res, result.error ?? '无法进入商店', 400);
        return;
      }
      ok(res, { shop: result.items });
    } catch (e: any) {
      err(res, e.message, 500);
    }
  });

  // POST /api/game/:sessionId/event - 处理事件
  router.post('/game/:sessionId/event', (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const body: EventChoiceRequest = req.body;

      // 先触发事件
      if (!body.event) {
        const triggerResult = gameSession.triggerEvent(sessionId);
        if (!triggerResult.success) {
          err(res, triggerResult.error ?? '触发事件失败', 400);
          return;
        }
        ok(res, { event: triggerResult.event });
        return;
      }

      // 处理选择
      if (body.choiceIndex === undefined) {
        err(res, 'choiceIndex is required', 400); return;
      }
      const result = gameSession.resolveEventChoice(sessionId, body.choiceIndex, body.event);
      const runState = gameSession.getRunState(sessionId);
      ok(res, { result, runState });
    } catch (e: any) {
      err(res, e.message, 500);
    }
  });

  // POST /api/game/:sessionId/next-stage - 进入下一局
  router.post('/game/:sessionId/next-stage', (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const result = gameSession.nextStage(sessionId);
      if (!result.success) {
        err(res, result.error ?? '无法进入下一局', 400);
        return;
      }
      ok(res, { runState: result.runState });
    } catch (e: any) {
      err(res, e.message, 500);
    }
  });

  // POST /api/game/:sessionId/start - 开始当前局游戏
  router.post('/game/:sessionId/start', (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const result = gameSession.startGame(sessionId);
      if (!result.success) {
        err(res, result.error ?? '无法开始游戏', 400);
        return;
      }
      ok(res, { runState: result.runState, gameState: result.gameState });
    } catch (e: any) {
      err(res, e.message, 500);
    }
  });

  return router;
}
