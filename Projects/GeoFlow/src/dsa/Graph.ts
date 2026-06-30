export type NodeType = 'factory' | 'hub' | 'market';

export interface GraphNode {
  id: string;
  name: string;
  x: number; // 2D grid coordinates
  y: number;
  type: NodeType;
}

export interface GraphEdge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  distance: number; // Distance in km or pixels
  speedLimit: number; // speed limit in km/h
  traffic: number; // traffic multiplier (1.0 = clear, 2.5 = heavy, 5.0 = gridlock)
  capacity: number; // capacity units for Max-Flow (e.g., cubic meters/sec or cargo loads)
  flow?: number; // current flow during Edmonds-Karp execution
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Computes the travel cost (travel time in hours) for an edge.
 * Cost = (Distance / SpeedLimit) * TrafficMultiplier
 */
export function getEdgeWeight(edge: GraphEdge): number {
  return (edge.distance / edge.speedLimit) * edge.traffic;
}

// Generates a unique ID
export function generateUUID(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Calculates Euclidean distance between two coordinate positions
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// Preset Scenarios
export const PRESETS: Record<string, { name: string; description: string; data: GraphData }> = {
  logistics: {
    name: 'Logistics Pathfinding Preset',
    description: 'A map of shipping routes with high traffic routes. Use Dijkstra, A*, and Yen\'s K-Shortest Paths to find congestion bypasses.',
    data: {
      nodes: [
        { id: 'N1', name: 'Seattle Factory', x: 100, y: 150, type: 'factory' },
        { id: 'N2', name: 'Portland Hub', x: 100, y: 350, type: 'hub' },
        { id: 'N3', name: 'Boise Transit', x: 300, y: 250, type: 'hub' },
        { id: 'N4', name: 'Salt Lake Depot', x: 450, y: 450, type: 'hub' },
        { id: 'N5', name: 'Denver Terminal', x: 650, y: 350, type: 'hub' },
        { id: 'N6', name: 'Chicago Market', x: 850, y: 200, type: 'market' },
        { id: 'N7', name: 'Minneapolis Hub', x: 600, y: 100, type: 'hub' },
        { id: 'N8', name: 'Helena Waypoint', x: 380, y: 120, type: 'hub' },
      ],
      edges: [
        // Primary path: Seattle -> Portland -> Boise -> Salt Lake -> Denver -> Chicago
        { id: 'E1', source: 'N1', target: 'N2', distance: 280, speedLimit: 100, traffic: 1.0, capacity: 50 },
        { id: 'E2', source: 'N2', target: 'N3', distance: 550, speedLimit: 110, traffic: 2.5, capacity: 40 }, // High traffic link
        { id: 'E3', source: 'N3', target: 'N4', distance: 530, speedLimit: 110, traffic: 1.0, capacity: 40 },
        { id: 'E4', source: 'N4', target: 'N5', distance: 600, speedLimit: 120, traffic: 3.5, capacity: 60 }, // High traffic link
        { id: 'E5', source: 'N5', target: 'N6', distance: 1000, speedLimit: 120, traffic: 1.2, capacity: 80 },

        // Bypass paths: Northern Route (Seattle -> Helena -> Minneapolis -> Chicago)
        { id: 'E6', source: 'N1', target: 'N8', distance: 600, speedLimit: 100, traffic: 1.0, capacity: 30 },
        { id: 'E7', source: 'N8', target: 'N7', distance: 750, speedLimit: 110, traffic: 1.0, capacity: 30 },
        { id: 'E8', source: 'N7', target: 'N6', distance: 650, speedLimit: 100, traffic: 1.0, capacity: 50 },

        // Cross-connections
        { id: 'E9', source: 'N3', target: 'N8', distance: 350, speedLimit: 90, traffic: 1.0, capacity: 20 },
        { id: 'E10', source: 'N7', target: 'N5', distance: 800, speedLimit: 110, traffic: 1.0, capacity: 35 },
        { id: 'E11', source: 'N2', target: 'N4', distance: 900, speedLimit: 115, traffic: 1.5, capacity: 30 },
      ],
    },
  },
  supplyChainFlow: {
    name: 'Supply Chain Max-Flow Preset',
    description: 'Factory sources shipping cargo to Consumer Markets. Use Edmonds-Karp to determine the maximum logistics capacity and pinpoint the bottleneck (Min-Cut) links.',
    data: {
      nodes: [
        { id: 'S1', name: 'Factory Source A', x: 80, y: 150, type: 'factory' },
        { id: 'S2', name: 'Factory Source B', x: 80, y: 350, type: 'factory' },
        { id: 'H1', name: 'Transit Node C', x: 300, y: 120, type: 'hub' },
        { id: 'H2', name: 'Transit Node D', x: 300, y: 380, type: 'hub' },
        { id: 'H3', name: 'Distribution Center E', x: 550, y: 250, type: 'hub' },
        { id: 'M1', name: 'Consumer Market X', x: 850, y: 180, type: 'market' },
        { id: 'M2', name: 'Consumer Market Y', x: 850, y: 320, type: 'market' },
      ],
      edges: [
        // From sources to intermediate transits
        { id: 'SF1', source: 'S1', target: 'H1', distance: 250, speedLimit: 100, traffic: 1.0, capacity: 40 }, // Cap 40
        { id: 'SF2', source: 'S1', target: 'H2', distance: 300, speedLimit: 100, traffic: 1.0, capacity: 20 }, // Cap 20
        { id: 'SF3', source: 'S2', target: 'H2', distance: 250, speedLimit: 100, traffic: 1.0, capacity: 30 }, // Cap 30

        // Transits to center/cross
        { id: 'SF4', source: 'H1', target: 'H3', distance: 280, speedLimit: 90, traffic: 1.0, capacity: 30 },  // Cap 30
        { id: 'SF5', source: 'H2', target: 'H3', distance: 280, speedLimit: 90, traffic: 1.0, capacity: 25 },  // Cap 25
        { id: 'SF6', source: 'H1', target: 'H2', distance: 150, speedLimit: 70, traffic: 1.0, capacity: 10 },  // Cap 10 (crossover)

        // Center/Transits to consumer markets
        { id: 'SF7', source: 'H3', target: 'M1', distance: 320, speedLimit: 100, traffic: 1.0, capacity: 20 }, // Cap 20 (potential bottleneck)
        { id: 'SF8', source: 'H3', target: 'M2', distance: 320, speedLimit: 100, traffic: 1.0, capacity: 30 }, // Cap 30
        { id: 'SF9', source: 'H1', target: 'M1', distance: 580, speedLimit: 110, traffic: 1.0, capacity: 15 }, // Cap 15
        { id: 'SF10', source: 'H2', target: 'M2', distance: 580, speedLimit: 110, traffic: 1.0, capacity: 15 }, // Cap 15
      ],
    },
  },
  courierTSP: {
    name: 'Courier TSP Optimization Preset',
    description: 'A delivery vehicle starting at the Boise Hub (factory depot) must deliver packages to 6 nearby residential markets. Run the 2-Opt TSP algorithm to optimize the sequence.',
    data: {
      nodes: [
        { id: 'C_DEPOT', name: 'Boise Courier Depot', x: 480, y: 240, type: 'factory' },
        { id: 'C_STOP1', name: 'Stop 1: North End', x: 500, y: 80, type: 'market' },
        { id: 'C_STOP2', name: 'Stop 2: East End', x: 700, y: 150, type: 'market' },
        { id: 'C_STOP3', name: 'Stop 3: South Southeast', x: 620, y: 420, type: 'market' },
        { id: 'C_STOP4', name: 'Stop 4: Southwest', x: 300, y: 400, type: 'market' },
        { id: 'C_STOP5', name: 'Stop 5: West Bench', x: 220, y: 210, type: 'market' },
        { id: 'C_STOP6', name: 'Stop 6: Northwest Foothills', x: 340, y: 110, type: 'market' },
      ],
      edges: [
        // Complete graph is computed dynamically by the TSP solver,
        // but let's pre-load some default links for visualization
        { id: 'TE1', source: 'C_DEPOT', target: 'C_STOP1', distance: 160, speedLimit: 50, traffic: 1.0, capacity: 10 },
        { id: 'TE2', source: 'C_DEPOT', target: 'C_STOP5', distance: 260, speedLimit: 50, traffic: 1.0, capacity: 10 },
        { id: 'TE3', source: 'C_STOP1', target: 'C_STOP2', distance: 210, speedLimit: 50, traffic: 1.0, capacity: 10 },
        { id: 'TE4', source: 'C_STOP2', target: 'C_STOP3', distance: 280, speedLimit: 50, traffic: 1.0, capacity: 10 },
        { id: 'TE5', source: 'C_STOP3', target: 'C_STOP4', distance: 320, speedLimit: 50, traffic: 1.0, capacity: 10 },
        { id: 'TE6', source: 'C_STOP4', target: 'C_STOP5', distance: 200, speedLimit: 50, traffic: 1.0, capacity: 10 },
        { id: 'TE7', source: 'C_STOP5', target: 'C_STOP6', distance: 160, speedLimit: 50, traffic: 1.0, capacity: 10 },
        { id: 'TE8', source: 'C_STOP6', target: 'C_STOP1', distance: 160, speedLimit: 50, traffic: 1.0, capacity: 10 },
      ],
    },
  },
};
