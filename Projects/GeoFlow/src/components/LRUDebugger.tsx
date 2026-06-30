import React from 'react';

interface LRUDebuggerProps {
  cacheQueue: { key: string; value: number }[];
  capacity: number;
}

export const LRUDebugger: React.FC<LRUDebuggerProps> = ({ cacheQueue, capacity }) => {
  return (
    <div className="lru-debugger" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px', border: '1px solid #334155', backdropFilter: 'blur(12px)', boxSizing: 'border-box', color: '#f1f5f9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: '0', fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#f8fafc' }}>
          💾 LRU Cache Memory View
        </h4>
        <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
          Size: {cacheQueue.length} / {capacity}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px 0', minHeight: '65px', alignItems: 'center' }}>
        {cacheQueue.length === 0 ? (
          <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', width: '100%', fontStyle: 'italic' }}>
            Cache is empty. Computed routes will be cached here.
          </div>
        ) : (
          cacheQueue.map((item, index) => {
            const isMRU = index === 0;
            const isLRU = index === cacheQueue.length - 1 && cacheQueue.length === capacity;
            
            // Format key for visual layout: "N1->N6:astar" => "N1 → N6 (A*)"
            const parts = item.key.split(':');
            const pathParts = parts[0].split('->');
            const algo = parts[1] || '';
            const routeLabel = `${pathParts[0]} → ${pathParts[1]}`;
            const algoLabel = algo === 'dijkstra' ? 'Dijkstra' : algo === 'astar' ? 'A*' : algo === 'yens' ? "Yen's" : algo;

            return (
              <div
                key={item.key}
                style={{
                  flex: '0 0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  padding: '8px 12px',
                  background: isMRU ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
                  border: isMRU 
                    ? '1.5px dashed #38bdf8' 
                    : isLRU 
                      ? '1px solid #ef4444' 
                      : '1px solid #334155',
                  borderRadius: '6px',
                  minWidth: '130px',
                  position: 'relative',
                  transition: 'all 0.3s ease-in-out',
                }}
              >
                {/* MRU / LRU Tags */}
                {isMRU && (
                  <span style={{ position: 'absolute', top: '-7px', left: '6px', background: '#38bdf8', color: '#0f172a', fontSize: '7px', fontWeight: 'bold', padding: '1px 4px', borderRadius: '3px' }}>
                    MRU
                  </span>
                )}
                {isLRU && (
                  <span style={{ position: 'absolute', top: '-7px', right: '6px', background: '#ef4444', color: '#fff', fontSize: '7px', fontWeight: 'bold', padding: '1px 4px', borderRadius: '3px' }}>
                    LRU (EVICT NEXT)
                  </span>
                )}

                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#f1f5f9', whiteSpace: 'nowrap' }}>
                  {routeLabel}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', color: '#94a3b8' }}>
                  <span>{algoLabel}</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>{item.value.toFixed(1)}h</span>
                </div>
              </div>
            );
          })
        )}

        {/* Display remaining empty slots in cache */}
        {Array.from({ length: Math.max(0, capacity - cacheQueue.length) }).map((_, idx) => (
          <div
            key={`empty-${idx}`}
            style={{
              flex: '0 0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '130px',
              height: '42px',
              border: '1px dashed #1e293b',
              borderRadius: '6px',
              color: '#334155',
              fontSize: '9px',
              fontFamily: 'monospace',
            }}
          >
            [EMPTY SLOT]
          </div>
        ))}
      </div>
      <p style={{ margin: '0', fontSize: '9px', color: '#64748b', lineHeight: '1.3' }}>
        💡 **How it works**: Running a path query checks the memory cache. A **Cache Hit** serves results in \(O(1)\) time and moves the query to the left (MRU). A **Cache Miss** runs the algorithm and inserts the query, evicting the Least Recently Used (LRU) item on the right if full.
      </p>
    </div>
  );
};
