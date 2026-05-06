# 麻将Roguelike游戏 - 架构设计文档

## 项目概述

类似雀魂「青云之志」模式的单机Roguelike麻将游戏。玩家在日麻规则下对战3个AI，每局结束后获得Roguelike增益（道具、技能、分数倍数），逐步推进关卡，追求高分。

### 核心玩法循环
```
开始新游戏 → 选择初始增益 → 打一局麻将 → 结算 → 选择奖励 → 商店/事件 → 下一局 → ... → 通关/失败
```

### MVP 功能范围
1. **日麻核心**：摸牌、打牌、吃/碰/杠、立直、和牌判定（基础役种）
2. **AI对手**：3个AI玩家，简单策略（打最无用牌、能碰就碰等）
3. **Roguelike层**：每局后三选一增益、商店系统、随机事件
4. **分数系统**：基础点数 × 倍率乘数，跨局累积
5. **关卡进度**：共10局，每局难度递增（AI更强/规则更严）

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + CSS Modules |
| 后端 | Node.js + Express + TypeScript |
| 通信 | REST API + WebSocket（实时对局） |
| 状态管理 | 前端 Zustand，后端内存状态 |

---

## 项目目录结构

```
mahjong-roguelike/
├── client/                    # 前端项目
│   ├── public/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api/
│   │   │   └── gameApi.ts     # API客户端
│   │   ├── store/
│   │   │   └── gameStore.ts   # Zustand状态
│   │   ├── components/
│   │   │   ├── GameBoard/      # 牌桌主界面
│   │   │   │   ├── GameBoard.tsx
│   │   │   │   ├── PlayerHand.tsx
│   │   │   │   ├── OpponentHand.tsx
│   │   │   │   ├── DiscardPile.tsx
│   │   │   │   ├── DrawPile.tsx
│   │   │   │   └── ActionPanel.tsx
│   │   │   ├── Tile/
│   │   │   │   └── Tile.tsx    # 单张牌组件
│   │   │   ├── Roguelike/
│   │   │   │   ├── RewardSelect.tsx   # 三选一奖励
│   │   │   │   ├── Shop.tsx           # 商店
│   │   │   │   ├── EventModal.tsx     # 随机事件弹窗
│   │   │   │   ├── BuffBar.tsx        # 增益显示条
│   │   │   │   └── StageProgress.tsx  # 关卡进度
│   │   │   ├── ScoreBoard/
│   │   │   │   └── ScoreBoard.tsx
│   │   │   └── MainMenu/
│   │   │       └── MainMenu.tsx
│   │   ├── game/
│   │   │   ├── tileUtils.ts    # 牌面渲染工具
│   │   │   └── constants.ts    # 常量定义
│   │   └── styles/
│   │       └── global.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                    # 后端项目
│   ├── src/
│   │   ├── index.ts           # 入口
│   │   ├── mahjong/
│   │   │   ├── types.ts       # 核心类型定义
│   │   │   ├── Tile.ts        # 牌定义与工具
│   │   │   ├── Wall.ts        # 牌墙（摸牌堆）
│   │   │   ├── Hand.ts        # 手牌管理与判定
│   │   │   ├── WinChecker.ts  # 和牌判定
│   │   │   ├── Yakuman.ts     # 役种定义
│   │   │   ├── GameEngine.ts  # 一局麻将引擎
│   │   │   └── AIPlayer.ts    # AI决策
│   │   ├── roguelike/
│   │   │   ├── types.ts       # Roguelike类型
│   │   │   ├── BuffSystem.ts  # 增益系统
│   │   │   ├── ShopSystem.ts  # 商店系统
│   │   │   ├── EventSystem.ts # 事件系统
│   │   │   ├── RewardSystem.ts# 奖励系统
│   │   │   └── RunState.ts    # 一次完整Roguelike运行状态
│   │   └── api/
│   │       ├── routes.ts      # 路由定义
│   │       └── GameSession.ts # 游戏会话管理
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

---

## API 契约（前后端共享）

### 基础约定
- 所有API返回JSON，格式：`{ success: boolean, data?: T, error?: string }`
- WebSocket事件命名：`game:action` / `game:state`

### REST Endpoints

#### 游戏会话
```
POST   /api/game/start          创建新Roguelike运行
GET    /api/game/:id/state      获取当前完整状态
POST   /api/game/:id/action     执行麻将操作
POST   /api/game/:id/reward     选择局后奖励
POST   /api/game/:id/shop/buy   商店购买
POST   /api/game/:id/event      处理事件选择
POST   /api/game/:id/next-stage 进入下一局
```

### WebSocket 事件（对局实时交互）

```
Client → Server:
  game:draw         摸牌
  game:discard      打牌 { tileId }
  game:chi          吃 { tiles }
  game:pon          碰 { tile }
  game:kan          杠 { tile }
  game:riichi       立直 { tile }
  game:ron          荣和
  game:tsumo        自摸
  game:skip         跳过（不吃/碰/杠）

