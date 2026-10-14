import { getEdgeWeight, calculateDistance } from './Graph';
import type { GraphEdge, GraphData } from './Graph';
import { MinHeap } from './MinHeap';
import { DSU } from './DSU';

// ==========================================
// Snapshot Types for Visual Replay
// ==========================================

export interface PathfindingSnapshot {
  currentNodeId: string | null;
  frontierNodeIds: { id: string; priority: number }[];
  visitedNodeIds: string[];
  distances: Record<string, number>;
  parents: Record<string, string | null>;
  currentEdgeId: string | null;
  description: string;
}

export interface MaxFlowSnapshot {
  augmentingPath: string[] | null; // Node IDs along the current path
  residualGraph: Record<string, Record<string, { capacity: number; flow: number }>>;
  currentFlow: number;
  description: string;
  bottlenecks: string[]; // Edge IDs
}

export interface TSPSnapshot {
  currentRoute: string[]; // Node IDs in sequence
  totalDistance: number;
  description: string;
  isFinal: boolean;
}

// ==========================================
// Dijkstra's Algorithm
// ==========================================

export function runDijkstra(
  graph: GraphData,
  sourceId: string,
  targetId: string
): { path: string[]; cost: number; snapshots: PathfindingSnapshot[] } {
  const snapshots: PathfindingSnapshot[] = [];
  const distances: Record<string, number> = {};
  const parents: Record<string, string | null> = {};
  const visited: Set<string> = new Set();

  for (const node of graph.nodes) {
    distances[node.id] = Infinity;
    parents[node.id] = null;
  }
  distances[sourceId] = 0;

  const heap = new MinHeap<string>((id) => id);
  heap.insert(sourceId, 0);

  // Add initial state
  snapshots.push({
    currentNodeId: null,
    frontierNodeIds: [{ id: sourceId, priority: 0 }],
    visitedNodeIds: [],
    distances: { ...distances },
    parents: { ...parents },
    currentEdgeId: null,
    description: `Initialized distances. Set starting node ${sourceId} distance to 0.`,
  });

  let found = false;

  while (!heap.isEmpty()) {
    const u = heap.extractMin()!;
    if (visited.has(u)) continue;
    visited.add(u);

    // Snapshot: node pop
    const currentFrontier = getHeapContents(heap);
    snapshots.push({
      currentNodeId: u,
      frontierNodeIds: [...currentFrontier],
      visitedNodeIds: Array.from(visited),
      distances: { ...distances },
      parents: { ...parents },
      currentEdgeId: null,
      description: `Visited ${getNodeName(graph, u)}. It has the smallest tentative distance (${distances[u].toFixed(1)} hrs) in the frontier.`,
    });

    if (u === targetId) {
      found = true;
      break;
    }

    // Get outgoing edges
    const outgoingEdges = graph.edges.filter((e) => e.source === u);

    for (const edge of outgoingEdges) {
      const v = edge.target;
      if (visited.has(v)) continue;

      const weight = getEdgeWeight(edge);
      const newDist = distances[u] + weight;

      // Snapshot: edge evaluation
      snapshots.push({
        currentNodeId: u,
        frontierNodeIds: getHeapContents(heap),
        visitedNodeIds: Array.from(visited),
        distances: { ...distances },
        parents: { ...parents },
        currentEdgeId: edge.id,
        description: `Checking connection from ${getNodeName(graph, u)} to ${getNodeName(graph, v)}. Distance: ${edge.distance} km, Speed: ${edge.speedLimit} km/h, Traffic: ${edge.traffic}x. Segment time: ${weight.toFixed(2)} hrs.`,
      });

      if (newDist < distances[v]) {
        distances[v] = newDist;
        parents[v] = u;
        heap.insert(v, newDist);

        // Snapshot: relaxation
        snapshots.push({
          currentNodeId: u,
          frontierNodeIds: getHeapContents(heap),
          visitedNodeIds: Array.from(visited),
          distances: { ...distances },
          parents: { ...parents },
          currentEdgeId: edge.id,
          description: `Updated distance to ${getNodeName(graph, v)} to ${newDist.toFixed(2)} hrs via ${getNodeName(graph, u)}.`,
        });
      }
    }
  }

  // Backtrack path
  const path: string[] = [];
  if (found || distances[targetId] !== Infinity) {
    let curr: string | null = targetId;
    while (curr !== null) {
      path.unshift(curr);
      curr = parents[curr];
    }
  }

  snapshots.push({
    currentNodeId: null,
    frontierNodeIds: [],
    visitedNodeIds: Array.from(visited),
    distances: { ...distances },
    parents: { ...parents },
    currentEdgeId: null,
    description: found
      ? `Completed Dijkstra. Path found to ${getNodeName(graph, targetId)} with total duration ${distances[targetId].toFixed(2)} hours.`
      : `Dijkstra complete. Target ${getNodeName(graph, targetId)} is unreachable.`,
  });

  return {
    path,
    cost: distances[targetId],
    snapshots,
  };
}

