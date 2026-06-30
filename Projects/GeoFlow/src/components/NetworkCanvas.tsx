import React, { useRef, useEffect, useState } from 'react';
import { calculateDistance } from '../dsa/Graph';
import type { GraphData, GraphNode, GraphEdge, NodeType } from '../dsa/Graph';
import { QuadTree, Rectangle } from '../dsa/QuadTree';

interface NetworkCanvasProps {
  graph: GraphData;
  setGraph: React.Dispatch<React.SetStateAction<GraphData>>;
  sourceNodeId: string;
  setSourceNodeId: (id: string) => void;
  targetNodeId: string;
  setTargetNodeId: (id: string) => void;
  
  // Algorithmic overlay states
  activePath: string[]; // Node IDs in sequence
  alternativePaths?: string[][]; // Yen's alternate paths
  currentNodeId: string | null;
  frontierNodeIds: string[];
  visitedNodeIds: string[];
  currentEdgeId: string | null;
  bottlenecks?: string[]; // Edge IDs
  maxFlowEdges?: GraphEdge[]; // Edges with flow populated
  mode: 'select' | 'addNode' | 'addEdge' | 'delete';
  nodeTypeToAdd: NodeType;
  selectedEdgeId: string | null;
  setSelectedEdgeId: (id: string | null) => void;
  mstEdgeIds?: string[];
  negativeCycleNodes?: string[];
}

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  graph,
  setGraph,
  sourceNodeId,
  setSourceNodeId,
  targetNodeId,
  setTargetNodeId,
  activePath,
  alternativePaths = [],
  currentNodeId,
  frontierNodeIds,
  visitedNodeIds,
  currentEdgeId,
  bottlenecks = [],
  maxFlowEdges = [],
  mode,
  nodeTypeToAdd,
  selectedEdgeId,
  setSelectedEdgeId,
  mstEdgeIds = [],
  negativeCycleNodes = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Selection / Interaction States
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [draggedNode, setDraggedNode] = useState<GraphNode | null>(null);
  const [edgeStartNode, setEdgeStartNode] = useState<GraphNode | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [quadTree, setQuadTree] = useState<QuadTree<GraphNode> | null>(null);

  // Particle systems for path flows
  const [particles, setParticles] = useState<{ edgeId: string; progress: number; speed: number; color: string }[]>([]);

  // Re-build QuadTree whenever graph nodes change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Bounds for QuadTree matching the canvas size
    const width = canvas.width;
    const height = canvas.height;
    const boundary = new Rectangle(width / 2, height / 2, width / 2, height / 2);
    const qt = new QuadTree<GraphNode>(boundary, 4);
    
    for (const node of graph.nodes) {
      qt.insert({ x: node.x, y: node.y, data: node });
    }
    setQuadTree(qt);
  }, [graph.nodes]);

  // Particle flow update ticker
  useEffect(() => {
    let animId: number;
    
    const updateParticles = () => {
      setParticles((prev) => {
        // Create new particles along active edges
        let newParticles = [...prev];
        
        // Find which edges are active
        const activeEdges: { id: string; speed: number; color: string }[] = [];
        
        // 1. Primary path edges (green)
        if (activePath.length > 1) {
          for (let i = 0; i < activePath.length - 1; i++) {
            const edge = graph.edges.find(
              (e) => e.source === activePath[i] && e.target === activePath[i + 1]
            );
            if (edge) {
              activeEdges.push({ id: edge.id, speed: 0.01 + (edge.speedLimit / 20000) / Math.abs(edge.traffic), color: '#39ff14' });
            }
          }
        }

        // 2. Alternative paths (cyan)
        alternativePaths.forEach((path) => {
          if (path.length > 1) {
            for (let i = 0; i < path.length - 1; i++) {
              const edge = graph.edges.find(
                (e) => e.source === path[i] && e.target === path[i + 1]
              );
              if (edge) {
                // Ensure we don't duplicate primary path particles
                if (!activeEdges.some((ae) => ae.id === edge.id)) {
                  activeEdges.push({ id: edge.id, speed: 0.01 + (edge.speedLimit / 20000) / Math.abs(edge.traffic), color: '#00f6ff' });
                }
              }
            }
          }
        });

        // 3. Flow capacity edges (yellow-ish depending on flow)
        maxFlowEdges.forEach((edge) => {
          if (edge.flow && edge.flow > 0) {
            const speedMultiplier = edge.flow / edge.capacity;
            activeEdges.push({
              id: edge.id,
              speed: 0.005 + (0.015 * speedMultiplier),
              color: `rgba(255, 230, 0, ${0.4 + 0.6 * speedMultiplier})`
            });
          }
        });

        // Update existing particles progress
        newParticles = newParticles
          .map((p) => ({ ...p, progress: p.progress + p.speed }))
          .filter((p) => p.progress < 1);

        // Periodically inject new particles into active edges
        activeEdges.forEach((edge) => {
          if (Math.random() < 0.05) {
            // Check current density for this edge to avoid overload
            const count = newParticles.filter((p) => p.edgeId === edge.id).length;
            if (count < 5) {
              newParticles.push({
                edgeId: edge.id,
                progress: 0,
                speed: edge.speed,
                color: edge.color,
              });
            }
          }
        });

        return newParticles;
      });

      animId = requestAnimationFrame(updateParticles);
    };

    animId = requestAnimationFrame(updateParticles);
    return () => cancelAnimationFrame(animId);
  }, [activePath, alternativePaths, maxFlowEdges, graph.edges]);

  // Main Canvas Render Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Canvas
    ctx.fillStyle = '#0f172a'; // Deep slate dark blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid Lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const gridSize = 40;
    
    // Vertical grid
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    // Horizontal grid
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // DRAW EDGES (Roads)
    graph.edges.forEach((edge) => {
      const source = graph.nodes.find((n) => n.id === edge.source);
      const target = graph.nodes.find((n) => n.id === edge.target);
      if (!source || !target) return;

      // Determine colors & stroke styles
      let strokeColor = '#334155'; // Default dark grey
      let lineWidth = 2;
      let isGlow = false;

      const isCurrentSearchEdge = currentEdgeId === edge.id;
      const isBottleneck = bottlenecks.includes(edge.id);
      const isSelectedEdge = selectedEdgeId === edge.id;
      const inMST = mstEdgeIds.includes(edge.id);
      
      // Flow overlay
      const flowEdge = maxFlowEdges.find((fe) => fe.id === edge.id);
      const flowPercentage = flowEdge && flowEdge.flow ? flowEdge.flow / flowEdge.capacity : 0;

      if (isCurrentSearchEdge) {
        strokeColor = '#eab308'; // Pulsing Yellow
        lineWidth = 4;
        isGlow = true;
      } else if (isBottleneck) {
        strokeColor = '#ef4444'; // Red Bottleneck
        lineWidth = 5;
        isGlow = true;
      } else if (isSelectedEdge) {
        strokeColor = '#38bdf8'; // Glowing Selected Edge
        lineWidth = 4.5;
        isGlow = true;
      } else if (inMST) {
        strokeColor = '#f59e0b'; // Golden MST
        lineWidth = 4.5;
        isGlow = true;
      } else if (flowEdge && flowEdge.flow && flowEdge.flow > 0) {
        // Linear interpolation from blue-grey to golden-orange
        strokeColor = `rgba(234, 179, 8, ${0.4 + 0.6 * flowPercentage})`;
        lineWidth = 3 + 4 * flowPercentage;
      } else {
        // Path overlay check
        const inPrimaryPath = isEdgeInPath(edge.source, edge.target, activePath);
        const inAlternative = alternativePaths.some((ap) => isEdgeInPath(edge.source, edge.target, ap));

        if (inPrimaryPath) {
          strokeColor = '#22c55e'; // Green path
          lineWidth = 5;
          isGlow = true;
        } else if (inAlternative) {
          strokeColor = '#06b6d4'; // Cyan path
          lineWidth = 3.5;
          isGlow = true;
        }
      }

      // Draw shadow glow if required
      if (isGlow) {
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowBlur = 0;
      }

      // Draw Main Line
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();

      // Clear shadows for annotations
      ctx.shadowBlur = 0;

      // Draw directional arrow in the center of the link
      drawArrow(ctx, source.x, source.y, target.x, target.y, strokeColor, lineWidth);

      // Label edges with Speed, Traffic, or Flow
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      
      if (flowEdge && flowEdge.flow !== undefined) {
        // Display Flow / Capacity
        ctx.fillStyle = flowEdge.flow === flowEdge.capacity ? '#ef4444' : '#fbbf24';
        ctx.fillText(`${flowEdge.flow}/${flowEdge.capacity} u`, midX, midY - 6);
      } else {
        // Display distance / travel time
        const travelTime = (edge.distance / edge.speedLimit) * edge.traffic;
        let label = `${edge.distance}km`;
        if (edge.traffic > 1.0) {
          label += ` (🚦${edge.traffic}x)`;
        } else if (edge.traffic < 0) {
          label += ` (⚡ EV Lane)`;
        }
        ctx.fillText(label, midX, midY - 6);
        ctx.fillStyle = travelTime < 0 ? '#10b981' : '#64748b';
        ctx.fillText(travelTime < 0 ? `${travelTime.toFixed(2)}h (🔋)` : `${travelTime.toFixed(2)}h`, midX, midY + 8);
      }
    });

    // DRAW EDGE-DRAWING PREVIEW
    if (mode === 'addEdge' && edgeStartNode) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(edgeStartNode.x, edgeStartNode.y);
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // DRAW PARTICLES
    particles.forEach((p) => {
      const edge = graph.edges.find((e) => e.id === p.edgeId);
      if (!edge) return;
      const source = graph.nodes.find((n) => n.id === edge.source);
      const target = graph.nodes.find((n) => n.id === edge.target);
      if (!source || !target) return;

      const px = source.x + (target.x - source.x) * p.progress;
      const py = source.y + (target.y - source.y) * p.progress;

      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // DRAW NODES (Hubs/Depots)
    graph.nodes.forEach((node) => {
      const isSource = node.id === sourceNodeId;
      const isTarget = node.id === targetNodeId;
      const isCurrent = node.id === currentNodeId;
      const isFrontier = frontierNodeIds.includes(node.id);
      const isVisited = visitedNodeIds.includes(node.id);
      const isHovered = hoveredNode?.id === node.id;

      // Visual attributes based on roles
      let baseColor = '#06b6d4'; // default Hub: cyan
      let nodeRadius = 14;
      let strokeColor = '#38bdf8';
      let strokeWidth = 2;

      if (node.type === 'factory') {
        baseColor = '#f97316'; // Factory: Orange
        strokeColor = '#fdba74';
      } else if (node.type === 'market') {
        baseColor = '#a855f7'; // Market: Purple
        strokeColor = '#d8b4fe';
      }

      // Modify visual parameters based on active visualizer states
      if (isCurrent) {
        nodeRadius = 18;
        strokeColor = '#eab308'; // Pulsing Yellow
        strokeWidth = 4;
        
        // Glow effect
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 12;
      } else if (isFrontier) {
        strokeColor = '#f59e0b'; // frontier: amber dashed border
        strokeWidth = 3;
      } else if (isVisited) {
        strokeColor = '#10b981'; // visited: green border
        strokeWidth = 2.5;
      }

      if (isSource) {
        strokeColor = '#22c55e'; // Source highlighted green
        strokeWidth = 4;
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 10;
      } else if (isTarget) {
        strokeColor = '#ef4444'; // Target highlighted red
        strokeWidth = 4;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
      }

      const inNegativeCycle = negativeCycleNodes.includes(node.id);
      if (inNegativeCycle) {
        strokeColor = '#f43f5e'; // Flashing hot-pink cycle node
        strokeWidth = 4.5;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12;
      }

      if (isHovered) {
        nodeRadius += 3;
      }

      // Draw Node Outer Ring / Highlights
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      
      if (isFrontier) {
        ctx.setLineDash([4, 3]);
      }
      ctx.beginPath();
      
      // Shapes based on node type
      if (node.type === 'factory') {
        // Draw Square
        ctx.rect(node.x - nodeRadius, node.y - nodeRadius, nodeRadius * 2, nodeRadius * 2);
      } else if (node.type === 'market') {
        // Draw Diamond
        ctx.moveTo(node.x, node.y - nodeRadius - 2);
        ctx.lineTo(node.x + nodeRadius + 2, node.y);
        ctx.lineTo(node.x, node.y + nodeRadius + 2);
        ctx.lineTo(node.x - nodeRadius - 2, node.y);
        ctx.closePath();
      } else {
        // Draw Circle
        ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Draw Node Core
      ctx.fillStyle = isCurrent ? '#fef08a' : baseColor;
      ctx.beginPath();
      if (node.type === 'factory') {
        ctx.rect(node.x - nodeRadius + 3, node.y - nodeRadius + 3, (nodeRadius - 3) * 2, (nodeRadius - 3) * 2);
      } else if (node.type === 'market') {
        ctx.moveTo(node.x, node.y - nodeRadius + 2);
        ctx.lineTo(node.x + nodeRadius - 2, node.y);
        ctx.lineTo(node.x, node.y + nodeRadius - 2);
        ctx.lineTo(node.x - nodeRadius + 2, node.y);
        ctx.closePath();
      } else {
        ctx.arc(node.x, node.y, nodeRadius - 2, 0, Math.PI * 2);
      }
      ctx.fill();

      // Node Label Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.x, node.y - nodeRadius - 8);

      // Sub-label for specific statuses
      if (isSource) {
        ctx.fillStyle = '#22c55e';
        ctx.font = '8px monospace';
        ctx.fillText('START', node.x, node.y + nodeRadius + 11);
      } else if (isTarget) {
        ctx.fillStyle = '#ef4444';
        ctx.font = '8px monospace';
        ctx.fillText('TARGET', node.x, node.y + nodeRadius + 11);
      } else if (node.id === 'C_DEPOT' && graph.nodes.length > 5 && graph.nodes[0].id.startsWith('C_')) {
        ctx.fillStyle = '#eab308';
        ctx.font = '8px monospace';
        ctx.fillText('DEPOT', node.x, node.y + nodeRadius + 11);
      }
    });
  }, [graph, sourceNodeId, targetNodeId, currentNodeId, frontierNodeIds, visitedNodeIds, currentEdgeId, bottlenecks, maxFlowEdges, activePath, alternativePaths, hoveredNode, edgeStartNode, mousePos, mode, particles]);

  // Helper function to check if an edge is in the route path
  const isEdgeInPath = (u: string, v: string, path: string[]): boolean => {
    for (let i = 0; i < path.length - 1; i++) {
      if (path[i] === u && path[i + 1] === v) return true;
    }
    return false;
  };

  // Draws directed arrows in center of edges
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    width: number
  ) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    // Position arrow slightly past center of line
    const midX = x1 + (x2 - x1) * 0.53;
    const midY = y1 + (y2 - y1) * 0.53;

    const arrowLength = Math.max(8, width + 4);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(
      midX - arrowLength * Math.cos(angle - Math.PI / 6),
      midY - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      midX - arrowLength * Math.cos(angle + Math.PI / 6),
      midY - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  // MOUSE EVENT HANDLERS
  
  const getMouseCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // Scale matching the internal coordinates resolution
    return {
      x: Math.round(((e.clientX - rect.left) / rect.width) * canvas.width),
      y: Math.round(((e.clientY - rect.top) / rect.height) * canvas.height),
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getMouseCoords(e);
    setMousePos(coords);

    if (draggedNode) {
      // Update dragged node position
      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === draggedNode.id ? { ...n, x: coords.x, y: coords.y } : n)),
      }));
      return;
    }

    // Snapping query in QuadTree (within 25px range)
    if (quadTree) {
      const nearest = quadTree.findNearest(coords);
      if (nearest) {
        const dist = calculateDistance(coords.x, coords.y, nearest.x, nearest.y);
        if (dist < 25) {
          setHoveredNode(nearest.data);
          return;
        }
      }
    }
    setHoveredNode(null);
  };

  const findEdgeAtCoords = (mx: number, my: number): GraphEdge | null => {
    const threshold = 8;
    for (const edge of graph.edges) {
      const source = graph.nodes.find((n) => n.id === edge.source);
      const target = graph.nodes.find((n) => n.id === edge.target);
      if (!source || !target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;

      let t = ((mx - source.x) * dx + (my - source.y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));

      const projX = source.x + t * dx;
      const projY = source.y + t * dy;

      const dist = calculateDistance(mx, my, projX, projY);
      if (dist < threshold) {
        return edge;
      }
    }
    return null;
  };

  const handleMouseDown = () => {

    if (mode === 'select' || mode === 'addEdge' || mode === 'delete') {
      if (hoveredNode) {
        if (mode === 'select') {
          // Select for dragging or primary action
          setDraggedNode(hoveredNode);
          setSelectedEdgeId(null); // Deselect edge when node is clicked
        } else if (mode === 'addEdge') {
          // Begin drawing line
          setEdgeStartNode(hoveredNode);
        } else if (mode === 'delete') {
          // Delete node and its edges
          setGraph((prev) => {
            const nodes = prev.nodes.filter((n) => n.id !== hoveredNode.id);
            const edges = prev.edges.filter(
              (edge) => edge.source !== hoveredNode.id && edge.target !== hoveredNode.id
            );
            return { nodes, edges };
          });
          if (sourceNodeId === hoveredNode.id) setSourceNodeId('');
          if (targetNodeId === hoveredNode.id) setTargetNodeId('');
          setHoveredNode(null);
        }
      } else {
        // Did not click a node. Check if we clicked an edge!
        if (mode === 'select') {
          const clickedEdge = findEdgeAtCoords(mousePos.x, mousePos.y);
          if (clickedEdge) {
            setSelectedEdgeId(clickedEdge.id);
          } else {
            setSelectedEdgeId(null);
          }
        }
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getMouseCoords(e);

    if (draggedNode) {
      setDraggedNode(null);
      return;
    }

    if (mode === 'addNode' && !hoveredNode) {
      // Add a node at the clicked position
      const name = `${nodeTypeToAdd.charAt(0).toUpperCase() + nodeTypeToAdd.slice(1)} ${graph.nodes.length + 1}`;
      const newNode: GraphNode = {
        id: `N_${Date.now()}`,
        name,
        x: coords.x,
        y: coords.y,
        type: nodeTypeToAdd,
      };

      setGraph((prev) => ({
        ...prev,
        nodes: [...prev.nodes, newNode],
      }));
    }

    if (mode === 'addEdge' && edgeStartNode) {
      // Draw new edge if hovered over a destination node
      if (hoveredNode && hoveredNode.id !== edgeStartNode.id) {
        // Check if edge already exists
        const exists = graph.edges.some(
          (edge) => edge.source === edgeStartNode.id && edge.target === hoveredNode.id
        );

        if (!exists) {
          const dist = Math.round(calculateDistance(edgeStartNode.x, edgeStartNode.y, hoveredNode.x, hoveredNode.y));
          const newEdge: GraphEdge = {
            id: `E_${Date.now()}`,
            source: edgeStartNode.id,
            target: hoveredNode.id,
            distance: dist,
            speedLimit: 90,
            traffic: 1.0,
            capacity: 30,
          };

          setGraph((prev) => ({
            ...prev,
            edges: [...prev.edges, newEdge],
          }));
        }
      }
      setEdgeStartNode(null);
    }
  };

  return (
    <div className="canvas-container" style={{ position: 'relative', width: '100%', height: '520px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1e293b' }}>
      <canvas
        ref={canvasRef}
        width={900}
        height={520}
        style={{ display: 'block', width: '100%', height: '100%', cursor: hoveredNode ? 'pointer' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
      {/* Canvas Tool Indicator */}
      <div className="canvas-toolbar-overlay" style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: '6px', border: '1px solid #334155', pointerEvents: 'none', color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace' }}>
        {mode === 'select' && '🖱️ Select & Drag Hubs'}
        {mode === 'addNode' && `➕ Click Grid to Add ${nodeTypeToAdd.toUpperCase()}`}
        {mode === 'addEdge' && '🔗 Drag from Node to Node to Connect'}
        {mode === 'delete' && '🗑️ Click Hub to Delete'}
      </div>
    </div>
  );
};