Server → Client:
  game:state        完整游戏状态推送
  game:action-prompt 提示可执行操作
  game:round-end    一局结束
  game:game-over    Roguelike运行结束
```

### 核心数据类型

```typescript
// ===== 麻将牌 =====
enum TileSuit {
  Man = 'man',     // 万
  Pin = 'pin',     // 筒
  Sou = 'sou',     // 条
  Wind = 'wind',   // 风
  Dragon = 'dragon' // 三元
}

interface Tile {
  id: number;        // 唯一ID (0-143)
  suit: TileSuit;
  rank: number;      // 1-9 (数牌) 或 1-4 (风:东南西北) 或 1-3 (三元:白发中)
  isRed: boolean;    // 赤宝牌
}

// ===== 牌局状态 =====
interface GameState {
  roundNumber: number;       // 当前局数
  honba: number;             // 本场数
  riichiSticks: number;      // 立直棒
  doraIndicators: Tile[];    // 宝牌指示牌
  wallRemaining: number;     // 牌墙剩余
  players: PlayerState[];    // 4个玩家
  currentPlayer: number;     // 当前玩家索引
  phase: GamePhase;          // 游戏阶段
  discardPile: Tile[][];     // 各家舍牌
  lastAction: Action | null;
}

interface PlayerState {
  index: number;
  name: string;
  isHuman: boolean;
  hand: Tile[];              // 手牌
  melds: Meld[];             // 副露
  discards: Tile[];          // 舍牌
  isRiichi: boolean;
  score: number;
  isDealer: boolean;
}

type GamePhase = 'deal' | 'draw' | 'discard' | 'action-prompt' | 'round-end';
type MeldType = 'chi' | 'pon' | 'kan';

interface Meld {
  type: MeldType;
  tiles: Tile[];
  fromPlayer: number;
}

interface Action {
  type: 'draw' | 'discard' | 'chi' | 'pon' | 'kan' | 'riichi' | 'ron' | 'tsumo' | 'skip';
  player: number;
  tiles?: Tile[];
}

// ===== 和牌结果 =====
interface WinResult {
  winner: number;
  loser?: number;             // 点炮者（荣和时）
  hand: Tile[];
  melds: Meld[];
  yakus: Yaku[];              // 成立的役
  han: number;                // 番数
  fu: number;                 // 符数
  basePoints: number;         // 基础点数
  finalPoints: number;        // 最终点数（含Roguelike加成）
}

interface Yaku {
  name: string;
  han: number;
}

// ===== Roguelike =====
interface RunState {
  id: string;
  currentStage: number;      // 当前关卡 (1-10)
  totalStages: number;       // 总关卡数
  baseScore: number;         // 累计基础分
  scoreMultiplier: number;   // 分数倍率
  gold: number;              // 金币
  buffs: Buff[];             // 当前增益列表
  items: Item[];             // 持有道具
  currentGame: GameState | null;
  phase: RunPhase;
  history: StageResult[];    // 每局结果记录
}

type RunPhase = 'menu' | 'playing' | 'reward' | 'shop' | 'event' | 'game-over';

interface Buff {
  id: string;
  name: string;
  description: string;
  icon: string;
  stackable: boolean;
  stacks: number;
  effect: BuffEffect;
}

