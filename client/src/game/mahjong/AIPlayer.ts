// ===== AI玩家决策 =====

import { GameState, PlayerState, Tile, TileSuit } from './types';
import { tilesEqual, tileKey, isNumberTile } from './Tile';

export class AIPlayer {
  public playerIndex: number;
  private difficulty: number;

  constructor(playerIndex: number, difficulty: number = 2) {
    this.playerIndex = playerIndex;
    this.difficulty = difficulty;
  }

  decideDiscard(player: PlayerState, gameState: GameState): Tile | null {
    if (player.hand.length === 0) return null;

    if (player.isRiichi && player.hand.length === 14) {
      return player.hand[player.hand.length - 1];
    }

    const discardValues = player.hand.map(tile => ({
      tile,
      value: this.calculateDiscardValue(tile, player, gameState)
    }));

    discardValues.sort((a, b) => a.value - b.value);
    return discardValues[0]?.tile ?? null;
  }

  private calculateDiscardValue(tile: Tile, player: PlayerState, gameState: GameState): number {
    let value = 0;

    // 安全度
    value += this.getSafetyValue(tile, gameState);
    
    // 效用
    value -= this.getTileUtility(tile, player);
    
    // 孤立惩罚
    value += this.getIsolationPenalty(tile, player);

    if (this.difficulty === 1) {
      value += (Math.random() - 0.5) * 2;
    }

    return value;
  }

  private getSafetyValue(tile: Tile, gameState: GameState): number {
    let safety = 0;

    if (tile.suit === TileSuit.Wind || tile.suit === TileSuit.Dragon) {
      safety += 1;
    }

    for (const p of gameState.players) {
      if (p.isRiichi && p.waitingTiles.length > 0) {
        if (p.waitingTiles.some(wt => tilesEqual(wt, tile))) {
          safety -= 5;
        }
      }
    }

    return safety;
  }

  private getTileUtility(tile: Tile, player: PlayerState): number {
    if (!isNumberTile(tile)) return 0;

    let utility = 0;
    const rank = tile.rank;
    const isCenter = rank >= 3 && rank <= 7;

    if (isCenter) utility += 3;

    const handKeys = new Set(player.hand.map(t => tileKey(t)));
    for (let r = rank - 2; r <= rank + 2; r++) {
      if (r >= 1 && r <= 9 && r !== rank) {
        if (handKeys.has(`${tile.suit}-${r}`)) {
          utility += 2;
        }
      }
    }

    const pairCount = player.hand.filter(t => tilesEqual(t, tile)).length;
    if (pairCount >= 2) utility += 10;
    if (pairCount >= 3) utility += 20;

    return utility;
  }

  private getIsolationPenalty(tile: Tile, player: PlayerState): number {
    if (!isNumberTile(tile)) return 0;

    const rank = tile.rank;
    let adjacent = 0;
    for (const t of player.hand) {
      if (t.suit === tile.suit && Math.abs(t.rank - rank) === 1) {
        adjacent++;
      }
    }

    if (adjacent === 0) {
      if (rank === 1 || rank === 9) return 3;
      if (rank === 2 || rank === 8) return 2;
      return 4;
    }

    return 0;
  }

  decidePon(player: PlayerState, gameState: GameState): boolean {
    if (this.difficulty === 1) return Math.random() < 0.5;
    return true;
  }

  decideKan(player: PlayerState, gameState: GameState): boolean {
    return player.waitingTiles.length > 0;
  }

  decideChi(player: PlayerState, gameState: GameState): boolean {
    if (this.difficulty === 3) return false;
    if (player.melds.length > 0) return false;
    return Math.random() < 0.3;
  }

  shouldRiichi(player: PlayerState, gameState: GameState): boolean {
    if (player.melds.length > 0) return false;
    if (player.score < 1000) return false;
    if (player.waitingTiles.length === 0) return false;

    if (this.difficulty === 3) return true;
    if (this.difficulty === 2) return Math.random() < 0.8;
    return Math.random() < 0.5;
  }
}