// Helper to get nodes currently in MinHeap
function getHeapContents(heap: any): { id: string; priority: number }[] {
  // Access private heap array for visualization purposes
  const arr = heap.heap as { item: string; priority: number }[];
  return arr.map((n) => ({ id: n.item, priority: n.priority }));
}

function getNodeName(graph: GraphData, id: string): string {
  return graph.nodes.find((n) => n.id === id)?.name || id;
}

// ==========================================
// A* Pathfinding (with Euclidean distance heuristic)
// ==========================================

export function runAStar(
  graph: GraphData,
  sourceId: string,
  targetId: string
): { path: string[]; cost: number; snapshots: PathfindingSnapshot[] } {
  const snapshots: PathfindingSnapshot[] = [];
  const gScore: Record<string, number> = {}; // Cost from start to current node
  const fScore: Record<string, number> = {}; // gScore + heuristic cost to target
  const parents: Record<string, string | null> = {};
  const visited: Set<string> = new Set();

  const targetNode = graph.nodes.find((n) => n.id === targetId)!;
  if (!targetNode) return { path: [], cost: Infinity, snapshots: [] };

  // Heuristic function: estimated travel time based on straight-line distance
  // Assuming average speed of 100 km/h for the heuristic
  const heuristic = (nodeId: string): number => {
    const node = graph.nodes.find((n) => n.id === nodeId)!;
    const distance = calculateDistance(node.x, node.y, targetNode.x, targetNode.y);
    return distance / 100; // estimated hours
  };

  for (const node of graph.nodes) {
    gScore[node.id] = Infinity;
    fScore[node.id] = Infinity;
    parents[node.id] = null;
  }
  gScore[sourceId] = 0;
  fScore[sourceId] = heuristic(sourceId);

  const heap = new MinHeap<string>((id) => id);
  heap.insert(sourceId, fScore[sourceId]);

  snapshots.push({
    currentNodeId: null,
    frontierNodeIds: [{ id: sourceId, priority: fScore[sourceId] }],
    visitedNodeIds: [],
    distances: { ...gScore },
    parents: { ...parents },
    currentEdgeId: null,
    description: `Initialized A*. Heuristic score to target: ${fScore[sourceId].toFixed(2)} hrs.`,
  });

  let found = false;

  while (!heap.isEmpty()) {
    const u = heap.extractMin()!;
    if (visited.has(u)) continue;
    visited.add(u);

    snapshots.push({
      currentNodeId: u,
      frontierNodeIds: getHeapContents(heap),
      visitedNodeIds: Array.from(visited),
      distances: { ...gScore },
      parents: { ...parents },
      currentEdgeId: null,
      description: `Visited ${getNodeName(graph, u)}. Current G-score: ${gScore[u].toFixed(2)} hrs. Est. Total F-score: ${fScore[u].toFixed(2)} hrs.`,
    });

    if (u === targetId) {
      found = true;
      break;
    }

    const outgoingEdges = graph.edges.filter((e) => e.source === u);

    for (const edge of outgoingEdges) {
      const v = edge.target;
      if (visited.has(v)) continue;

      const weight = getEdgeWeight(edge);
      const tentativeGScore = gScore[u] + weight;

      snapshots.push({
        currentNodeId: u,
        frontierNodeIds: getHeapContents(heap),
        visitedNodeIds: Array.from(visited),
        distances: { ...gScore },
        parents: { ...parents },
        currentEdgeId: edge.id,
        description: `Checking connection to ${getNodeName(graph, v)}. Segment cost: ${weight.toFixed(2)} hrs. Tentative route G-score: ${tentativeGScore.toFixed(2)} hrs.`,
      });

      if (tentativeGScore < gScore[v]) {
        parents[v] = u;
        gScore[v] = tentativeGScore;
        const hVal = heuristic(v);
        fScore[v] = gScore[v] + hVal;
        heap.insert(v, fScore[v]);

        snapshots.push({
          currentNodeId: u,
          frontierNodeIds: getHeapContents(heap),
          visitedNodeIds: Array.from(visited),
          distances: { ...gScore },
          parents: { ...parents },
          currentEdgeId: edge.id,
          description: `Updated node ${getNodeName(graph, v)}: G-score = ${gScore[v].toFixed(2)} hrs, Heuristic = ${hVal.toFixed(2)} hrs, F-score = ${fScore[v].toFixed(2)} hrs.`,
        });
      }
    }
  }

  const path: string[] = [];
  if (found || gScore[targetId] !== Infinity) {
    let curr: string | null = targetId;
    while (curr !== null) {
      path.unshift(curr);
      curr = parents[curr];
    }
  }

  snapshots.push({
    currentNodeId: null,
    frontierNodeIds: [],
    visitedNodeIds: Array.from(visited),
    distances: { ...gScore },
    parents: { ...parents },
    currentEdgeId: null,
    description: found
      ? `Completed A* Search. Path found to ${getNodeName(graph, targetId)} with duration ${gScore[targetId].toFixed(2)} hrs. Total nodes expanded: ${visited.size} (compare this with Dijkstra!).`
      : `A* complete. Target is unreachable.`,
  });

  return {
    path,
    cost: gScore[targetId],
    snapshots,
  };
}

