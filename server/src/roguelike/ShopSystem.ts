// ===== 商店系统 =====

import { Item, ShopItem } from './types';
import { BuffSystem, ITEM_TEMPLATES } from './BuffSystem';
import { v4 as uuidv4 } from 'uuid';

export class ShopSystem {
  private shopItems: ShopItem[] = [];
  private rng: () => number;

  constructor(rng?: () => number) {
    this.rng = rng ?? Math.random;
  }

  // 生成商店商品
  generateShop(itemCount: number = 4, discountChance: number = 0.3): ShopItem[] {
    this.shopItems = [];
    const templates = [...ITEM_TEMPLATES];
    
    // 打乱模板顺序
    for (let i = templates.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [templates[i], templates[j]] = [templates[j], templates[i]];
    }

    for (let i = 0; i < Math.min(itemCount, templates.length); i++) {
      const template = templates[i];
      const isDiscounted = this.rng() < discountChance;
      const discount = isDiscounted ? 0.5 : 1.0;

      this.shopItems.push({
        item: { ...template, id: uuidv4() },
        sold: false,
        discount: isDiscounted ? discount : undefined
      });
    }

    return this.getAvailableItems();
  }

  // 获取可购买物品
  getAvailableItems(): ShopItem[] {
    return this.shopItems.filter(s => !s.sold);
  }

  // 购买物品
  buyItem(shopIndex: number, playerGold: number): { success: boolean; item?: Item; goldSpent?: number; error?: string } {
    const available = this.getAvailableItems();
    if (shopIndex < 0 || shopIndex >= available.length) {
      return { success: false, error: '无效商品索引' };
    }

    const shopItem = available[shopIndex];
    const price = shopItem.item.price * (shopItem.discount ?? 1.0);
    const goldCost = Math.ceil(price);

    if (playerGold < goldCost) {
      return { success: false, error: `金币不足，需要${goldCost}，现有${playerGold}` };
    }

    shopItem.sold = true;
    return {
      success: true,
      item: shopItem.item,
      goldSpent: goldCost
    };
  }

  // 获取当前商店状态
  getState(): ShopItem[] {
    return [...this.shopItems];
  }

  // 重置商店
  reset(): void {
    this.shopItems = [];
  }

  // 根据关卡调整商店难度
  static getShopPriceMultiplier(stage: number): number {
    // 后面关卡物价上涨
    return 1.0 + (stage - 1) * 0.1;
  }
}