type BuffEffect =
  | { type: 'score-multiplier'; value: number }
  | { type: 'draw-bonus'; tiles: number }    // 额外摸牌
  | { type: 'riichi-free' }                  // 免费立直
  | { type: 'dora-extra'; count: number }    // 额外宝牌
  | { type: 'yaku-bonus'; yakuName: string; extraHan: number }
  | { type: 'hand-size-bonus'; extraTiles: number } // 手牌上限增加
  | { type: 'peek-discard'; count: number }  // 预览对手舍牌
  | { type: 'lucky-draw'; probability: number } // 摸到好牌概率提升
  ;

interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  consumable: boolean;
  effect: BuffEffect;
}

interface ShopItem {
  item: Item;
  sold: boolean;
}

interface EventChoice {
  id: string;
  text: string;
  reward: Buff | Item | { type: 'gold'; amount: number };
}

interface GameEvent {
  id: string;
  name: string;
  description: string;
  choices: EventChoice[];
}

interface RewardOption {
  buff: Buff;
  description: string;
}

interface StageResult {
  stage: number;
  winResult: WinResult | null;
  scoreGained: number;
  goldGained: number;
  buffsGained: string[];
}

// ===== API请求/响应 =====
interface StartGameResponse {
  runState: RunState;
  gameState: GameState;
}

interface ActionRequest {
  type: ActionType;
  tiles?: number[];   // tile IDs
}

interface RewardRequest {
  rewardIndex: number;  // 选择第几个奖励 (0-2)
}

interface ShopBuyRequest {
  shopIndex: number;    // 购买商店中第几个物品
}

interface EventChoiceRequest {
  choiceIndex: number;  // 选择第几个选项
}

// ===== 初始增益 =====
interface StartingBonus {
  id: string;
  name: string;
  description: string;
  buff: Buff;
}
```

---

## 增益系统设计（Roguelike核心）

### 增益类型

| 类别 | 示例 | 效果 |
|------|------|------|
| 分数类 | 「一发万两」| 和牌点数 ×1.5 |
| 摸牌类 | 「顺风满帆」| 每局开始额外摸1张 |
| 宝牌类 | 「金光闪闪」| 额外翻开1张宝牌 |
| 立直类 | 「无本立直」| 立直不需支付点棒 |
| 役种类 | 「清一色之道」| 清一色额外+2番 |
| 防守类 | 「铜墙铁壁」| 点炮时损失减半 |
| 幸运类 | 「天选之人」| 摸到宝牌概率+20% |
| 手牌类 | 「大器晚成」| 手牌上限+1（14张） |

### 商店系统

- 每局结束后有概率出现商店
- 使用金币购买道具（金币来自和牌奖励）
- 商店物品随机刷新，3-5个选项

### 事件系统

- 随机触发，每局1-2次
- 事件提供2-3个选择，每个选择有不同奖励/风险
- 示例事件：「神社祈愿」（三选一增益）、「神秘商人」（折扣商店）、「天降横财」（获得金币）

---

## 关卡设计

| 关卡 | 特点 | AI难度 |
|------|------|--------|
| 1-3 | 入门，AI简单 | 随机打牌 |
| 4-6 | 中等，AI会做牌 | 基础策略 |
| 7-9 | 困难，AI强力 | 高级策略 |
| 10 | Boss关 | 最强AI |

---

## 前端设计要点

1. **牌面渲染**：CSS绘制麻将牌面，万/筒/条用数字+花色符号，风牌/三元牌用汉字
2. **牌桌布局**：俯视四方布局，下方为玩家手牌
3. **交互动画**：摸牌、打牌、吃碰杠有简单动画
4. **Roguelike UI**：半透明弹窗式，不打断游戏沉浸感
5. **响应式**：支持桌面和平板

---

## 后端设计要点

1. **无状态API**：每次请求传入游戏ID，从内存/Redis读取状态
2. **和牌判定**：递归拆分手牌，检查所有可能的和牌形
3. **AI策略**：基于牌效率的简单策略（计算打哪张牌听牌面最广）
4. **Roguelike随机**：使用seeded random确保可重放