// ==========================================
// Yen's K-Shortest Paths Algorithm
// ==========================================

export function runYensKSP(
  graph: GraphData,
  sourceId: string,
  targetId: string,
  k: number = 3
): { paths: string[][]; costs: number[] } {
  // A helper function to clone graph data
  const cloneGraph = (g: GraphData): GraphData => {
    return {
      nodes: g.nodes.map((n) => ({ ...n })),
      edges: g.edges.map((e) => ({ ...e })),
    };
  };

  // Find the first shortest path using Dijkstra
  const firstPathResult = runDijkstra(graph, sourceId, targetId);
  if (firstPathResult.path.length === 0) {
    return { paths: [], costs: [] };
  }

  const A: string[][] = [firstPathResult.path];
  const A_costs: number[] = [firstPathResult.cost];
  
  // Potential candidate paths store
  const B: { path: string[]; cost: number }[] = [];

  for (let i = 1; i < k; i++) {
    const previousPath = A[i - 1];
    
    // Loop through every node in the previous path except the destination
    for (let j = 0; j < previousPath.length - 1; j++) {
      const deviationNode = previousPath[j];
      const rootPath = previousPath.slice(0, j + 1);

      // Create a temporary graph to modify during deviation routing
      const tempGraph = cloneGraph(graph);

      // Remove edges that match the prefix of any previously confirmed paths in A
      for (const path of A) {
        if (path.length > j && path.slice(0, j + 1).join(',') === rootPath.join(',')) {
          // Remove edge path[j] -> path[j+1]
          tempGraph.edges = tempGraph.edges.filter(
            (e) => !(e.source === path[j] && e.target === path[j + 1])
          );
        }
      }

      // Remove nodes in the root path (except the deviation node itself) from the temporary graph
      const nodesToRemove = new Set(rootPath.slice(0, -1));
      tempGraph.nodes = tempGraph.nodes.filter((n) => !nodesToRemove.has(n.id));
      tempGraph.edges = tempGraph.edges.filter(
        (e) => !nodesToRemove.has(e.source) && !nodesToRemove.has(e.target)
      );

      // Calculate the spur path from deviation node to target in the pruned graph
      const spurResult = runDijkstra(tempGraph, deviationNode, targetId);

      if (spurResult.path.length > 0) {
        // Form candidate path
        const candidatePath = [...rootPath.slice(0, -1), ...spurResult.path];
        
        // Calculate candidate path cost using the original graph weights
        let candidateCost = 0;
        let validPath = true;
        for (let idx = 0; idx < candidatePath.length - 1; idx++) {
          const edge = graph.edges.find(
            (e) => e.source === candidatePath[idx] && e.target === candidatePath[idx + 1]
          );
          if (edge) {
            candidateCost += getEdgeWeight(edge);
          } else {
            validPath = false;
            break;
          }
        }

        if (validPath) {
          // Add candidate path to B, ensuring no duplicates
          const exists = B.some((p) => p.path.join(',') === candidatePath.join(','));
          if (!exists) {
            B.push({ path: candidatePath, cost: candidateCost });
          }
        }
      }
    }

    if (B.length === 0) {
      break; // No more alternative paths exist
    }

    // Sort candidates in B by cost and add the shortest candidate to A
    B.sort((a, b) => a.cost - b.cost);
    const bestCandidate = B.shift()!;
    
    A.push(bestCandidate.path);
    A_costs.push(bestCandidate.cost);
  }

  return { paths: A, costs: A_costs };
}

