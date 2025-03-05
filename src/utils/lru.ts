import XXH from "xxhashjs";
const seed = 0xabcd;

export type EvictionCallback<K, V> = (key: K, value: V) => void;

interface Node<K, V> {
  key: K;
  value: V;
  prev: Node<K, V> | null;
  next: Node<K, V> | null;
}

export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, Node<K, V>>;
  private head: Node<K, V> | null;
  private tail: Node<K, V> | null;
  private onEvict?: EvictionCallback<K, V>;

  constructor(capacity: number, onEvict?: EvictionCallback<K, V>) {
    this.capacity = capacity;
    this.cache = new Map<K, Node<K, V>>();
    this.head = null;
    this.tail = null;
    if (onEvict) this.onEvict = onEvict;
  }

  get(key: K): V | undefined {
    const node = this.cache.get(key);
    if (!node) return undefined;
    this.moveToHead(node);
    return node.value;
  }

  put(key: K, value: V): void {
    let node = this.cache.get(key);
    if (node) {
      node.value = value;
      this.moveToHead(node);
    } else {
      node = { key, value, prev: null, next: null };
      this.cache.set(key, node);
      this.addNodeToHead(node);

      if (this.cache.size > this.capacity) {
        this.evictTail();
      }
    }
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
  }

  getCacheItems(): Array<{ key: K; value: V }> {
    const items: Array<{ key: K; value: V }> = [];
    let current = this.head;
    while (current) {
      items.push({ key: current.key, value: current.value });
      current = current.next;
    }
    return items;
  }

  get size(): number {
    return this.cache.size;
  }

  private addNodeToHead(node: Node<K, V>): void {
    node.prev = null;
    node.next = this.head;
    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;
    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: Node<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
    node.prev = null;
    node.next = null;
  }

  private moveToHead(node: Node<K, V>): void {
    if (node === this.head) return;
    this.removeNode(node);
    this.addNodeToHead(node);
  }

  private evictTail(): void {
    if (!this.tail) return;
    const nodeToEvict = this.tail;
    this.removeNode(nodeToEvict);
    this.cache.delete(nodeToEvict.key);
    if (this.onEvict) {
      this.onEvict(nodeToEvict.key, nodeToEvict.value);
    }
  }
}

export function simpleHash256(str: string): string {
  const hash = XXH.h32(str, seed);
  return hash.toString(16);
}
export const formatCache = new LRUCache<string, string>(128);
export const formatNumCache = new LRUCache<number, string>(256);
export const effectiveLinesCache = new LRUCache<string, number>(256);
export const splitHtmlCache = new LRUCache<string, string[]>(256);
