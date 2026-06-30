export interface HeapNode<T> {
  item: T;
  priority: number;
}

export class MinHeap<T> {
  private heap: HeapNode<T>[] = [];
  // Maps item string keys to their indices in the heap array for O(1) position lookup
  private positionMap: Map<string, number> = new Map();
  private getKey: (item: T) => string;

  constructor(getKey: (item: T) => string) {
    this.getKey = getKey;
  }

  public size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public insert(item: T, priority: number): void {
    const key = this.getKey(item);
    if (this.positionMap.has(key)) {
      this.decreasePriority(item, priority);
      return;
    }

    const node: HeapNode<T> = { item, priority };
    this.heap.push(node);
    const index = this.heap.length - 1;
    this.positionMap.set(key, index);
    this.bubbleUp(index);
  }

  public extractMin(): T | null {
    if (this.isEmpty()) return null;

    const minNode = this.heap[0];
    const lastNode = this.heap.pop()!;
    
    this.positionMap.delete(this.getKey(minNode.item));

    if (this.heap.length > 0) {
      this.heap[0] = lastNode;
      this.positionMap.set(this.getKey(lastNode.item), 0);
      this.bubbleDown(0);
    }

    return minNode.item;
  }

  public decreasePriority(item: T, newPriority: number): void {
    const key = this.getKey(item);
    const index = this.positionMap.get(key);
    if (index === undefined) {
      // If it doesn't exist, insert it
      this.insert(item, newPriority);
      return;
    }

    const node = this.heap[index];
    if (newPriority >= node.priority) {
      return; // Can only decrease priority
    }

    node.priority = newPriority;
    this.bubbleUp(index);
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[index].priority >= this.heap[parentIndex].priority) {
        break;
      }
      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      let smallest = index;
      const leftIndex = 2 * index + 1;
      const rightIndex = 2 * index + 2;

      if (leftIndex < length && this.heap[leftIndex].priority < this.heap[smallest].priority) {
        smallest = leftIndex;
      }

      if (rightIndex < length && this.heap[rightIndex].priority < this.heap[smallest].priority) {
        smallest = rightIndex;
      }

      if (smallest === index) {
        break;
      }

      this.swap(index, smallest);
      index = smallest;
    }
  }

  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;

    this.positionMap.set(this.getKey(this.heap[i].item), i);
    this.positionMap.set(this.getKey(this.heap[j].item), j);
  }
}