// ==========================================
// Edmonds-Karp Max-Flow Algorithm
// ==========================================

export function runEdmondsKarp(
  graph: GraphData,
  sourceId: string,
  sinkId: string
): { maxFlow: number; edgesWithFlow: GraphEdge[]; snapshots: MaxFlowSnapshot[] } {
  const snapshots: MaxFlowSnapshot[] = [];
  const flowMap: Record<string, number> = {}; // Edge ID -> current flow

  // Initialize flows to 0
  for (const edge of graph.edges) {
    flowMap[edge.id] = 0;
  }

  // Create internal residual mapping
  // We represent it as: residual[u][v] = capacity
  const residual: Record<string, Record<string, number>> = {};
  for (const node of graph.nodes) {
    residual[node.id] = {};
  }

  // Populate residual capacities
  for (const edge of graph.edges) {
    residual[edge.source][edge.target] = edge.capacity;
    residual[edge.target][edge.source] = 0; // Backwards edge
  }

  const getAugmentingPath = (): { path: string[] } | null => {
    const visitedSet = new Set<string>([sourceId]);
    const parents: Record<string, string | null> = {};
    const queue: string[] = [sourceId];

    parents[sourceId] = null;

    let pathFound = false;

    while (queue.length > 0) {
      const u = queue.shift()!;

      if (u === sinkId) {
        pathFound = true;
        break;
      }

      // Explore neighbors in residual graph
      for (const v of Object.keys(residual[u])) {
        const capacity = residual[u][v];
        if (capacity > 0 && !visitedSet.has(v)) {
          visitedSet.add(v);
          parents[v] = u;
          queue.push(v);
        }
      }
    }

    if (!pathFound) return null;

    // Backtrack path
    const path: string[] = [];
    let curr: string | null = sinkId;
    while (curr !== null) {
      path.unshift(curr);
      curr = parents[curr];
    }

    return { path };
  }

  let totalFlow = 0;

  // Snapshot: Initial State
  snapshots.push({
    augmentingPath: null,
    residualGraph: cloneResidual(residual, graph, flowMap),
    currentFlow: 0,
    description: `Initial state. Flow set to 0. Finding augmenting paths in the residual network...`,
    bottlenecks: [],
  });

  while (true) {
    const augResult = getAugmentingPath();
    if (!augResult) break;

    const { path } = augResult;

    // Find bottleneck residual capacity (min capacity in path)
    let bottleneck = Infinity;
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      bottleneck = Math.min(bottleneck, residual[u][v]);
    }

    // Push flow along the path
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];

      // Update residual graph capacities
      residual[u][v] -= bottleneck;
      residual[v][u] += bottleneck;

      // Update actual flows in the original edge map
      const edge = graph.edges.find((e) => e.source === u && e.target === v);
      if (edge) {
        flowMap[edge.id] += bottleneck;
      } else {
        // Reverse edge was used
        const revEdge = graph.edges.find((e) => e.source === v && e.target === u);
        if (revEdge) {
          flowMap[revEdge.id] -= bottleneck;
        }
      }
    }

    totalFlow += bottleneck;

    // Snapshot: Flow increase
    snapshots.push({
      augmentingPath: path,
      residualGraph: cloneResidual(residual, graph, flowMap),
      currentFlow: totalFlow,
      description: `Found augmenting path: ${path.map((id) => getNodeName(graph, id)).join(' → ')}. Pushed bottleneck capacity of ${bottleneck} units. Total flow is now ${totalFlow}.`,
      bottlenecks: [],
    });
  }

  // Calculate Min-Cut bottlenecks
  // Run BFS on final residual graph to find all nodes reachable from source
  const reachable = new Set<string>([sourceId]);
  const queue = [sourceId];
  while (queue.length > 0) {
    const u = queue.shift()!;
    for (const v of Object.keys(residual[u])) {
      if (residual[u][v] > 0 && !reachable.has(v)) {
        reachable.add(v);
        queue.push(v);
      }
    }
  }

  // Edges that go from reachable nodes to non-reachable nodes in the original graph
  // are the Min-Cut (bottleneck) edges
  const bottlenecks: string[] = [];
  for (const edge of graph.edges) {
    if (reachable.has(edge.source) && !reachable.has(edge.target)) {
      bottlenecks.push(edge.id);
    }
  }

  snapshots.push({
    augmentingPath: null,
    residualGraph: cloneResidual(residual, graph, flowMap),
    currentFlow: totalFlow,
    description: `Edmonds-Karp complete. Maximum flow rate is ${totalFlow} units. Bottleneck edges (Min-Cut) highlighted in red.`,
    bottlenecks,
  });

  // Return the edges with updated flow fields
  const edgesWithFlow = graph.edges.map((edge) => ({
    ...edge,
    flow: flowMap[edge.id],
  }));

  return {
    maxFlow: totalFlow,
    edgesWithFlow,
    snapshots,
  };
}

