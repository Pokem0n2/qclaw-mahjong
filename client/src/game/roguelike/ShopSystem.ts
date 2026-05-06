// ===== 商店系统 =====

import { Item, ShopItem } from './types';
import { ITEM_TEMPLATES } from './BuffSystem';

let shopIdCounter = 0;

export class ShopSystem {
  private shopItems: ShopItem[] = [];
  private rng: () => number;

  constructor(rng?: () => number) {
    this.rng = rng ?? Math.random;
  }

  generateShop(itemCount: number = 4): ShopItem[] {
    this.shopItems = [];
    const templates = [...ITEM_TEMPLATES];
    
    for (let i = templates.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [templates[i], templates[j]] = [templates[j], templates[i]];
    }

    for (let i = 0; i < Math.min(itemCount, templates.length); i++) {
      const template = templates[i];
      const isDiscounted = this.rng() < 0.3;

      this.shopItems.push({
        item: { ...template, id: `item_${++shopIdCounter}_${Date.now()}` },
        sold: false,
        discount: isDiscounted ? 0.5 : undefined
      });
    }

    return this.getAvailableItems();
  }

  getAvailableItems(): ShopItem[] {
    return this.shopItems.filter(s => !s.sold);
  }

  buyItem(shopIndex: number, playerGold: number): { success: boolean; item?: Item; goldSpent?: number; error?: string } {
    const available = this.getAvailableItems();
    if (shopIndex < 0 || shopIndex >= available.length) {
      return { success: false, error: '无效商品索引' };
    }

    const shopItem = available[shopIndex];
    const price = shopItem.item.price * (shopItem.discount ?? 1.0);
    const goldCost = Math.ceil(price);

    if (playerGold < goldCost) {
      return { success: false, error: `金币不足` };
    }

    shopItem.sold = true;
    return { success: true, item: shopItem.item, goldSpent: goldCost };
  }

  reset(): void {
    this.shopItems = [];
  }
}
