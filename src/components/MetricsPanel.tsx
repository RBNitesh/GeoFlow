import React from 'react';

interface MetricsPanelProps {
  algorithm: string;
  metrics: {
    pathCost: number;
    nodesVisited: number;
    totalNodes: number;
    executionTimeMs: number;
    stepsCount: number;
  } | null;
  // Side-by-side comparison metrics
  comparison?: {
    dijkstraVisited: number;
    aStarVisited: number;
    dijkstraTime: number;
    aStarTime: number;
    dijkstraSteps: number;
    aStarSteps: number;
  } | null;
  cacheStats?: {
    hits: number;
    misses: number;
    ratio: number;
  };
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  algorithm,
  metrics,
  comparison,
  cacheStats,
}) => {
  const isPathfinding = ['dijkstra', 'astar', 'yens'].includes(algorithm);
  const isMaxFlow = algorithm === 'edmondsKarp';
  const isTSP = algorithm === 'tsp';

  return (
    <div className="metrics-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px', border: '1px solid #334155', backdropFilter: 'blur(12px)', height: '100%', boxSizing: 'border-box', color: '#f1f5f9' }}>
      <h3 style={{ margin: '0', fontSize: '14px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#f8fafc' }}>
        📊 Telemetry & Performance
      </h3>

      {/* Cache Metrics */}
      {cacheStats && (
        <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.03em' }}>
            🛰️ Route Cache Status
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>{cacheStats.hits}</div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>Hits</div>
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ef4444' }}>{cacheStats.misses}</div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>Misses</div>
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#38bdf8' }}>
                {(cacheStats.ratio * 100).toFixed(0)}%
              </div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>Hit Ratio</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Algorithm Metrics */}
      {metrics ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>
                {isMaxFlow ? 'MAX CAPACITY' : isTSP ? 'TOUR DISTANCE' : 'PRIMARY COST'}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e', marginTop: '4px' }}>
                {isMaxFlow 
                  ? `${metrics.pathCost.toFixed(0)} units` 
                  : isTSP 
                    ? `${metrics.pathCost.toFixed(1)} km`
                    : `${metrics.pathCost.toFixed(2)} hrs`
                }
              </div>
            </div>

            <div style={{ background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>
                EXECUTION TIME
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#38bdf8', marginTop: '4px' }}>
                {metrics.executionTimeMs < 1 ? '< 1 ms' : `${metrics.executionTimeMs.toFixed(1)} ms`}
              </div>
            </div>
          </div>

          <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: '#94a3b8' }}>Nodes Explored:</span>
              <span style={{ fontWeight: 'bold' }}>{metrics.nodesVisited} / {metrics.totalNodes}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: '#94a3b8' }}>Algorithm Steps:</span>
              <span style={{ fontWeight: 'bold' }}>{metrics.stepsCount} steps</span>
            </div>
          </div>

          {/* Side-by-Side Pathfinding Comparison (Dijkstra vs A*) */}
          {isPathfinding && comparison && (
            <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b', marginTop: '5px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '11px', textTransform: 'uppercase', color: '#e2e8f0', letterSpacing: '0.03em', textAlign: 'center' }}>
                ⚔️ Pathfinding Efficiency Comparison
              </h4>
              
              {/* Nodes Explored Custom SVG Bar Chart */}
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>
                Nodes Visited (Lower is Better):
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                {/* Dijkstra Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#cbd5e1', marginBottom: '4px' }}>
                    <span>Dijkstra (Blind Search)</span>
                    <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{comparison.dijkstraVisited} nodes</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.max(10, Math.min(100, (comparison.dijkstraVisited / metrics.totalNodes) * 100))}%`,
                      height: '100%',
                      background: '#fbbf24',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease-out',
                    }} />
                  </div>
                </div>

                {/* A* Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#cbd5e1', marginBottom: '4px' }}>
                    <span>A* Search (Heuristic-guided)</span>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>{comparison.aStarVisited} nodes</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.max(10, Math.min(100, (comparison.aStarVisited / metrics.totalNodes) * 100))}%`,
                      height: '100%',
                      background: '#10b981',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease-out',
                    }} />
                  </div>
                </div>
              </div>

              {/* Explored Nodes reduction explanation */}
              {comparison.dijkstraVisited > comparison.aStarVisited ? (
                <div style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)', lineHeight: '1.4' }}>
                  💡 **A* Search** explored **{(100 - (comparison.aStarVisited / comparison.dijkstraVisited) * 100).toFixed(0)}% fewer** nodes than Dijkstra. The straight-line distance heuristic successfully guided the search frontier directly toward the target destination.
                </div>
              ) : (
                <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>
                  Dijkstra and A* explored the same number of nodes in this configuration.
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '120px', color: '#64748b', fontSize: '12px', textAlign: 'center', border: '1px dashed #334155', borderRadius: '8px' }}>
          <span>No active simulation metrics.</span>
          <span style={{ marginTop: '4px', fontSize: '10px' }}>Select start/end locations and run an algorithm.</span>
        </div>
      )}
    </div>
  );
};