function cloneResidual(
  residual: Record<string, Record<string, number>>,
  graph: GraphData,
  flowMap: Record<string, number>
): Record<string, Record<string, { capacity: number; flow: number }>> {
  const result: Record<string, Record<string, { capacity: number; flow: number }>> = {};
  for (const node of graph.nodes) {
    result[node.id] = {};
  }
  for (const u of Object.keys(residual)) {
    for (const v of Object.keys(residual[u])) {
      // Find original capacity
      const edge = graph.edges.find((e) => e.source === u && e.target === v);
      const cap = edge ? edge.capacity : 0;
      const flow = edge ? flowMap[edge.id] : 0;
      result[u][v] = { capacity: cap, flow };
    }
  }
  return result;
}

// ==========================================
// Traveling Salesperson (TSP) - 2-Opt Algorithm
// ==========================================

export function runTSPSolver(
  graph: GraphData,
  depotId: string
): { tour: string[]; distance: number; snapshots: TSPSnapshot[] } {
  const snapshots: TSPSnapshot[] = [];
  
  // Filter nodes involved in the TSP.
  // The TSP preset only has C_* nodes. Let's make it general.
  // We collect the depot first, and then all other nodes in the graph.
  const routeNodes = graph.nodes.map(n => n.id);
  if (routeNodes.length < 2) {
    return { tour: routeNodes, distance: 0, snapshots: [] };
  }

  // Ensure depot is at index 0
  const otherNodes = routeNodes.filter((id) => id !== depotId);
  let route = [depotId, ...otherNodes, depotId];

  const getRouteDistance = (r: string[]): number => {
    let dist = 0;
    for (let i = 0; i < r.length - 1; i++) {
      const u = r[i];
      const v = r[i + 1];
      const nodeU = graph.nodes.find((n) => n.id === u)!;
      const nodeV = graph.nodes.find((n) => n.id === v)!;
      dist += calculateDistance(nodeU.x, nodeU.y, nodeV.x, nodeV.y);
    }
    return dist;
  };

  let bestDist = getRouteDistance(route);
  snapshots.push({
    currentRoute: [...route],
    totalDistance: bestDist,
    description: `Initialized route greedily based on node listing order. Total tour length: ${bestDist.toFixed(1)} km.`,
    isFinal: false,
  });

  let improved = true;
  let iterations = 0;
  const maxIterations = 100;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    // Try all possible 2-opt swaps.
    // A route is: depot (0) -> node(1) -> ... -> node(n) -> depot (n+1)
    // We can swap sub-segments between indices i and j.
    // We do not swap index 0 (depot start) or index n+1 (depot end).
    for (let i = 1; i < route.length - 2; i++) {
      for (let j = i + 1; j < route.length - 1; j++) {
        // Perform 2-opt swap: reverse the segment from index i to j
        const newRoute = [
          ...route.slice(0, i),
          ...route.slice(i, j + 1).reverse(),
          ...route.slice(j + 1),
        ];

        const newDist = getRouteDistance(newRoute);
        if (newDist < bestDist) {
          route = newRoute;
          bestDist = newDist;
          improved = true;

          snapshots.push({
            currentRoute: [...route],
            totalDistance: bestDist,
            description: `Improved path by reversing segment from ${getNodeName(graph, route[i])} to ${getNodeName(graph, route[j])}. Dist reduced to ${bestDist.toFixed(1)} km.`,
            isFinal: false,
          });
          break;
        }
      }
      if (improved) break;
    }
  }

  snapshots.push({
    currentRoute: [...route],
    totalDistance: bestDist,
    description: `Optimized TSP tour found. Travel route completes the cycle back to depot in ${bestDist.toFixed(1)} km.`,
    isFinal: true,
  });

  return {
    tour: route,
    distance: bestDist,
    snapshots,
  };
}

