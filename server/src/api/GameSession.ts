// ===== 游戏会话管理 =====

import { RunStateManager } from '../roguelike/RunState';
import { RunState } from '../roguelike/types';
import { GameState } from '../mahjong/types';

export class GameSession {
  private manager: RunStateManager;
  private sessions: Map<string, { runId: string; createdAt: number }> = new Map();

  constructor() {
    this.manager = new RunStateManager();
  }

  // 创建新会话
  createSession(): { sessionId: string; runId: string; runState: RunState } {
    const run = this.manager.createRun();
    const sessionId = this.generateSessionId();
    this.sessions.set(sessionId, { runId: run.id, createdAt: Date.now() });
    return { sessionId, runId: run.id, runState: run };
  }

  // 获取会话
  getSession(sessionId: string): { runId: string } | null {
    return this.sessions.get(sessionId) ?? null;
  }

  // 获取Run状态
  getRunState(sessionId: string): RunState | null {
    const session = this.getSession(sessionId);
    if (!session) return null;
    return this.manager.getRunState(session.runId);
  }

  // 开始游戏
  startGame(sessionId: string): { success: boolean; runState?: RunState; gameState?: GameState; error?: string } {
    const session = this.getSession(sessionId);
    if (!session) return { success: false, error: 'Session不存在' };
    return this.manager.startGame(session.runId);
  }

  // 执行动作
  executeAction(sessionId: string, playerIndex: number, actionType: string, tileIds?: number[]): any {
    const session = this.getSession(sessionId);
    if (!session) return { success: false, error: 'Session不存在' };
    return this.manager.executeAction(session.runId, playerIndex, actionType, tileIds);
  }

  // 获取游戏状态
  getGameState(sessionId: string): GameState | null {
    const session = this.getSession(sessionId);
    if (!session) return null;
    return this.manager.getGameState(session.runId);
  }

  // 获取可用动作
  getAvailableActions(sessionId: string, playerIndex: number): any {
    const session = this.getSession(sessionId);
    if (!session) return null;
    return this.manager.getAvailableActions(session.runId, playerIndex);
  }

  // 获取奖励选项
  getRewardOptions(sessionId: string): any[] {
    const session = this.getSession(sessionId);
    if (!session) return [];
    return this.manager.getRewardOptions(session.runId);
  }

  // 选择奖励
  selectReward(sessionId: string, rewardIndex: number): any {
    const session = this.getSession(sessionId);
    if (!session) return { success: false, error: 'Session不存在' };
    return this.manager.selectReward(session.runId, rewardIndex);
  }

  // 进入商店
  enterShop(sessionId: string): any {
    const session = this.getSession(sessionId);
    if (!session) return { success: false, error: 'Session不存在' };
    return this.manager.enterShop(session.runId);
  }

  // 购买物品
  buyItem(sessionId: string, shopIndex: number): any {
    const session = this.getSession(sessionId);
    if (!session) return { success: false, error: 'Session不存在' };
    return this.manager.buyItem(session.runId, shopIndex);
  }

  // 触发事件
  triggerEvent(sessionId: string): any {
    const session = this.getSession(sessionId);
    if (!session) return { success: false, error: 'Session不存在' };
    return this.manager.triggerEvent(session.runId);
  }

  // 处理事件选择
  resolveEventChoice(sessionId: string, choiceIndex: number, event: any): any {
    const session = this.getSession(sessionId);
    if (!session) return { success: false, goldDelta: 0, message: 'Session不存在' };
    return this.manager.resolveEventChoice(session.runId, choiceIndex, event);
  }

  // 局后结算
  resolveRoundEnd(sessionId: string): any {
    const session = this.getSession(sessionId);
    if (!session) return { success: false };
    return this.manager.resolveRoundEnd(session.runId);
  }

  // 进入下一局
  nextStage(sessionId: string): any {
    const session = this.getSession(sessionId);
    if (!session) return { success: false, error: 'Session不存在' };
    return this.manager.nextStage(session.runId);
  }

  // 销毁会话
  destroySession(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (session) {
      this.manager.deleteRun(session.runId);
      this.sessions.delete(sessionId);
    }
  }

  private generateSessionId(): string {
    return 'sess_' + Math.random().toString(36).substring(2, 15);
  }
}

// 全局单例
export const gameSession = new GameSession();
