import XXH from "xxhashjs";
const seed = 0x9e3779b9;

export type EvictionCallback<K, V> = (key: K, value: V) => void;

export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;
  private keys: Set<K>;
  private onEvict?: EvictionCallback<K, V>;

  constructor(capacity: number, onEvict?: EvictionCallback<K, V>) {
    this.capacity = capacity;
    this.cache = new Map<K, V>();
    this.keys = new Set<K>();
    if (onEvict) this.onEvict = onEvict;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    this.keys.delete(key);
    this.keys.add(key);
    return this.cache.get(key);
  }

  put(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.set(key, value);
      this.get(key);
      return;
    }

    if (this.cache.size >= this.capacity) {
      this.evict();
    }

    this.cache.set(key, value);
    this.keys.add(key);
  }

  has(key: K): boolean {
    return this.keys.has(key);
  }

  clear(): void {
    this.cache.clear();
    this.keys.clear();
  }

  getCacheItems(): Array<{ key: K; value: V }> {
    return Array.from(this.keys).map((key) => ({
      key,
      value: this.cache.get(key) as V
    }));
  }

  get size(): number {
    return this.cache.size;
  }

  private evict(): void {
    const oldestKey = this.keys.values().next().value;
    if (oldestKey !== undefined) {
      this.keys.delete(oldestKey);
      const value = this.cache.get(oldestKey);
      this.cache.delete(oldestKey);
      if (this.onEvict && value !== undefined) {
        this.onEvict(oldestKey, value);
      }
    }
  }
}

export class ARCCache<K, V> {
  private capacity: number;
  private p: number = 0;
  private T1: Map<K, V>;
  private T2: Map<K, V>;
  private B1: Set<K>;
  private B2: Set<K>;
  private onEvict?: EvictionCallback<K, V>;

  constructor(capacity: number, onEvict?: EvictionCallback<K, V>) {
    this.capacity = capacity;
    this.T1 = new Map<K, V>();
    this.T2 = new Map<K, V>();
    this.B1 = new Set<K>();
    this.B2 = new Set<K>();
    if (onEvict) {
      this.onEvict = onEvict;
    }
  }

  get(key: K): V | undefined {
    if (this.T1.has(key)) {
      const value = this.T1.get(key) as V;
      this.T1.delete(key);
      this.T2.set(key, value);
      return value;
    }
    if (this.T2.has(key)) {
      const value = this.T2.get(key) as V;
      this.T2.delete(key);
      this.T2.set(key, value);
      return value;
    }
    return undefined;
  }

  put(key: K, value: V): void {
    if (this.T1.has(key) || this.T2.has(key)) {
      if (this.T1.has(key)) {
        this.T1.delete(key);
      }
      if (this.T2.has(key)) {
        this.T2.delete(key);
      }
      this.T2.set(key, value);
      return;
    }

    if (this.B1.has(key)) {
      this.p = Math.min(this.capacity, this.p + Math.max(this.B2.size / this.B1.size, 1));
      this.replace(key);
      this.B1.delete(key);
      this.T2.set(key, value);
      return;
    }

    if (this.B2.has(key)) {
      this.p = Math.max(0, this.p - Math.max(this.B1.size / this.B2.size, 1));
      this.replace(key);
      this.B2.delete(key);
      this.T2.set(key, value);
      return;
    }

    if (this.T1.size + this.B1.size === this.capacity) {
      if (this.T1.size < this.capacity) {
        const oldestB1 = this.getFirstFromSet(this.B1);
        if (oldestB1 !== undefined) {
          this.B1.delete(oldestB1);
        }
        this.replace(key);
      } else {
        const oldestT1 = this.getFirstFromMap(this.T1);
        if (oldestT1 !== undefined) {
          const evictedValue = this.T1.get(oldestT1) as V;
          this.T1.delete(oldestT1);
          if (this.onEvict) {
            this.onEvict(oldestT1, evictedValue);
          }
        }
      }
    } else if (this.T1.size + this.T2.size + this.B1.size + this.B2.size >= this.capacity) {
      if (this.T1.size + this.T2.size + this.B1.size + this.B2.size >= 2 * this.capacity) {
        const oldestB2 = this.getFirstFromSet(this.B2);
        if (oldestB2 !== undefined) {
          this.B2.delete(oldestB2);
        }
      }
      this.replace(key);
    }
    this.T1.set(key, value);
  }

  private replace(key: K): void {
    if (this.T1.size > 0 && (this.T1.size > this.p || (this.B2.has(key) && this.T1.size === this.p))) {
      const oldestT1 = this.getFirstFromMap(this.T1);
      if (oldestT1 !== undefined) {
        const val = this.T1.get(oldestT1) as V;
        this.T1.delete(oldestT1);
        this.B1.add(oldestT1);
        if (this.onEvict) {
          this.onEvict(oldestT1, val);
        }
      }
    } else {
      const oldestT2 = this.getFirstFromMap(this.T2);
      if (oldestT2 !== undefined) {
        const val = this.T2.get(oldestT2) as V;
        this.T2.delete(oldestT2);
        this.B2.add(oldestT2);
        if (this.onEvict) {
          this.onEvict(oldestT2, val);
        }
      }
    }
  }

  private getFirstFromMap(map: Map<K, V>): K | undefined {
    return map.keys().next().value;
  }

  private getFirstFromSet(set: Set<K>): K | undefined {
    return set.values().next().value;
  }

  clear(): void {
    this.T1.clear();
    this.T2.clear();
    this.B1.clear();
    this.B2.clear();
  }

  get size(): number {
    return this.T1.size + this.T2.size;
  }

  has(key: K): boolean {
    return this.T1.has(key) || this.T2.has(key);
  }
}

export const simpleHash256 = (str: string) => XXH.h32(str, seed).toNumber();

export const formatCache = new ARCCache<number, string>(256);
export const formatNumCache = new ARCCache<number, string>(512);
export const effectiveLinesCache = new ARCCache<number, number>(256);
export const splitHtmlCache = new ARCCache<number, string[]>(256);
