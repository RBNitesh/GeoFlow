import { MinHeap } from './MinHeap';
import { QuadTree, Rectangle } from './QuadTree';
import { LRUCache } from './LRUCache';
import { runDijkstra, runEdmondsKarp, runKruskalMST, runBellmanFord } from './algorithms';
import type { GraphData } from './Graph';
import { DSU } from './DSU';

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

export function runDiagnosticsSuite(): TestResult[] {
  const results: TestResult[] = [];

  // ==========================================
  // 1. Min-Heap Verification
  // ==========================================
  try {
    const heap = new MinHeap<string>((s) => s);
    heap.insert('C', 30);
    heap.insert('A', 10);
    heap.insert('B', 20);
    heap.insert('D', 5);

    const order: string[] = [];
    while (!heap.isEmpty()) {
      order.push(heap.extractMin()!);
    }

    const passed = order.join(',') === 'D,A,B,C';
    results.push({
      name: 'Min-Heap Priority Queue',
      passed,
      message: passed 
        ? 'Heap correctly sorted priorities [5, 10, 20, 30] into ascending order [D, A, B, C].'
        : `Heap sort failed. Received order: [${order.join(', ')}]`,
    });
  } catch (err: any) {
    results.push({ name: 'Min-Heap Priority Queue', passed: false, message: err.message });
  }

  // ==========================================
  // 2. QuadTree Nearest-Neighbor Verification
  // ==========================================
  try {
    const boundary = new Rectangle(100, 100, 100, 100);
    const qt = new QuadTree<string>(boundary, 2);
    
    // Insert points
    qt.insert({ x: 10, y: 10, data: 'P1' });
    qt.insert({ x: 80, y: 80, data: 'P2' });
    qt.insert({ x: 90, y: 92, data: 'P3' }); // Closest to target (95, 95)
    qt.insert({ x: 150, y: 150, data: 'P4' });

    // Target query at (95, 95)
    const nearest = qt.findNearest({ x: 95, y: 95 });
    const passed = nearest !== null && nearest.data === 'P3';

    results.push({
      name: 'QuadTree Spatial Snapper',
      passed,
      message: passed
        ? 'QuadTree successfully found nearest spatial coordinate point (P3) in O(log N) depth iterations.'
        : `QuadTree search failed. Snapped to: ${nearest?.data || 'None'}`,
    });
  } catch (err: any) {
    results.push({ name: 'QuadTree Spatial Snapper', passed: false, message: err.message });
  }

  // ==========================================
  // 3. LRU Cache Eviction Verification
  // ==========================================
  try {
    const cache = new LRUCache<string, number>(3);
    cache.put('A', 1);
    cache.put('B', 2);
    cache.put('C', 3);
    
    // Access 'A' to make it Most Recently Used (MRU)
    cache.get('A'); 
    
    // Put 'D' (triggers eviction of least recently used 'B')
    const { evictedKey } = cache.put('D', 4);

    const hasA = cache.get('A') !== null;
    const hasB = cache.get('B') !== null;
    const hasC = cache.get('C') !== null;
    const hasD = cache.get('D') !== null;

    const passed = evictedKey === 'B' && hasA && !hasB && hasC && hasD;

    results.push({
      name: 'LRU Cache Caching & Eviction',
      passed,
      message: passed
        ? 'LRU Cache correctly cached 3 items, shifted active elements, and evicted the oldest unused block (B).'
        : `Eviction test failed. Evicted: ${evictedKey}. Cache contents state invalid.`,
    });
  } catch (err: any) {
    results.push({ name: 'LRU Cache Caching & Eviction', passed: false, message: err.message });
  }

  // ==========================================
  // 4. Dijkstra Correctness Verification
  // ==========================================
  try {
    const mockGraph: GraphData = {
      nodes: [
        { id: 'S', name: 'Start', x: 0, y: 0, type: 'factory' },
        { id: 'A', name: 'Node A', x: 1, y: 0, type: 'hub' },
        { id: 'T', name: 'Target', x: 2, y: 0, type: 'market' },
      ],
      edges: [
        { id: 'E1', source: 'S', target: 'A', distance: 10, speedLimit: 50, traffic: 1.0, capacity: 10 },
        { id: 'E2', source: 'A', target: 'T', distance: 10, speedLimit: 50, traffic: 1.0, capacity: 10 },
        { id: 'E3', source: 'S', target: 'T', distance: 30, speedLimit: 50, traffic: 1.0, capacity: 10 }, // slower direct link
      ],
    };

    const { path, cost } = runDijkstra(mockGraph, 'S', 'T');
    const pathPassed = path.join(',') === 'S,A,T' && cost === 0.4; // 10/50 + 10/50 = 0.4 hours

    results.push({
      name: 'Dijkstra Pathfinding Solver',
      passed: pathPassed,
      message: pathPassed
        ? `Successfully calculated shortest travel time path (Start → A → Target) with optimal cost (${cost.toFixed(2)} hrs).`
        : `Pathfinder failed. Path: [${path.join(' → ')}], Cost: ${cost}`,
    });
  } catch (err: any) {
    results.push({ name: 'Dijkstra Pathfinding Solver', passed: false, message: err.message });
  }

  // ==========================================
  // 5. Edmonds-Karp Max-Flow Verification
  // ==========================================
  try {
    const mockGraph: GraphData = {
      nodes: [
        { id: 'S', name: 'Source', x: 0, y: 0, type: 'factory' },
        { id: 'A', name: 'Node A', x: 1, y: 0, type: 'hub' },
        { id: 'T', name: 'Sink', x: 2, y: 0, type: 'market' },
      ],
      edges: [
        { id: 'E1', source: 'S', target: 'A', distance: 5, speedLimit: 100, traffic: 1.0, capacity: 15 },
        { id: 'E2', source: 'A', target: 'T', distance: 5, speedLimit: 100, traffic: 1.0, capacity: 10 },
      ],
    };

    const { maxFlow } = runEdmondsKarp(mockGraph, 'S', 'T');
    const flowPassed = maxFlow === 10; // Bottleneck is E2 (capacity 10)

    results.push({
      name: 'Edmonds-Karp Max-Flow Solver',
      passed: flowPassed,
      message: flowPassed
        ? 'Max-Flow correctly identified pipeline bottleneck capacity (10 units).'
        : `Flow calculation failed. Expected 10, got: ${maxFlow}`,
    });
  } catch (err: any) {
    results.push({ name: 'Edmonds-Karp Max-Flow Solver', passed: false, message: err.message });
  }

  // ==========================================
  // 6. DSU Verification
  // ==========================================
  try {
    const dsu = new DSU(['A', 'B', 'C']);
    dsu.union('A', 'B');
    const rootA = dsu.find('A');
    const rootB = dsu.find('B');
    const rootC = dsu.find('C');
    
    const passed = rootA === rootB && rootA !== rootC;
    results.push({
      name: 'Disjoint Set Union (DSU)',
      passed,
      message: passed
        ? 'DSU correctly performed union of sets A and B, keeping C isolated.'
        : `DSU test failed. rootA: ${rootA}, rootB: ${rootB}, rootC: ${rootC}`,
    });
  } catch (err: any) {
    results.push({ name: 'Disjoint Set Union (DSU)', passed: false, message: err.message });
  }

  // ==========================================
  // 7. Kruskal's MST Verification
  // ==========================================
  try {
    const mockGraph: GraphData = {
      nodes: [
        { id: '1', name: 'Hub 1', x: 0, y: 0, type: 'hub' },
        { id: '2', name: 'Hub 2', x: 1, y: 0, type: 'hub' },
        { id: '3', name: 'Hub 3', x: 1, y: 1, type: 'hub' },
      ],
      edges: [
        { id: 'E1', source: '1', target: '2', distance: 10, speedLimit: 100, traffic: 1.0, capacity: 10 }, // cost: 0.1h
        { id: 'E2', source: '2', target: '3', distance: 20, speedLimit: 100, traffic: 1.0, capacity: 10 }, // cost: 0.2h
        { id: 'E3', source: '1', target: '3', distance: 40, speedLimit: 100, traffic: 1.0, capacity: 10 }, // cost: 0.4h
      ],
    };

    const { mstEdges, totalCost } = runKruskalMST(mockGraph);
    const mstPassed = mstEdges.length === 2 && mstEdges.some(e => e.id === 'E1') && mstEdges.some(e => e.id === 'E2') && Math.abs(totalCost - 0.3) < 0.0001;

    results.push({
      name: "Kruskal's Minimum Spanning Tree",
      passed: mstPassed,
      message: mstPassed
        ? `MST correctly selected edges [E1, E2] connecting all nodes at minimum cost (${totalCost.toFixed(2)} hrs), avoiding redundant E3.`
        : `Kruskal MST failed. Selected count: ${mstEdges.length}, Cost: ${totalCost}`,
    });
  } catch (err: any) {
    results.push({ name: "Kruskal's Minimum Spanning Tree", passed: false, message: err.message });
  }

  // ==========================================
  // 8. Bellman-Ford & Negative Cycle Verification
  // ==========================================
  try {
    const mockCycleGraph: GraphData = {
      nodes: [
        { id: 'A', name: 'Node A', x: 0, y: 0, type: 'hub' },
        { id: 'B', name: 'Node B', x: 1, y: 0, type: 'hub' },
        { id: 'C', name: 'Node C', x: 1, y: 1, type: 'hub' },
      ],
      edges: [
        { id: 'E1', source: 'A', target: 'B', distance: 10, speedLimit: 100, traffic: 1.0, capacity: 10 }, // weight 0.1
        { id: 'E2', source: 'B', target: 'C', distance: 10, speedLimit: 100, traffic: 1.0, capacity: 10 }, // weight 0.1
        { id: 'E3', source: 'C', target: 'A', distance: -30, speedLimit: 100, traffic: 1.0, capacity: 10 }, // weight -0.3 -> negative cycle!
      ],
    };

    const { hasNegativeCycle, negativeCycleNodes } = runBellmanFord(mockCycleGraph, 'A', 'C');
    const bfPassed = hasNegativeCycle && negativeCycleNodes.length > 0;

    results.push({
      name: 'Bellman-Ford Cycle Detection',
      passed: bfPassed,
      message: bfPassed
        ? `Successfully detected negative weight cycle loop anomaly: ${negativeCycleNodes.join(' → ')}.`
        : 'Bellman-Ford failed to identify the negative weight loop.',
    });
  } catch (err: any) {
    results.push({ name: 'Bellman-Ford Cycle Detection', passed: false, message: err.message });
  }

  return results;
}
