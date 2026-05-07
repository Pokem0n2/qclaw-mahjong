import { defineConfig } from 'zustand';
import { gameService } from '../game/GameService';
import { GameState, RunState, Tile, ActionType, WinResult, PlayerState, Buff } from '../game';
import { tilesEqual } from '../game/mahjong/Tile';

interface GameStore {
  // ===== 状态 =====
  gameState: GameState | null;
  runState: RunState | null;
  loading: boolean;
  error: string | null;
  
  // UI状态
  selectedTile: Tile | null;
  availableActions: string[];
  showRewardSelect: boolean;
  pendingRewards: Buff[];
  
  // ===== 游戏流程 =====
  startGame: () => Promise<void>;
  startNewGame: () => Promise<void>;
  
  // ===== 玩家操作 =====
  selectTile: (tile: Tile) => void;
  discard: (tile: Tile) => Promise<void>;
  
  // ===== 动作 =====
  chi: (targetTile: Tile) => Promise<void>;
  pon: (targetTile: Tile) => Promise<void>;
  kan: (targetTile: Tile) => Promise<void>;
  riichi: (tile: Tile) => Promise<void>;
  ron: () => Promise<void>;
  tsumo: () => Promise<void>;
  skip: () => Promise<void>;
  
  // ===== Roguelike =====
  selectReward: (rewardIndex: number) => Promise<void>;
  buyItem: (shopIndex: number) => Promise<void>;
  nextStage: () => Promise<void>;
  triggerEvent: () => void;
  resolveEvent: (choiceIndex: number) => void;
  
  // ===== 工具 =====
  reset: () => void;
  clearError: () => void;
  
  // ===== 内部方法 =====
  _setAvailableActions: (actions: string[]) => void;
  _processTurn: () => Promise<void>;
}

