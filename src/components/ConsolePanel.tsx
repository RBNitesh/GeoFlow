import React, { useRef, useEffect } from 'react';

interface ConsolePanelProps {
  logs: string[];
  currentStepIndex: number;
  totalSteps: number;
  isStepMode: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onJumpToStart: () => void;
  onJumpToEnd: () => void;
  simSpeed: number; // in ms
  setSimSpeed: (speed: number) => void;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({
  logs,
  currentStepIndex,
  totalSteps,
  isStepMode,
  isPlaying,
  onPlayPause,
  onStepForward,
  onStepBackward,
  onJumpToStart,
  onJumpToEnd,
  simSpeed,
  setSimSpeed,
}) => {
  const terminalRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll terminal to bottom when new logs are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, currentStepIndex]);

  return (
    <div className="console-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '15px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid #334155', backdropFilter: 'blur(12px)', boxSizing: 'border-box', height: '100%', minHeight: '220px', color: '#00ff66' }}>
      
      {/* Header and Step playback HUD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: isStepMode ? (isPlaying ? '#10b981' : '#eab308') : '#64748b', animation: isPlaying ? 'pulse 1.5s infinite' : 'none' }} />
          <span style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace', color: '#e2e8f0' }}>
            ALGORITHM DEBUGGER TERMINAL
          </span>
        </div>
        {isStepMode && (
          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
            Step: {currentStepIndex + 1} / {totalSteps}
          </span>
        )}
      </div>

      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className="terminal-screen"
        style={{
          flex: '1 1 auto',
          background: '#020617',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid #1e293b',
          fontFamily: 'monospace',
          fontSize: '11px',
          lineHeight: '1.5',
          overflowY: 'auto',
          maxHeight: '140px',
          color: '#34d399',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: '#64748b', fontStyle: 'italic' }}>
            &gt; System idle. Choose configuration and launch "Step-by-Step debugger" or "Run Instantly"...
          </div>
        ) : (
          logs.slice(0, currentStepIndex + 1).map((log, idx) => (
            <div key={idx} style={{ marginBottom: '6px', opacity: idx === currentStepIndex ? 1 : 0.65, fontWeight: idx === currentStepIndex ? 'bold' : 'normal' }}>
              <span style={{ color: '#60a5fa' }}>&gt;</span> {log}
            </div>
          ))
        )}
      </div>

      {/* Playback Controls */}
      {isStepMode && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
          
          {/* Debug Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={onJumpToStart}
              disabled={isPlaying}
              style={{ padding: '6px 10px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
              title="Jump to Start"
            >
              ⏮️
            </button>
            <button
              onClick={onStepBackward}
              disabled={isPlaying || currentStepIndex === 0}
              style={{ padding: '6px 10px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
              title="Step Backward"
            >
              ◀️ Back
            </button>
            <button
              onClick={onPlayPause}
              style={{
                padding: '6px 14px',
                background: isPlaying ? '#ef4444' : '#10b981',
                border: 'none',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                minWidth: '70px',
              }}
            >
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            <button
              onClick={onStepForward}
              disabled={isPlaying || currentStepIndex === totalSteps - 1}
              style={{ padding: '6px 10px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
              title="Step Forward"
            >
              Next ▶️
            </button>
            <button
              onClick={onJumpToEnd}
              disabled={isPlaying}
              style={{ padding: '6px 10px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
              title="Jump to End"
            >
              ⏭️
            </button>
          </div>

          {/* Speed Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
              Speed: {simSpeed}ms
            </span>
            <input
              type="range"
              min={150}
              max={1500}
              step={50}
              value={simSpeed}
              onChange={(e) => setSimSpeed(parseInt(e.target.value))}
              style={{ width: '100px', accentColor: '#3b82f6', cursor: 'pointer' }}
            />
          </div>

        </div>
      )}
    </div>
  );
};
