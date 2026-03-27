import { useCallback, useEffect, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { useNavigate } from 'react-router';
import { SignalQuality } from '../components/SignalQuality';
import { useGameStore } from '../lib/gameStore';
import { useNeuroSignals } from '../neuro/hooks';

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function composureLabel(c: number) {
  if (c < 0) return '—';
  if (c >= 0.7) return 'Steady';
  if (c >= 0.4) return 'Moderate';
  return 'Stressed';
}

function composureColor(c: number) {
  if (c >= 0.7) return 'var(--color-analysis-green)';
  if (c >= 0.4) return 'var(--color-amber)';
  return 'var(--color-alert)';
}

export function PlayPage() {
  const navigate = useNavigate();
  const { calm, bpm, hrvRmssd, signalQuality, source } = useNeuroSignals();
  const game = useGameStore((s) => s.game);
  const moves = useGameStore((s) => s.moves);
  const status = useGameStore((s) => s.status);
  const turn = useGameStore((s) => s.turn);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const makeMove = useGameStore((s) => s.makeMove);
  const computerMove = useGameStore((s) => s.computerMove);
  const reset = useGameStore((s) => s.reset);

  const [boardWidth, setBoardWidth] = useState(480);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const moveLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'idle') {
      useGameStore.setState({ status: 'playing' });
    }
  }, [status]);

  useEffect(() => {
    const el = boardContainerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.min(entry.contentRect.width - 16, entry.contentRect.height - 16, 560);
        setBoardWidth(Math.max(280, w));
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    moveLogRef.current?.scrollTo({ top: moveLogRef.current.scrollHeight, behavior: 'smooth' });
  }, [moves.length]);

  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string) => {
      if (isGameOver || turn !== 'w') return false;
      const ok = makeMove(sourceSquare, targetSquare, calm);
      if (ok) {
        setTimeout(() => computerMove(), 400);
      }
      return ok;
    },
    [isGameOver, turn, calm, makeMove, computerMove],
  );

  const handleNewGame = () => {
    reset();
  };

  const handleAnalysis = () => {
    const data = {
      moves,
      result: status,
      date: Date.now(),
    };
    sessionStorage.setItem('neuro-chess-analysis', JSON.stringify(data));
    navigate('/analysis');
  };

  const composure = Math.round(calm * 100);
  const displayBpm = bpm !== null ? Math.round(bpm) : '--';
  const displayHrv = hrvRmssd !== null ? hrvRmssd.toFixed(0) : '--';
  const showBreathPrompt = bpm !== null && bpm > 90;

  const statusText = (() => {
    if (status === 'checkmate') return game.turn() === 'w' ? 'Checkmate — Black wins' : 'Checkmate — White wins';
    if (status === 'stalemate') return 'Stalemate — Draw';
    if (status === 'draw') return 'Draw';
    if (game.inCheck()) return turn === 'w' ? 'White in check' : 'Black in check';
    return turn === 'w' ? 'White to move' : 'Black thinking...';
  })();

  const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--color-shell)', ...mono }}
    >
      {/* Top menu bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '2px 8px',
          borderBottom: '1px solid var(--color-border-dark)',
          background: 'var(--color-shell)',
          fontSize: 12,
        }}
      >
        <button type="button" onClick={() => navigate('/')} style={{ fontSize: 12 }}>
          File
        </button>
        <button type="button" onClick={handleNewGame} style={{ fontSize: 12 }}>
          New Game
        </button>
        {isGameOver && (
          <button type="button" onClick={handleAnalysis} style={{ fontSize: 12 }}>
            View Analysis
          </button>
        )}
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Chess board */}
        <div style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div className="window" style={{ margin: 8, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="title-bar">
              <div className="title-bar-text">Board — {statusText}</div>
              <div className="title-bar-controls">
                <button type="button" aria-label="Minimize" />
                <button type="button" aria-label="Maximize" />
              </div>
            </div>
            <div
              ref={boardContainerRef}
              className="window-body"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8,
                overflow: 'hidden',
              }}
            >
              <Chessboard
                id="mainBoard"
                position={game.fen()}
                onPieceDrop={onDrop}
                boardWidth={boardWidth}
                arePiecesDraggable={!isGameOver && turn === 'w'}
                customBoardStyle={{
                  borderRadius: 0,
                  boxShadow: 'inset -1px -1px #fff, inset 1px 1px grey',
                }}
                customDarkSquareStyle={{ backgroundColor: '#769656' }}
                customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
              />
            </div>
          </div>

          {/* Move log */}
          <div className="window" style={{ margin: '0 8px 8px', maxHeight: 160 }}>
            <div className="title-bar">
              <div className="title-bar-text">Move Log</div>
            </div>
            <div
              ref={moveLogRef}
              className="window-body"
              style={{ maxHeight: 120, overflow: 'auto', padding: 4, fontSize: 11 }}
            >
              {moves.length === 0 ? (
                <span style={{ color: '#999' }}>No moves yet. Make your first move.</span>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>
                      <th style={{ padding: '2px 6px', width: 30 }}>#</th>
                      <th style={{ padding: '2px 6px' }}>Move</th>
                      <th style={{ padding: '2px 6px' }}>Time</th>
                      <th style={{ padding: '2px 6px' }}>Composure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moves.map((m, i) => (
                      <tr key={m.time} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '2px 6px', color: '#999' }}>{i + 1}</td>
                        <td style={{ padding: '2px 6px', fontWeight: 600 }}>{m.san}</td>
                        <td style={{ padding: '2px 6px', color: '#888' }}>{formatTime(m.time)}</td>
                        <td style={{ padding: '2px 6px', color: composureColor(m.composure) }}>
                          {composureLabel(m.composure)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right: Telemetry panel */}
        <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Neuro signals */}
          <div className="window" style={{ margin: '8px 8px 0' }}>
            <div className="title-bar">
              <div className="title-bar-text">Telemetry</div>
            </div>
            <div className="window-body" style={{ padding: 12, fontSize: 12 }}>
              {source === 'none' ? (
                <div style={{ color: '#999', textAlign: 'center', padding: '12px 0' }}>
                  <p>No signal source connected.</p>
                  <button
                    type="button"
                    onClick={() => navigate('/settings')}
                    style={{ marginTop: 8, fontSize: 11 }}
                  >
                    Connect Device
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {source === 'eeg' ? 'EEG + Camera' : source === 'rppg' ? 'Camera' : 'Simulated'}
                    </span>
                    <SignalQuality quality={signalQuality} size={14} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>HR</div>
                      <div style={{ fontSize: 22, fontWeight: 700 }}>
                        <span style={{ color: '#c00', fontSize: 14 }}>♥</span> {displayBpm}
                      </div>
                      <div style={{ fontSize: 9, color: '#aaa' }}>bpm</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>HRV</div>
                      <div style={{ fontSize: 22, fontWeight: 700 }}>{displayHrv}</div>
                      <div style={{ fontSize: 9, color: '#aaa' }}>rMSSD ms</div>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 10,
                      background: '#f5f5f5',
                      border: '1px solid #ddd',
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>COMPOSURE</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 28, fontWeight: 700, color: composureColor(calm) }}>
                        {composure}%
                      </span>
                      <span style={{ fontSize: 11, color: composureColor(calm) }}>
                        {composureLabel(calm)}
                      </span>
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        height: 4,
                        background: '#ddd',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${composure}%`,
                          background: composureColor(calm),
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>

                  {showBreathPrompt && (
                    <div
                      style={{
                        padding: 8,
                        background: '#fff8e1',
                        border: '1px solid var(--color-amber)',
                        fontSize: 11,
                        color: 'var(--color-amber)',
                        textAlign: 'center',
                      }}
                    >
                      ⚠ HR elevated — Take a slow breath
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Game info */}
          <div className="window" style={{ margin: 8, flex: 1 }}>
            <div className="title-bar">
              <div className="title-bar-text">Game Info</div>
            </div>
            <div className="window-body" style={{ padding: 12, fontSize: 11 }}>
              <table style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ color: '#888', padding: '3px 0' }}>White</td>
                    <td style={{ fontWeight: 600 }}>You</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#888', padding: '3px 0' }}>Black</td>
                    <td style={{ fontWeight: 600 }}>Computer (Random)</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#888', padding: '3px 0' }}>Moves</td>
                    <td>{moves.length}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#888', padding: '3px 0' }}>Status</td>
                    <td>{statusText}</td>
                  </tr>
                </tbody>
              </table>

              {isGameOver && (
                <div style={{ marginTop: 12, display: 'flex', gap: 6, flexDirection: 'column' }}>
                  <button type="button" onClick={handleNewGame} style={{ fontSize: 11, width: '100%' }}>
                    New Game
                  </button>
                  <button type="button" onClick={handleAnalysis} style={{ fontSize: 11, width: '100%' }}>
                    View Analysis →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          padding: 0,
          borderTop: '1px solid var(--color-border-dark)',
          fontSize: 11,
          background: 'var(--color-shell)',
        }}
      >
        <div
          style={{
            flex: 1,
            padding: '2px 8px',
            borderRight: '1px solid #aaa',
            boxShadow: 'inset -1px -1px #fff, inset 1px 1px grey',
          }}
        >
          {statusText}
        </div>
        <div
          style={{
            padding: '2px 8px',
            minWidth: 100,
            borderRight: '1px solid #aaa',
            boxShadow: 'inset -1px -1px #fff, inset 1px 1px grey',
          }}
        >
          Moves: {moves.length}
        </div>
        <div
          style={{
            padding: '2px 8px',
            minWidth: 120,
            boxShadow: 'inset -1px -1px #fff, inset 1px 1px grey',
          }}
        >
          {source !== 'none' ? `Composure: ${composure}%` : 'No signal'}
        </div>
      </div>
    </div>
  );
}