export const useGameStore = defineConfig<GameStore>((set, get) => ({
  // ===== 初始状态 =====
  gameState: null,
  runState: null,
  loading: false,
  error: null,
  selectedTile: null,
  availableActions: [],
  showRewardSelect: false,
  pendingRewards: [],

  // ===== 开始游戏 =====
  startGame: async () => {
    await get().startNewGame();
  },

  startNewGame: async () => {
    set({ loading: true, error: null, selectedTile: null });
    try {
      // 开始新run
      gameService.startNewRun();
      
      // 开始第一局
      const result = gameService.startGame();
      if (result) {
        set({
          gameState: result.gameState,
          runState: result.runState,
          loading: false,
          selectedTile: null,
          availableActions: []
        });
        
        // 如果是玩家的回合，检查可用的动作
        await get()._processTurn();
      } else {
        set({ error: '无法开始游戏', loading: false });
      }
    } catch (e: any) {
      set({ error: e.message || '启动失败', loading: false });
    }
  },

  // ===== 选牌 =====
  selectTile: (tile: Tile) => {
    const current = get().selectedTile;
    if (current && current.id === tile.id) {
      // 取消选择
      set({ selectedTile: null });
    } else {
      set({ selectedTile: tile });
    }
  },

  // ===== 打牌 =====
  discard: async (tile: Tile) => {
    const { gameState } = get();
    if (!gameState) return;
    
    set({ loading: true, error: null, selectedTile: null });
    try {
      const playerIndex = gameState.players.findIndex(p => p.isHuman);
      const result = gameService.executeAction(playerIndex, 'discard', [tile.id]);
      
      if (result.success) {
        set({ gameState: result.gameState || null, loading: false });
        
        // 处理AI回合
        await get()._processTurn();
      } else {
        set({ error: result.error || '打牌失败', loading: false });
      }
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  // ===== 吃碰杠 =====
  chi: async (targetTile: Tile) => {
    const { gameState, selectedTile } = get();
    if (!gameState || !selectedTile) return;
    
    set({ loading: true, error: null });
    try {
      const playerIndex = gameState.players.findIndex(p => p.isHuman);
      const result = gameService.executeAction(playerIndex, 'chi', [selectedTile.id, targetTile.id]);
      
      if (result.success) {
        set({ gameState: result.gameState || null, loading: false, selectedTile: null });
        await get()._processTurn();
      } else {
        set({ error: result.error || '吃牌失败', loading: false });
      }
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  pon: async (targetTile: Tile) => {
    const { gameState } = get();
    if (!gameState) return;
    
    set({ loading: true, error: null });
    try {
      const playerIndex = gameState.players.findIndex(p => p.isHuman);
      const result = gameService.executeAction(playerIndex, 'pon', [targetTile.id]);
      
      if (result.success) {
        set({ gameState: result.gameState || null, loading: false, selectedTile: null });
        await get()._processTurn();
      } else {
        set({ error: result.error || '碰牌失败', loading: false });
      }
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  kan: async (targetTile: Tile) => {
    const { gameState } = get();
    if (!gameState) return;
    
    set({ loading: true, error: null });
    try {
      const playerIndex = gameState.players.findIndex(p => p.isHuman);
      const result = gameService.executeAction(playerIndex, 'kan', [targetTile.id]);
      
      if (result.success) {
        set({ gameState: result.gameState || null, loading: false, selectedTile: null });
        await get()._processTurn();
      } else {
        set({ error: result.error || '杠牌失败', loading: false });
      }
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  riichi: async (tile: Tile) => {
    const { gameState } = get();
    if (!gameState) return;
    
    set({ loading: true, error: null });
    try {
      const playerIndex = gameState.players.findIndex(p => p.isHuman);
      const result = gameService.executeAction(playerIndex, 'riichi', [tile.id]);
      
      if (result.success) {
        set({ gameState: result.gameState || null, loading: false });
        await get()._processTurn();
      } else {
        set({ error: result.error || '立直失败', loading: false });
      }
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  ron: async () => {
    const { gameState } = get();
    if (!gameState) return;
    
    set({ loading: true, error: null });
    try {
      const playerIndex = gameState.players.findIndex(p => p.isHuman);
      const result = gameService.executeAction(playerIndex, 'ron');
      
      if (result.success) {
        set({ gameState: result.gameState || null, loading: false });
        if (result.winResult) {
          // 处理和牌后的奖励
          const runState = gameService.getRunState();
          if (runState) {
            set({ runState, showRewardSelect: runState.phase === 'reward' });
          }
        }
      } else {
        set({ error: result.error || '荣和失败', loading: false });
      }
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  tsumo: async () => {
    const { gameState } = get();
    if (!gameState) return;
    
    set({ loading: true, error: null });
    try {
      const playerIndex = gameState.players.findIndex(p => p.isHuman);
      const result = gameService.executeAction(playerIndex, 'tsumo');
      
      if (result.success) {
        set({ gameState: result.gameState || null, loading: false });
        if (result.winResult) {
          const runState = gameService.getRunState();
          if (runState) {
            set({ runState, showRewardSelect: runState.phase === 'reward' });
          }
        }
      } else {
        set({ error: result.error || '自摸失败', loading: false });
      }
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  skip: async () => {
    set({ loading: true, error: null });
    try {
      const { gameState } = get();
      if (!gameState) return;
      
      const playerIndex = gameState.players.findIndex(p => p.isHuman);
      const result = gameService.executeAction(playerIndex, 'skip');
      
      if (result.success) {
        set({ gameState: result.gameState || null, loading: false, selectedTile: null });
        await get()._processTurn();
      } else {
        set({ error: result.error || '跳过失败', loading: false });
      }
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  // ===== Roguelike =====
  selectReward: async (rewardIndex: number) => {
    set({ loading: true, error: null });
    try {
      gameService.selectReward(rewardIndex);
      const runState = gameService.getRunState();
      if (runState) {
        set({
          runState,
          loading: false,
          showRewardSelect: runState.phase === 'reward'
        });
      }
    } catch (e: any) {
      set({ error: e.message, loading: false });
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
        set({ error: result.error || '购买失败', loading: false });
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
          gameState: result.gameState || null,
          runState: result.runState || null,
          loading: false
        });
        if (result.gameState) {
          await get()._processTurn();
        }
      } else {
        set({ error: '进入下一关失败', loading: false });
      }
    } catch (e: any) {
      set({ error: e.message, loading: false });
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
    const runState = get().runState;
    if (runState && runState.phase === 'event') {
      const result = gameService.resolveEvent({ choices: [] }, choiceIndex);
      const newRunState = gameService.getRunState();
      if (newRunState) {
        set({ runState: newRunState });
      }
    }
  },

  // ===== 工具 =====
  reset: () => {
    set({
      gameState: null,
      runState: null,
      loading: false,
      error: null,
      selectedTile: null,
      availableActions: [],
      showRewardSelect: false,
      pendingRewards: []
    });
  },

  clearError: () => {
    set({ error: null });
  },

  // ===== 内部方法 =====
  _setAvailableActions: (actions: string[]) => {
    set({ availableActions: actions });
  },

  _processTurn: async () => {
    const { gameState, runState } = get();
    if (!gameState || !runState) return;

    const currentPlayer = gameState.players[gameState.currentPlayer];
    
    if (currentPlayer.isHuman) {
      // 玩家的回合 - 检查可用动作
      const actions = gameService.getAvailableActions();
      set({ availableActions: actions });
    } else {
      // AI回合
      set({ loading: true });
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // 等待动画
        const result = gameService.executeAI();
        if (result.success) {
          set({ gameState: result.gameState || null, loading: false });
          // 继续处理回合
          await get()._processTurn();
        } else {
          set({ loading: false });
        }
      } catch (e: any) {
        set({ error: e.message, loading: false });
      }
    }
  }
}));
