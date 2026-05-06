import { create } from 'zustand';
import {
  GameState,
  RunState,
  Tile,
  Buff,
  Item,
  RewardOption,
  ShopItem,
  GameEvent,
} from '../types';
import { gameApi } from '../api/gameApi';

interface GameStore {
  // 游戏状态
  runState: RunState | null;
  gameState: GameState | null;
  
  // UI状态
  selectedTile: Tile | null;
  availableActions: string[];
  showReward: boolean;
  rewardOptions: RewardOption[];
  showShop: boolean;
  shopItems: ShopItem[];
  showEvent: boolean;
  currentEvent: GameEvent | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  startGame: () => Promise<void>;
  loadState: () => Promise<void>;
  draw: () => Promise<void>;
  discard: (tile: Tile) => Promise<void>;
  chi: (tiles: Tile[]) => Promise<void>;
  pon: (tile: Tile) => Promise<void>;
  kan: (tile: Tile) => Promise<void>;
  riichi: (tile: Tile) => Promise<void>;
  ron: () => Promise<void>;
  tsumo: () => Promise<void>;
  skip: () => Promise<void>;
  selectReward: (index: number) => Promise<void>;
  buyFromShop: (index: number) => Promise<void>;
  chooseEventOption: (index: number) => Promise<void>;
  nextStage: () => Promise<void>;
  selectTile: (tile: Tile | null) => void;
  setAvailableActions: (actions: string[]) => void;
  setError: (error: string | null) => void;
  updateGameState: (state: GameState) => void;
  updateRunState: (state: RunState) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // 初始状态
  runState: null,
  gameState: null,
  selectedTile: null,
  availableActions: [],
  showReward: false,
  rewardOptions: [],
  showShop: false,
  shopItems: [],
  showEvent: false,
  currentEvent: null,
  isConnected: false,
  isLoading: false,
  error: null,

  // 开始新游戏
  startGame: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await gameApi.startGame();
      set({
        runState: response.runState,
        gameState: response.gameState,
        isConnected: true,
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // 加载状态
  loadState: async () => {
    const { runState } = get();
    if (!runState) return;
    
    set({ isLoading: true, error: null });
    try {
      const response = await gameApi.getState(runState.id);
      set({
        runState: response.runState,
        gameState: response.gameState,
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // 摸牌
  draw: async () => {
    const { runState } = get();
    if (!runState) return;
    
    set({ isLoading: true, error: null });
    try {
      const gameState = await gameApi.action(runState.id, { type: 'draw' });
      set({ gameState, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // 打牌
  discard: async (tile: Tile) => {
    const { runState } = get();
    if (!runState) return;
    
    set({ isLoading: true, error: null, selectedTile: null });
    try {
      const gameState = await gameApi.action(runState.id, {
        type: 'discard',
        tiles: [tile.id],
      });
      set({ gameState, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // 吃
  chi: async (tiles: Tile[]) => {
    const { runState } = get();
    if (!runState) return;
    
    set({ isLoading: true, error: null });
    try {
      const gameState = await gameApi.action(runState.id, {
        type: 'chi',
        tiles: tiles.map(t => t.id),
      });
      set({ gameState, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // 碰
  pon: async (tile: Tile) => {
    const { runState } = get();
    if (!runState) return;
    
    set({ isLoading: true, error: null });
    try {
      const gameState = await gameApi.action(runState.id, {
        type: 'pon',
        tiles: [tile.id],
      });
      set({ gameState, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // 杠
  kan: async (tile: Tile) => {
    const { runState } = get();
    if (!runState) return;
    
    set({ isLoading: true, error: null });
    try {
      const gameState = await gameApi.action(runState.id, {
        type: 'kan',
        tiles: [tile.id],
      });
      set({ gameState, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // 立直
  riichi: async (tile: Tile) => {
    const { runState } = get();
    if (!runState) return;
    
    set({ isLoading: true, error: null });
    try {
      const gameState = await gameApi.action(runState.id, {
        type: 'riichi',
        tiles: [tile.id],
      });
      set({ gameState, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // 荣和
  ron: async () => {
    const { runState } = get();
    if (!runState) return;
    
    set({ isLoading: true, error: null });
    try {
      const gameState = await gameApi.action(runState.id, { type: 'ron' });
      set({ gameState, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // 自摸
  tsumo: async () => {
    const { runState } = get();
    if (!runState) return;
    
    set({ isLoading: true, error: null });
    try {
      const gameState = await gameApi.action(runState.id, { type: 'tsumo' });
      set({ gameState, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // 跳过
  skip: async () => {
    const { runState } = get();
    if (!runState) return;
    
    set({ isLoading: true, error: null });
    try {
      const gameState = await gameApi.action(runState.id, { type: 'skip' });
      set({ gameState, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // 选择奖励
  selectReward: async (index: number) => {
    const { runState } = get();
    if (!runState) return;
    
    set({ isLoading: true, error: null });
    try {
      const newRunState = await gameApi.selectReward(runState.id, { rewardIndex: index });
      set({
        runState: newRunState,
        showReward: false,
        rewardOptions: [],
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // 商店购买
  buyFromShop: async (index: number) => {
    const { runState } = get();
    if (!runState) return;
    
    set({ isLoading: true, error: null });
    try {
      const newRunState = await gameApi.shopBuy(runState.id, { shopIndex: index });
      set({ runState: newRunState, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // 选择事件选项
  chooseEventOption: async (index: number) => {
    const { runState } = get();
    if (!runState) return;
    
    set({ isLoading: true, error: null });
    try {
      const newRunState = await gameApi.eventChoice(runState.id, { choiceIndex: index });
      set({
        runState: newRunState,
        showEvent: false,
        currentEvent: null,
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // 进入下一局
  nextStage: async () => {
    const { runState } = get();
    if (!runState) return;
    
    set({ isLoading: true, error: null });
    try {
      const response = await gameApi.nextStage(runState.id);
      set({
        runState: response.runState,
        gameState: response.gameState,
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // 选择牌
  selectTile: (tile: Tile | null) => set({ selectedTile: tile }),

  // 设置可用操作
  setAvailableActions: (actions: string[]) => set({ availableActions: actions }),

  // 设置错误
  setError: (error: string | null) => set({ error }),

  // 更新游戏状态
  updateGameState: (state: GameState) => set({ gameState: state }),

  // 更新运行状态
  updateRunState: (state: RunState) => set({ runState: state }),
}));
