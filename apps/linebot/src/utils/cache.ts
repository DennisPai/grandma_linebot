/**
 * 簡單的記憶體快取系統
 */

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

class Cache {
  private store: Map<string, CacheEntry<any>>;

  constructor() {
    this.store = new Map();
  }

  /**
   * 設定快取
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, { value, expiry });
  }

  /**
   * 取得快取
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * 刪除快取
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * 清空所有快取
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * 取得或設定（如果不存在則執行函數並快取結果）
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const value = await fn();
    this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * 清理過期的快取（定期執行）
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiry) {
        this.store.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`🧹 Cleaned up ${removed} expired cache entries`);
    }

    return removed;
  }
}

export const cache = new Cache();

// 每 5 分鐘清理一次過期快取
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);
