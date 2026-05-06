import { defineConfig } from 'zustand';
import { gameService } from '../game/GameService';
import { GameState, RunState, WinResult, Tile, ActionType } from '../game';

interface GameStore {
  // 状态
  gameState: GameState | null;
  runState: RunState | null;
  loading: boolean;
  error: string | null;
  
  // 游戏流程
  startNewGame: () => Promise<void>;
  executeAction: (playerIndex: number, action: ActionType, tileIds?: number[]) => Promise<void>;
  selectReward: (rewardIndex: number) => Promise<void>;
  nextStage: () => Promise<void>;
  
  // 商店
  enterShop: () => void;
  buyItem: (shopIndex: number) => Promise<void>;
  exitShop: () => void;
  
  // 事件
  triggerEvent: () => void;
  resolveEvent: (choiceIndex: number) => void;
  
  // 工具
  reset: () => void;
}

export const useGameStore = defineConfig<GameStore>((set, get) => ({
  gameState: null,
  runState: null,
  loading: false,
  error: null,

  startNewGame: async () => {
    set({ loading: true, error: null });
    try {
      const runState = gameService.startNewRun();
      const result = gameService.startGame();
      if (result) {
        set({ 
          gameState: result.gameState, 
          runState: result.runState,
          loading: false 
        });
      }
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  executeAction: async (playerIndex: number, action: ActionType, tileIds?: number[]) => {
    set({ loading: true, error: null });
    try {
      const result = gameService.executeAction(playerIndex, action, tileIds);
      if (result.success) {
        set({ gameState: result.gameState ?? null, loading: false });
        if (result.winResult) {
          // 和牌后可以选择奖励
          const runState = gameService.getRunState();
          if (runState) {
            set({ runState });
          }
        }
      } else {
        set({ error: result.error ?? '操作失败', loading: false });
      }
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  selectReward: async (rewardIndex: number) => {
    set({ loading: true, error: null });
    try {
      const buff = gameService.selectReward(rewardIndex);
      const runState = gameService.getRunState();
      if (runState) {
        set({ runState, loading: false });
      }
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  nextStage: async () => {
    set({ loading: true, error: null });
    try {
      const result = gameService.nextStage();
      if (result.success) {
        set({ 
          gameState: result.gameState ?? null,
          runState: result.runState ?? null,
          loading: false 
        });
        if (result.isGameOver) {
          // 游戏结束处理
        }
      }
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  enterShop: () => {
    const result = gameService.enterShop();
    const runState = gameService.getRunState();
    if (runState) {
      set({ runState });
    }
  },

  buyItem: async (shopIndex: number) => {
    set({ loading: true, error: null });
    try {
      const result = gameService.buyItem(shopIndex);
      if (result.success) {
        const runState = gameService.getRunState();
        if (runState) {
          set({ runState, loading: false });
        }
      } else {
        set({ error: result.error ?? '购买失败', loading: false });
      }
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  exitShop: () => {
    const runState = gameService.getRunState();
    if (runState) {
      runState.phase = 'playing';
      set({ runState });
    }
  },

  triggerEvent: () => {
    const result = gameService.triggerEvent();
    if (result) {
      const runState = gameService.getRunState();
      if (runState) {
        set({ runState });
      }
    }
  },

  resolveEvent: (choiceIndex: number) => {
    const runState = gameService.getRunState();
    if (runState && runState.phase === 'event') {
      // 这里需要当前事件
      const event = { choices: [] }; // 从runState获取当前事件
      const result = gameService.resolveEvent(event, choiceIndex);
      const newRunState = gameService.getRunState();
      if (newRunState) {
        set({ runState: newRunState });
      }
    }
  },

  reset: () => {
    set({ gameState: null, runState: null, loading: false, error: null });
  }
}));