// ==========================================
// Kruskal's Minimum Spanning Tree (MST)
// ==========================================

export function runKruskalMST(
  graph: GraphData
): { mstEdges: GraphEdge[]; totalCost: number; snapshots: PathfindingSnapshot[] } {
  const snapshots: PathfindingSnapshot[] = [];
  const mstEdges: GraphEdge[] = [];
  let totalCost = 0;

  // Initialize DSU
  const dsu = new DSU(graph.nodes.map((n) => n.id));

  // Sort edges by weight
  const sortedEdges = [...graph.edges].sort((a, b) => getEdgeWeight(a) - getEdgeWeight(b));

  const initialDistances: Record<string, number> = {};
  const initialParents: Record<string, string | null> = {};
  for (const node of graph.nodes) {
    initialDistances[node.id] = Infinity;
    initialParents[node.id] = null;
  }

  snapshots.push({
    currentNodeId: null,
    frontierNodeIds: [],
    visitedNodeIds: [],
    distances: initialDistances,
    parents: initialParents,
    currentEdgeId: null,
    description: `Starting Kruskal's MST. Sorted all ${graph.edges.length} edges. Initialized Union-Find sets for all nodes.`,
  });

  const visitedNodes: Set<string> = new Set();

  for (const edge of sortedEdges) {
    const weight = getEdgeWeight(edge);
    const u = edge.source;
    const v = edge.target;

    // Snapshot: considering edge
    snapshots.push({
      currentNodeId: null,
      frontierNodeIds: [],
      visitedNodeIds: Array.from(visitedNodes),
      distances: initialDistances,
      parents: initialParents,
      currentEdgeId: edge.id,
      description: `Evaluating connection: ${getNodeName(graph, u)} ⟷ ${getNodeName(graph, v)} (Cost: ${weight.toFixed(2)} hrs).`,
    });

    const rootU = dsu.find(u);
    const rootV = dsu.find(v);

    if (rootU !== rootV) {
      dsu.union(u, v);
      mstEdges.push(edge);
      totalCost += weight;
      visitedNodes.add(u);
      visitedNodes.add(v);

      snapshots.push({
        currentNodeId: null,
        frontierNodeIds: [],
        visitedNodeIds: Array.from(visitedNodes),
        distances: initialDistances,
        parents: initialParents,
        currentEdgeId: edge.id,
        description: `Added link ${getNodeName(graph, u)} ⟷ ${getNodeName(graph, v)} to MST. They belong to different components. DSU sets merged.`,
      });
    } else {
      snapshots.push({
        currentNodeId: null,
        frontierNodeIds: [],
        visitedNodeIds: Array.from(visitedNodes),
        distances: initialDistances,
        parents: initialParents,
        currentEdgeId: edge.id,
        description: `Discarded link ${getNodeName(graph, u)} ⟷ ${getNodeName(graph, v)}. Both belong to same component (root: ${rootU}). Merging would create a cycle.`,
      });
    }
  }

  snapshots.push({
    currentNodeId: null,
    frontierNodeIds: [],
    visitedNodeIds: Array.from(visitedNodes),
    distances: initialDistances,
    parents: initialParents,
    currentEdgeId: null,
    description: `Kruskal's MST complete. Connected all hubs using ${mstEdges.length} links. Total network MST weight/cost: ${totalCost.toFixed(2)} hrs.`,
  });

  return { mstEdges, totalCost, snapshots };
}

// ==========================================
// Bellman-Ford Shortest Path with Negative Cycle Detection
// ==========================================

