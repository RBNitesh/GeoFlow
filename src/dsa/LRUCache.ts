class LRUNode<K, V> {
  public key: K;
  public value: V;
  public prev: LRUNode<K, V> | null = null;
  public next: LRUNode<K, V> | null = null;

  constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
  }
}

export class LRUCache<K, V> {
  private capacity: number;
  private map: Map<K, LRUNode<K, V>> = new Map();
  private head: LRUNode<K, V> | null = null; // Most Recently Used (MRU)
  private tail: LRUNode<K, V> | null = null; // Least Recently Used (LRU)
  
  // Track statistics for visual debugging
  public hits: number = 0;
  public misses: number = 0;

  constructor(capacity: number = 5) {
    this.capacity = capacity;
  }

  public get(key: K): V | null {
    const node = this.map.get(key);
    if (!node) {
      this.misses++;
      return null;
    }
    
    this.hits++;
    // Move node to the head (MRU position)
    this.moveToHead(node);
    return node.value;
  }

  public put(key: K, value: V): { evictedKey: K | null } {
    let evictedKey: K | null = null;
    const existingNode = this.map.get(key);

    if (existingNode) {
      // Update value and move to head
      existingNode.value = value;
      this.moveToHead(existingNode);
    } else {
      const newNode = new LRUNode(key, value);
      this.map.set(key, newNode);
      this.addToHead(newNode);

      if (this.map.size > this.capacity) {
        // Evict LRU element
        const lruNode = this.tail;
        if (lruNode) {
          evictedKey = lruNode.key;
          this.removeNode(lruNode);
          this.map.delete(lruNode.key);
        }
      }
    }
    return { evictedKey };
  }

  public clear(): void {
    this.map.clear();
    this.head = null;
    this.tail = null;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Returns items in order from MRU (head) to LRU (tail) for visual rendering
   */
  public getQueue(): { key: K; value: V }[] {
    const queue: { key: K; value: V }[] = [];
    let current = this.head;
    while (current) {
      queue.push({ key: current.key, value: current.value });
      current = current.next;
    }
    return queue;
  }

  private addToHead(node: LRUNode<K, V>): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: LRUNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next; // Node was head
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev; // Node was tail
    }
  }

  private moveToHead(node: LRUNode<K, V>): void {
    if (node === this.head) return;
    this.removeNode(node);
    this.addToHead(node);
  }
}
