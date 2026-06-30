import React from 'react';
import { PRESETS } from '../dsa/Graph';
import type { GraphData, NodeType } from '../dsa/Graph';

interface SidebarProps {
  graph: GraphData;
  setGraph: React.Dispatch<React.SetStateAction<GraphData>>;
  activePreset: string;
  setActivePreset: (presetKey: string) => void;
  selectedAlgorithm: string;
  setSelectedAlgorithm: (algo: string) => void;
  sourceNodeId: string;
  setSourceNodeId: (id: string) => void;
  targetNodeId: string;
  setTargetNodeId: (id: string) => void;
  kValue: number;
  setKValue: (k: number) => void;
  
  // Canvas editing modes
  canvasMode: 'select' | 'addNode' | 'addEdge' | 'delete';
  setCanvasMode: (mode: 'select' | 'addNode' | 'addEdge' | 'delete') => void;
  nodeTypeToAdd: NodeType;
  setNodeTypeToAdd: (type: NodeType) => void;

  // Run controls
  activePath: string[];
  onRunInstantly: () => void;
  onStartStepByStep: () => void;
  isPlaying: boolean;
  isStepMode: boolean;
  onReset: () => void;

  // New props for expanded features
  onSaveGraph: () => void;
  onLoadGraph: () => void;
  onClearGraph: () => void;
  selectedEdgeId: string | null;
  setSelectedEdgeId: (id: string | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  graph,
  setGraph,
  activePreset,
  setActivePreset,
  selectedAlgorithm,
  setSelectedAlgorithm,
  sourceNodeId,
  setSourceNodeId,
  targetNodeId,
  setTargetNodeId,
  kValue,
  setKValue,
  canvasMode,
  setCanvasMode,
  nodeTypeToAdd,
  setNodeTypeToAdd,
  activePath,
  onRunInstantly,
  onStartStepByStep,
  isPlaying,
  isStepMode,
  onReset,
  onSaveGraph,
  onLoadGraph,
  onClearGraph,
  selectedEdgeId,
  setSelectedEdgeId,
}) => {
  // Find selected edge
  const selectedEdge = selectedEdgeId ? graph.edges.find((e) => e.id === selectedEdgeId) : null;
  return (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px', border: '1px solid #334155', backdropFilter: 'blur(12px)', height: '100%', boxSizing: 'border-box' }}>
      
      {/* Preset Scenarios */}
      <div className="sidebar-section">
        <h3 style={{ margin: '0 0 10px 0', color: '#f8fafc', fontSize: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>1. Preset Scenario</h3>
        <select
          value={activePreset}
          onChange={(e) => setActivePreset(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', border: '1px solid #475569', color: '#f1f5f9', cursor: 'pointer', outline: 'none' }}
        >
          {Object.keys(PRESETS).map((key) => (
            <option key={key} value={key}>
              {PRESETS[key].name}
            </option>
          ))}
          <option value="custom">Custom Canvas (Empty)</option>
        </select>
        <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
          {activePreset !== 'custom' ? PRESETS[activePreset].description : 'Start with a clean canvas. Add your own factory hubs, delivery nodes, and pathways.'}
        </p>

        {/* Save/Load Persistence panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px' }}>
          <button
            onClick={onSaveGraph}
            style={{ padding: '6px 8px', borderRadius: '4px', background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
            title="Save layout to browser LocalStorage"
          >
            💾 Save Layout
          </button>
          <button
            onClick={onLoadGraph}
            style={{ padding: '6px 8px', borderRadius: '4px', background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
            title="Restore saved layout from LocalStorage"
          >
            📂 Load Layout
          </button>
        </div>
        <button
          onClick={onClearGraph}
          style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold', marginTop: '6px' }}
        >
          🧹 Clear Canvas
        </button>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '0' }} />

      {/* Editor Mouse Mode */}
      <div className="sidebar-section">
        <h3 style={{ margin: '0 0 10px 0', color: '#f8fafc', fontSize: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>2. Map Editor Tools</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
          <button
            onClick={() => setCanvasMode('select')}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: canvasMode === 'select' ? '#38bdf8' : '#0f172a',
              color: canvasMode === 'select' ? '#0f172a' : '#f1f5f9',
              fontWeight: canvasMode === 'select' ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s',
            }}
          >
            🖱️ Move / Drag
          </button>
          
          <button
            onClick={() => setCanvasMode('addEdge')}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: canvasMode === 'addEdge' ? '#38bdf8' : '#0f172a',
              color: canvasMode === 'addEdge' ? '#0f172a' : '#f1f5f9',
              fontWeight: canvasMode === 'addEdge' ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s',
            }}
          >
            🔗 Connect Roads
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={() => setCanvasMode('addNode')}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: canvasMode === 'addNode' ? '#38bdf8' : '#0f172a',
              color: canvasMode === 'addNode' ? '#0f172a' : '#f1f5f9',
              fontWeight: canvasMode === 'addNode' ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s',
            }}
          >
            ➕ Add Hub
          </button>

          <button
            onClick={() => setCanvasMode('delete')}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: canvasMode === 'delete' ? '#ef4444' : '#0f172a',
              color: canvasMode === 'delete' ? '#ffffff' : '#f1f5f9',
              fontWeight: canvasMode === 'delete' ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s',
            }}
          >
            🗑️ Delete
          </button>
        </div>

        {canvasMode === 'addNode' && (
          <div style={{ marginTop: '10px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8' }}>Type:</label>
            {(['factory', 'hub', 'market'] as NodeType[]).map((t) => (
              <button
                key={t}
                onClick={() => setNodeTypeToAdd(t)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #334155',
                  background: nodeTypeToAdd === t ? '#64748b' : '#0f172a',
                  color: '#f1f5f9',
                  fontSize: '10px',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '0' }} />

      {/* Select Algorithm */}
      <div className="sidebar-section">
        <h3 style={{ margin: '0 0 10px 0', color: '#f8fafc', fontSize: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>3. Algorithm Configuration</h3>
        
        <select
          value={selectedAlgorithm}
          onChange={(e) => setSelectedAlgorithm(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', border: '1px solid #475569', color: '#f1f5f9', cursor: 'pointer', outline: 'none', marginBottom: '10px' }}
        >
          {activePreset === 'logistics' || activePreset === 'custom' ? (
            <>
              <option value="dijkstra">Dijkstra's Shortest Path</option>
              <option value="astar">A* Search Pathfinding</option>
              <option value="yens">Yen's K-Shortest Paths</option>
              <option value="bellmanFord">Bellman-Ford (EV Charging)</option>
              <option value="kruskal">Kruskal's MST (Wire Layout)</option>
            </>
          ) : activePreset === 'supplyChainFlow' ? (
            <option value="edmondsKarp">Edmonds-Karp (Max-Flow)</option>
          ) : (
            <option value="tsp">2-Opt TSP Tour Solver</option>
          )}
        </select>

        {selectedAlgorithm === 'yens' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>Alternate Paths (K):</label>
            <input
              type="number"
              min={2}
              max={5}
              value={kValue}
              onChange={(e) => setKValue(Math.max(2, Math.min(5, parseInt(e.target.value) || 2)))}
              style={{ width: '50px', padding: '6px', borderRadius: '4px', background: '#0f172a', border: '1px solid #475569', color: '#fff', textAlign: 'center' }}
            />
          </div>
        )}

        {/* Start / Target node selection for Pathfinding */}
        {selectedAlgorithm !== 'tsp' && selectedAlgorithm !== 'kruskal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Source Node:</label>
              <select
                value={sourceNodeId}
                onChange={(e) => setSourceNodeId(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #475569', color: '#f1f5f9', outline: 'none' }}
              >
                <option value="">-- Choose Node --</option>
                {graph.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {selectedAlgorithm !== 'edmondsKarp' && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Target Node:</label>
                <select
                  value={targetNodeId}
                  onChange={(e) => setTargetNodeId(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #475569', color: '#f1f5f9', outline: 'none' }}
                >
                  <option value="">-- Choose Node --</option>
                  {graph.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedAlgorithm === 'edmondsKarp' && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Sink (Consumer) Node:</label>
                <select
                  value={targetNodeId}
                  onChange={(e) => setTargetNodeId(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #475569', color: '#f1f5f9', outline: 'none' }}
                >
                  <option value="">-- Choose Sink --</option>
                  {graph.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '0' }} />

      {/* Selected Edge Editor */}
      {selectedEdge && (
        <div style={{ background: 'rgba(14, 116, 144, 0.15)', padding: '12px', borderRadius: '8px', border: '1.5px solid #0e7490', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: '0', fontSize: '11px', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 'bold' }}>
              🛣️ Road Customizer
            </h4>
            <button
              onClick={() => setSelectedEdgeId(null)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '10px' }}
            >
              ✕
            </button>
          </div>
          <div style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 'bold', borderBottom: '1px solid rgba(14, 116, 144, 0.3)', paddingBottom: '4px', textAlign: 'left' }}>
            {graph.nodes.find(n => n.id === selectedEdge.source)?.name || selectedEdge.source} ➜ {graph.nodes.find(n => n.id === selectedEdge.target)?.name || selectedEdge.target}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'left' }}>Speed Limit (km/h):</label>
            <input
              type="number"
              value={selectedEdge.speedLimit}
              onChange={(e) => {
                const val = Math.max(10, parseInt(e.target.value) || 10);
                setGraph((prev) => ({
                  ...prev,
                  edges: prev.edges.map((edge) => (edge.id === selectedEdge.id ? { ...edge, speedLimit: val } : edge)),
                }));
              }}
              style={{ width: '100%', padding: '4px', borderRadius: '4px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '10px', textAlign: 'center', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'left' }}>Traffic Multiplier:</label>
            <input
              type="number"
              step={0.5}
              value={selectedEdge.traffic}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 1.0;
                setGraph((prev) => ({
                  ...prev,
                  edges: prev.edges.map((edge) => (edge.id === selectedEdge.id ? { ...edge, traffic: val } : edge)),
                }));
              }}
              style={{ width: '100%', padding: '4px', borderRadius: '4px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '10px', textAlign: 'center', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'left' }}>Flow Capacity:</label>
            <input
              type="number"
              value={selectedEdge.capacity}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value) || 1);
                setGraph((prev) => ({
                  ...prev,
                  edges: prev.edges.map((edge) => (edge.id === selectedEdge.id ? { ...edge, capacity: val } : edge)),
                }));
              }}
              style={{ width: '100%', padding: '4px', borderRadius: '4px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '10px', textAlign: 'center', boxSizing: 'border-box' }}
            />
          </div>
          <p style={{ margin: '0', fontSize: '8px', color: '#64748b', lineHeight: '1.3', textAlign: 'left' }}>
            💡 Enter a negative traffic multiplier (e.g. -2) to simulate an EV recharge lane with negative travel cost credits!
          </p>
        </div>
      )}

      {/* Execution Controls */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={onRunInstantly}
          disabled={isPlaying || (selectedAlgorithm !== 'tsp' && selectedAlgorithm !== 'kruskal' && (!sourceNodeId || !targetNodeId))}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
            transition: 'all 0.2s',
            opacity: isPlaying || (selectedAlgorithm !== 'tsp' && selectedAlgorithm !== 'kruskal' && (!sourceNodeId || !targetNodeId)) ? 0.5 : 1,
          }}
        >
          🚀 Run Instantly
        </button>

        <button
          onClick={onStartStepByStep}
          disabled={isPlaying || (selectedAlgorithm !== 'tsp' && selectedAlgorithm !== 'kruskal' && (!sourceNodeId || !targetNodeId))}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
            transition: 'all 0.2s',
            opacity: isPlaying || (selectedAlgorithm !== 'tsp' && selectedAlgorithm !== 'kruskal' && (!sourceNodeId || !targetNodeId)) ? 0.5 : 1,
          }}
        >
          🔬 Step-by-Step debugger
        </button>

        {(isStepMode || isPlaying || activePath.length > 0) && (
          <button
            onClick={onReset}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              background: 'transparent',
              color: '#ef4444',
              border: '1px solid #ef4444',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            ⏹️ Reset Visualization
          </button>
        )}
      </div>

    </div>
  );
};
