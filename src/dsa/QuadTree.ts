export interface Point<T = any> {
  x: number;
  y: number;
  data: T;
}

export class Rectangle {
  x: number; // Center X
  y: number; // Center Y
  w: number; // Half-width (radius)
  h: number; // Half-height (radius)

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  public contains(point: { x: number; y: number }): boolean {
    return (
      point.x >= this.x - this.w &&
      point.x <= this.x + this.w &&
      point.y >= this.y - this.h &&
      point.y <= this.y + this.h
    );
  }

  public intersects(range: Rectangle): boolean {
    return !(
      range.x - range.w > this.x + this.w ||
      range.x + range.w < this.x - this.w ||
      range.y - range.h > this.y + this.h ||
      range.y + range.h < this.y - this.h
    );
  }
}

export class QuadTree<T = any> {
  private boundary: Rectangle;
  private capacity: number;
  private points: Point<T>[] = [];
  private divided: boolean = false;

  private nw?: QuadTree<T>;
  private ne?: QuadTree<T>;
  private sw?: QuadTree<T>;
  private se?: QuadTree<T>;

  constructor(boundary: Rectangle, capacity: number = 4) {
    this.boundary = boundary;
    this.capacity = capacity;
  }

  private subdivide(): void {
    const x = this.boundary.x;
    const y = this.boundary.y;
    const w = this.boundary.w / 2;
    const h = this.boundary.h / 2;

    this.nw = new QuadTree<T>(new Rectangle(x - w, y - h, w, h), this.capacity);
    this.ne = new QuadTree<T>(new Rectangle(x + w, y - h, w, h), this.capacity);
    this.sw = new QuadTree<T>(new Rectangle(x - w, y + h, w, h), this.capacity);
    this.se = new QuadTree<T>(new Rectangle(x + w, y + h, w, h), this.capacity);

    this.divided = true;

    // Distribute current points to children
    for (const p of this.points) {
      this.insertToChildren(p);
    }
    this.points = [];
  }

  private insertToChildren(point: Point<T>): boolean {
    if (this.nw!.insert(point)) return true;
    if (this.ne!.insert(point)) return true;
    if (this.sw!.insert(point)) return true;
    if (this.se!.insert(point)) return true;
    return false;
  }

  public insert(point: Point<T>): boolean {
    if (!this.boundary.contains(point)) {
      return false;
    }

    if (!this.divided) {
      if (this.points.length < this.capacity) {
        this.points.push(point);
        return true;
      }
      this.subdivide();
    }

    return this.insertToChildren(point);
  }

  public query(range: Rectangle, found: Point<T>[] = []): Point<T>[] {
    if (!this.boundary.intersects(range)) {
      return found;
    }

    if (this.divided) {
      this.nw!.query(range, found);
      this.ne!.query(range, found);
      this.sw!.query(range, found);
      this.se!.query(range, found);
    } else {
      for (const p of this.points) {
        if (range.contains(p)) {
          found.push(p);
        }
      }
    }

    return found;
  }

  /**
   * Performs a nearest neighbor search.
   * Finds the point in the QuadTree closest to the target coordinates.
   */
  public findNearest(
    target: { x: number; y: number },
    best: { point: Point<T> | null; distSq: number } = { point: null, distSq: Infinity }
  ): Point<T> | null {
    // If the boundary is further away from target than our current best distance, prune this branch
    if (!this.boundaryContainsOrIsWithinRange(target, Math.sqrt(best.distSq))) {
      return best.point;
    }

    if (this.divided) {
      // Order sub-quadrants by proximity to target to prune faster
      const children = [
        { qt: this.nw!, dist: this.getDistSqToCenter(this.nw!.boundary, target) },
        { qt: this.ne!, dist: this.getDistSqToCenter(this.ne!.boundary, target) },
        { qt: this.sw!, dist: this.getDistSqToCenter(this.sw!.boundary, target) },
        { qt: this.se!, dist: this.getDistSqToCenter(this.se!.boundary, target) },
      ].sort((a, b) => a.dist - b.dist);

      for (const child of children) {
        child.qt.findNearest(target, best);
      }
    } else {
      for (const p of this.points) {
        const dx = p.x - target.x;
        const dy = p.y - target.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < best.distSq) {
          best.distSq = dSq;
          best.point = p;
        }
      }
    }

    return best.point;
  }

  private getDistSqToCenter(rect: Rectangle, target: { x: number; y: number }): number {
    const dx = rect.x - target.x;
    const dy = rect.y - target.y;
    return dx * dx + dy * dy;
  }

  private boundaryContainsOrIsWithinRange(target: { x: number; y: number }, radius: number): boolean {
    if (this.boundary.contains(target)) return true;

    // Closest point on the boundary rectangle to the target
    const closestX = Math.max(this.boundary.x - this.boundary.w, Math.min(target.x, this.boundary.x + this.boundary.w));
    const closestY = Math.max(this.boundary.y - this.boundary.h, Math.min(target.y, this.boundary.y + this.boundary.h));

    const dx = closestX - target.x;
    const dy = closestY - target.y;
    return dx * dx + dy * dy <= radius * radius;
  }
}