export function runBellmanFord(
  graph: GraphData,
  sourceId: string,
  targetId: string
): {
  path: string[];
  cost: number;
  snapshots: PathfindingSnapshot[];
  hasNegativeCycle: boolean;
  negativeCycleNodes: string[];
} {
  const snapshots: PathfindingSnapshot[] = [];
  const distances: Record<string, number> = {};
  const parents: Record<string, string | null> = {};
  const V = graph.nodes.length;

  for (const node of graph.nodes) {
    distances[node.id] = Infinity;
    parents[node.id] = null;
  }
  distances[sourceId] = 0;

  snapshots.push({
    currentNodeId: null,
    frontierNodeIds: [],
    visitedNodeIds: [],
    distances: { ...distances },
    parents: { ...parents },
    currentEdgeId: null,
    description: `Initialized Bellman-Ford. Set start node ${sourceId} distance to 0. Relaxation cycles: ${V - 1}.`,
  });

  let anyUpdate = false;

  // Relax edges V - 1 times
  for (let i = 1; i <= V - 1; i++) {
    anyUpdate = false;
    
    for (const edge of graph.edges) {
      const weight = getEdgeWeight(edge);
      const u = edge.source;
      const v = edge.target;

      if (distances[u] !== Infinity && distances[u] + weight < distances[v]) {
        distances[v] = distances[u] + weight;
        parents[v] = u;
        anyUpdate = true;

        snapshots.push({
          currentNodeId: v,
          frontierNodeIds: [],
          visitedNodeIds: [u],
          distances: { ...distances },
          parents: { ...parents },
          currentEdgeId: edge.id,
          description: `Cycle ${i}: Relaxed edge ${getNodeName(graph, u)} → ${getNodeName(graph, v)}. Updated distance to ${distances[v].toFixed(2)} hrs.`,
        });
      }
    }

    if (!anyUpdate) {
      snapshots.push({
        currentNodeId: null,
        frontierNodeIds: [],
        visitedNodeIds: [],
        distances: { ...distances },
        parents: { ...parents },
        currentEdgeId: null,
        description: `Cycle ${i}: Distances stabilized early. No further updates.`,
      });
      break;
    }
  }

  // Check for negative-weight cycles
  let hasNegativeCycle = false;
  let negativeCycleNodes: string[] = [];

  for (const edge of graph.edges) {
    const weight = getEdgeWeight(edge);
    const u = edge.source;
    const v = edge.target;

    if (distances[u] !== Infinity && distances[u] + weight < distances[v]) {
      hasNegativeCycle = true;

      // Backtrack V times to find a node in the negative cycle
      let curr = v;
      for (let i = 0; i < V; i++) {
        if (parents[curr]) {
          curr = parents[curr]!;
        }
      }

      // Collect cycle nodes
      const cycle: string[] = [];
      const startNode = curr;
      cycle.push(startNode);
      curr = parents[startNode]!;
      while (curr !== startNode && cycle.length < V + 2) {
        cycle.push(curr);
        curr = parents[curr]!;
      }
      cycle.push(startNode);
      negativeCycleNodes = cycle.reverse();

      snapshots.push({
        currentNodeId: null,
        frontierNodeIds: [],
        visitedNodeIds: [...negativeCycleNodes],
        distances: { ...distances },
        parents: { ...parents },
        currentEdgeId: edge.id,
        description: `💥 NEGATIVE CYCLE FOUND! Edge ${getNodeName(graph, u)} → ${getNodeName(graph, v)} can be relaxed infinitely. Cycle loop: ${negativeCycleNodes.map(id => getNodeName(graph, id)).join(' → ')}.`,
      });
      break;
    }
  }

  // Backtrack path
  const path: string[] = [];
  if (!hasNegativeCycle && distances[targetId] !== Infinity) {
    let curr: string | null = targetId;
    while (curr !== null) {
      path.unshift(curr);
      curr = parents[curr];
    }

    snapshots.push({
      currentNodeId: null,
      frontierNodeIds: [],
      visitedNodeIds: [],
      distances: { ...distances },
      parents: { ...parents },
      currentEdgeId: null,
      description: `Bellman-Ford completed. Optimal travel path duration is ${distances[targetId].toFixed(2)} hrs.`,
    });
  } else if (!hasNegativeCycle) {
    snapshots.push({
      currentNodeId: null,
      frontierNodeIds: [],
      visitedNodeIds: [],
      distances: { ...distances },
      parents: { ...parents },
      currentEdgeId: null,
      description: `Bellman-Ford completed. Target is unreachable.`,
    });
  }

  return {
    path,
    cost: distances[targetId],
    snapshots,
    hasNegativeCycle,
    negativeCycleNodes,
  };
}
