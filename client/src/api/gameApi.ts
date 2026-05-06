import {
  GameState,
  RunState,
  StartGameResponse,
  ActionRequest,
  RewardRequest,
  ShopBuyRequest,
  EventChoiceRequest,
} from '../types';

const API_BASE = 'http://localhost:3001/api';

class GameApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Unknown error');
    }
    return result.data;
  }

  // 创建新Roguelike运行
  async startGame(): Promise<StartGameResponse> {
    return this.fetchJson<StartGameResponse>(`${this.baseUrl}/game/start`, {
      method: 'POST',
    });
  }

  // 获取当前完整状态
  async getState(gameId: string): Promise<{ runState: RunState; gameState: GameState }> {
    return this.fetchJson<{ runState: RunState; gameState: GameState }>(
      `${this.baseUrl}/game/${gameId}/state`
    );
  }

  // 执行麻将操作
  async action(gameId: string, action: ActionRequest): Promise<GameState> {
    return this.fetchJson<GameState>(`${this.baseUrl}/game/${gameId}/action`, {
      method: 'POST',
      body: JSON.stringify(action),
    });
  }

  // 选择局后奖励
  async selectReward(gameId: string, request: RewardRequest): Promise<RunState> {
    return this.fetchJson<RunState>(`${this.baseUrl}/game/${gameId}/reward`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 商店购买
  async shopBuy(gameId: string, request: ShopBuyRequest): Promise<RunState> {
    return this.fetchJson<RunState>(`${this.baseUrl}/game/${gameId}/shop/buy`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 处理事件选择
  async eventChoice(gameId: string, request: EventChoiceRequest): Promise<RunState> {
    return this.fetchJson<RunState>(`${this.baseUrl}/game/${gameId}/event`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 进入下一局
  async nextStage(gameId: string): Promise<{ runState: RunState; gameState: GameState }> {
    return this.fetchJson<{ runState: RunState; gameState: GameState }>(
      `${this.baseUrl}/game/${gameId}/next-stage`,
      { method: 'POST' }
    );
  }
}

export const gameApi = new GameApi();
