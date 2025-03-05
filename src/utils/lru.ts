export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private limit: number;

  constructor(limit: number) {
    this.cache = new Map();
    this.limit = limit;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    const value = this.cache.get(key)!;

    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    if (this.cache.size >= this.limit) {
      const lruKey = this.cache.keys().next().value!;
      this.cache.delete(lruKey);
    }
    this.cache.set(key, value);
  }

  getCacheItems(): Array<{ key: K; value: V }> {
    const items: Array<{ key: K; value: V }> = [];
    for (const [key, value] of this.cache.entries()) {
      items.push({ key, value });
    }
    return items;
  }
}

export function simpleHash256(str: string) {
  const hashes = new Uint32Array(8).fill(0xdeadbeef);
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    hashes[i % 8] = (hashes[i % 8]! << 5) - hashes[i % 8]! + charCode;
    hashes[i % 8]! |= 0;
  }
  return Array.from(hashes, (h) => h.toString(16).padStart(8, "0")).join("");
}

export const formatCache = new LRUCache(128);
export const formatNumCache = new LRUCache(256);
export const effectiveLinesCache = new LRUCache(256);
export const splitHtmlCache = new LRUCache(256);
