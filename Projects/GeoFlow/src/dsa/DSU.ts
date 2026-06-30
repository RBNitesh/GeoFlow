export class DSU {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();

  constructor(elements: string[] = []) {
    for (const elem of elements) {
      this.makeSet(elem);
    }
  }

  public makeSet(i: string): void {
    if (!this.parent.has(i)) {
      this.parent.set(i, i);
      this.rank.set(i, 0);
    }
  }

  public find(i: string): string {
    const p = this.parent.get(i);
    if (p === undefined) {
      this.makeSet(i);
      return i;
    }

    if (p === i) {
      return i;
    }

    // Path compression
    const root = this.find(p);
    this.parent.set(i, root);
    return root;
  }

  public union(i: string, j: string): boolean {
    const rootI = this.find(i);
    const rootJ = this.find(j);

    if (rootI === rootJ) {
      return false; // Already in the same set (would create a cycle)
    }

    const rankI = this.rank.get(rootI) || 0;
    const rankJ = this.rank.get(rootJ) || 0;

    // Union by rank
    if (rankI < rankJ) {
      this.parent.set(rootI, rootJ);
    } else if (rankI > rankJ) {
      this.parent.set(rootJ, rootI);
    } else {
      this.parent.set(rootJ, rootI);
      this.rank.set(rootI, rankI + 1);
    }

    return true;
  }
}
