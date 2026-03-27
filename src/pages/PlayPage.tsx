import { useCallback, useEffect, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { useNavigate } from 'react-router';
import { MusicPlayer } from '../components/MusicPlayer';
import { SignalQuality } from '../components/SignalQuality';
import type { NeuroContext } from '../lib/gameStore';
import { useGameStore } from '../lib/gameStore';
import { getBestMove } from '../lib/stockfishEngine';
import { useNeuroSignals, useNeuroStore } from '../neuro/hooks';
import type { NeuroManager } from '../neuro/neuroManager';

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function calmLabel(c: number) {
  if (c >= 0.7) return 'Steady';
  if (c >= 0.4) return 'Moderate';
  return 'Stressed';
}

function calmColor(c: number) {
  if (c >= 0.7) return 'var(--color-analysis-green)';
  if (c >= 0.4) return 'var(--color-amber)';
  return 'var(--color-alert)';
}

function BandBar({ label, value }: { label: string; value: number | null }) {
  const v = value !== null ? Math.min(value, 1) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
      <span style={{ width: 28, color: '#888', textAlign: 'right' }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: '#ddd', borderRadius: 2, overflow: 'hidden', minWidth: 40 }}>
        <div
          style={{
            height: '100%',
            width: `${v * 100}%`,
            background: 'var(--color-accent)',
            transition: 'width 0.3s',
          }}
        />
      </div>
    </div>
  );
}

type TabId = 'moves' | 'game' | 'music';

export function PlayPage() {
  const navigate = useNavigate();
  const neuro = useNeuroSignals();
  const manager = useNeuroStore((s) => s.manager) as NeuroManager | null;
  const game = useGameStore((s) => s.game);
  const moves = useGameStore((s) => s.moves);
  const status = useGameStore((s) => s.status);
  const turn = useGameStore((s) => s.turn);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const makeMove = useGameStore((s) => s.makeMove);
  const computerMove = useGameStore((s) => s.computerMove);
  const addNeuroSnapshot = useGameStore((s) => s.addNeuroSnapshot);
  const reset = useGameStore((s) => s.reset);

  const [boardWidth, setBoardWidth] = useState(480);
  const [activeTab, setActiveTab] = useState<TabId>('moves');
  const [gameOverCountdown, setGameOverCountdown] = useState<number | null>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const moveLogRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const snapshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameOverHandled = useRef(false);

  useEffect(() => {
    if (status === 'idle') {
      useGameStore.setState({ status: 'playing', gameStartTime: Date.now() });
    }
  }, [status]);

  useEffect(() => {
    const el = boardContainerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.min(entry.contentRect.width - 8, entry.contentRect.height - 8, 680);
        setBoardWidth(Math.max(280, w));
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: moves.length triggers scroll on new moves
  useEffect(() => {
    moveLogRef.current?.scrollTo({ top: moveLogRef.current.scrollHeight, behavior: 'smooth' });
  }, [moves.length]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: cameraActive triggers video element re-attach
  useEffect(() => {
    const container = videoContainerRef.current;
    if (!container || !manager) return;
    const videoEl = manager.getCameraVideoElement();
    if (videoEl) {
      videoEl.style.width = '100%';
      videoEl.style.height = '100%';
      videoEl.style.objectFit = 'cover';
      videoEl.style.transform = 'scaleX(-1)';
      container.appendChild(videoEl);
      return () => {
        if (container.contains(videoEl)) container.removeChild(videoEl);
      };
    }
  }, [manager, neuro.cameraActive]);

  // Periodic neuro snapshots (every 2s while playing)
  useEffect(() => {
    if (status !== 'playing') return;
    snapshotIntervalRef.current = setInterval(() => {
      const ns = useNeuroStore.getState();
      addNeuroSnapshot({
        calm: ns.calm,
        arousal: ns.arousal,
        bpm: ns.bpm,
        hrv: ns.hrvRmssd,
        alphaPower: ns.alphaPower,
        betaPower: ns.betaPower,
        thetaPower: ns.thetaPower,
        deltaPower: ns.deltaPower,
        gammaPower: ns.gammaPower,
        alphaPeakFreq: ns.alphaPeakFreq,
        alphaBumpState: ns.alphaBumpState,
        respirationRate: ns.respirationRate,
      });
    }, 2000);
    return () => {
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
    };
  }, [status, addNeuroSnapshot]);

  // Auto-redirect to analysis after game over
  useEffect(() => {
    if (!isGameOver || gameOverHandled.current) return;
    gameOverHandled.current = true;
    setGameOverCountdown(3);
    const data = {
      moves: useGameStore.getState().moves,
      neuroSnapshots: useGameStore.getState().neuroSnapshots,
      result: useGameStore.getState().status,
      date: Date.now(),
    };
    sessionStorage.setItem('neuro-chess-analysis', JSON.stringify(data));

    let count = 3;
    const timer = setInterval(() => {
      count--;
      setGameOverCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        navigate('/analysis');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver, navigate]);

  const buildNeuroContext = useCallback((): NeuroContext => {
    const ns = useNeuroStore.getState();
    return {
      calm: ns.calm,
      arousal: ns.arousal,
      bpm: ns.bpm,
      hrv: ns.hrvRmssd,
      alphaPower: ns.alphaPower,
      betaPower: ns.betaPower,
      thetaPower: ns.thetaPower,
      deltaPower: ns.deltaPower,
      gammaPower: ns.gammaPower,
      alphaPeakFreq: ns.alphaPeakFreq,
      alphaBumpState: ns.alphaBumpState,
      respirationRate: ns.respirationRate,
    };
  }, []);

  const difficulty = useGameStore((s) => s.difficulty);

  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string) => {
      if (isGameOver || turn !== 'w') return false;
      const ctx = buildNeuroContext();
      const ok = makeMove(sourceSquare, targetSquare, ctx);
      if (ok) {
        const currentGame = useGameStore.getState().game;
        if (!currentGame.isGameOver()) {
          getBestMove(currentGame.fen(), difficulty)
            .then((engineMove) => computerMove(engineMove))
            .catch(() => computerMove());
        }
      }
      return ok;
    },
    [isGameOver, turn, makeMove, computerMove, buildNeuroContext, difficulty],
  );

  const handleNewGame = () => {
    gameOverHandled.current = false;
    setGameOverCountdown(null);
    reset();
  };

  const handleAnalysis = () => {
    const data = {
      moves,
      neuroSnapshots: useGameStore.getState().neuroSnapshots,
      result: status,
      date: Date.now(),
    };
    sessionStorage.setItem('neuro-chess-analysis', JSON.stringify(data));
    navigate('/analysis');
  };

  const calmPct = Math.round(neuro.calm * 100);
  const arousalPct = Math.round(neuro.arousal * 100);
  const displayBpm = neuro.bpm !== null ? Math.round(neuro.bpm) : '--';
  const displayHrv = neuro.hrvRmssd !== null ? neuro.hrvRmssd.toFixed(0) : '--';
  const displayResp = neuro.respirationRate !== null ? neuro.respirationRate.toFixed(1) : '--';

  const statusText = (() => {
    if (status === 'checkmate') return game.turn() === 'w' ? 'Checkmate — Black wins' : 'Checkmate — White wins';
    if (status === 'stalemate') return 'Stalemate — Draw';
    if (status === 'draw') return 'Draw';
    if (game.inCheck()) return turn === 'w' ? 'White in check — find an escape' : 'Black in check';
    return turn === 'w' ? 'White to move' : 'Black thinking...';
  })();

  const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-shell)', ...mono }}>
      {/* Game over overlay */}
      {gameOverCountdown !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
            {status === 'checkmate'
              ? game.turn() === 'w'
                ? 'Black Wins'
                : 'White Wins'
              : status === 'stalemate'
                ? 'Stalemate'
                : 'Draw'}
          </div>
          <div style={{ fontSize: 14, opacity: 0.7 }}>Redirecting to analysis in {gameOverCountdown}...</div>
        </div>
      )}

      {/* Top menu bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          borderBottom: '1px solid var(--color-border-dark)',
          background: 'var(--color-shell)',
          fontSize: 13,
        }}
      >
        <button type="button" onClick={() => navigate('/')}>
          File
        </button>
        <button type="button" onClick={handleNewGame}>
          New Game
        </button>
        {isGameOver && (
          <button type="button" onClick={handleAnalysis}>
            View Analysis
          </button>
        )}
      </div>

      {/* Main content: board + right panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Left: Chess board */}
        <div style={{ flex: '1 1 65%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div
            className="window"
            style={{ margin: '4px 4px 4px 8px', flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <div className="title-bar">
              <div className="title-bar-text">Board — {statusText}</div>
            </div>
            <div
              ref={boardContainerRef}
              className="window-body"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
                overflow: 'hidden',
              }}
            >
              <Chessboard
                id="mainBoard"
                position={game.fen()}
                onPieceDrop={onDrop}
                boardWidth={boardWidth}
                arePiecesDraggable={!isGameOver && turn === 'w'}
                customBoardStyle={{ borderRadius: 0, boxShadow: 'inset -1px -1px #fff, inset 1px 1px grey' }}
                customDarkSquareStyle={{ backgroundColor: '#769656' }}
                customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
              />
            </div>
          </div>
        </div>

        {/* Right: Tabbed panel */}
        <div style={{ flex: '0 0 260px', display: 'flex', flexDirection: 'column', margin: '4px 8px 4px 4px' }}>
          <div className="window" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Tab bar */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--color-border-dark)',
                background: 'var(--color-panel)',
              }}
            >
              {(['moves', 'game', 'music'] as TabId[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    fontSize: 11,
                    fontWeight: activeTab === tab ? 700 : 400,
                    background: activeTab === tab ? 'var(--color-shell)' : 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab ? '2px solid var(--color-accent)' : '2px solid transparent',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {activeTab === 'moves' && (
                <div ref={moveLogRef} style={{ padding: 0, fontSize: 11 }}>
                  {moves.length === 0 ? (
                    <div style={{ color: '#999', padding: '16px 20px' }}>No moves yet.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr
                          style={{
                            borderBottom: '1px solid #ccc',
                            textAlign: 'left',
                            position: 'sticky',
                            top: 0,
                            background: 'var(--color-panel)',
                          }}
                        >
                          <th style={{ padding: '6px 10px', width: 30 }}>#</th>
                          <th style={{ padding: '6px 10px' }}>Move</th>
                          <th style={{ padding: '6px 10px' }}>Time</th>
                          <th style={{ padding: '6px 10px' }}>Calm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {moves.map((m, i) => (
                          <tr key={m.time} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '5px 10px', color: '#999' }}>{i + 1}</td>
                            <td style={{ padding: '5px 10px', fontWeight: 600 }}>{m.san}</td>
                            <td style={{ padding: '5px 10px', color: '#888' }}>{formatTime(m.time)}</td>
                            <td style={{ padding: '5px 10px', color: m.side === 'w' ? calmColor(m.calm) : '#ccc' }}>
                              {m.side === 'w' ? calmLabel(m.calm) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'game' && (
                <div style={{ padding: '16px 20px', fontSize: 12 }}>
                  <table style={{ width: '100%' }}>
                    <tbody>
                      <tr>
                        <td style={{ color: '#888', padding: '4px 0' }}>White</td>
                        <td style={{ fontWeight: 600 }}>You</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#888', padding: '4px 0' }}>Black</td>
                        <td style={{ fontWeight: 600 }}>Computer (Stockfish)</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#888', padding: '4px 0' }}>Moves</td>
                        <td>{moves.length}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#888', padding: '4px 0' }}>Status</td>
                        <td>{statusText}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div style={{ marginTop: 16, display: 'flex', gap: 8, flexDirection: 'column' }}>
                    <button
                      type="button"
                      onClick={handleNewGame}
                      style={{ fontSize: 12, width: '100%', padding: '4px 16px' }}
                    >
                      New Game
                    </button>
                    {isGameOver && (
                      <button
                        type="button"
                        onClick={handleAnalysis}
                        style={{ fontSize: 12, width: '100%', padding: '4px 16px' }}
                      >
                        View Analysis
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'music' && <MusicPlayer />}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Neuro HUD */}
      <div className="window" style={{ margin: '0 8px 0', borderTop: '2px solid var(--color-border-dark)' }}>
        <div
          style={{ display: 'flex', alignItems: 'stretch', padding: '8px 16px', gap: 24, fontSize: 11, minHeight: 80 }}
        >
          {/* Left: Webcam + source */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div
              ref={videoContainerRef}
              style={{
                width: 80,
                height: 60,
                overflow: 'hidden',
                borderRadius: 2,
                border: neuro.cameraActive ? '1px solid var(--color-border-dark)' : 'none',
                background: neuro.cameraActive ? '#222' : 'transparent',
                visibility: neuro.cameraActive ? 'visible' : 'hidden',
              }}
            />
            {neuro.source !== 'none' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background:
                      neuro.signalQuality > 0.6
                        ? 'var(--color-analysis-green)'
                        : neuro.signalQuality > 0.3
                          ? 'var(--color-amber)'
                          : 'var(--color-alert)',
                  }}
                />
                <span style={{ fontSize: 10, color: '#888', textTransform: 'uppercase' }}>
                  {neuro.source === 'eeg' ? 'EEG' : neuro.source === 'rppg' ? 'CAM' : 'SIM'}
                </span>
              </div>
            )}
          </div>

          {/* Center: EEG bands or calm/arousal */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
            {neuro.eegConnected && neuro.alphaPower !== null ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <BandBar label="Delta" value={neuro.deltaPower} />
                  <BandBar label="Theta" value={neuro.thetaPower} />
                  <BandBar label="Alpha" value={neuro.alphaPower} />
                  <BandBar label="Beta" value={neuro.betaPower} />
                  <BandBar label="Gamma" value={neuro.gammaPower} />
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    fontSize: 10,
                    color: '#888',
                    minWidth: 100,
                  }}
                >
                  {neuro.calmnessState && (
                    <div>
                      State: <span style={{ color: 'var(--color-text)' }}>{neuro.calmnessState}</span>
                    </div>
                  )}
                  {neuro.alphaPeakFreq !== null && (
                    <div>
                      Alpha Pk: <span style={{ color: 'var(--color-text)' }}>{neuro.alphaPeakFreq.toFixed(1)}Hz</span>
                    </div>
                  )}
                  {neuro.alphaBumpState && neuro.alphaBumpState !== 'unknown' && (
                    <div>
                      Alpha: <span style={{ color: 'var(--color-text)' }}>{neuro.alphaBumpState}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>CALM</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: calmColor(neuro.calm) }}>{calmPct}%</div>
                  <div style={{ fontSize: 9, color: calmColor(neuro.calm) }}>{calmLabel(neuro.calm)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>AROUSAL</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-amber)' }}>{arousalPct}%</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 4, background: '#ddd', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${calmPct}%`,
                        background: calmColor(neuro.calm),
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                  <div style={{ height: 4, background: '#ddd', borderRadius: 2, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${arousalPct}%`,
                        background: 'var(--color-amber)',
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: vitals readouts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#888' }}>HR</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                <span style={{ color: '#c00', fontSize: 12 }}>♥</span> {displayBpm}
              </div>
              <div style={{ fontSize: 9, color: '#aaa' }}>bpm</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#888' }}>HRV</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{displayHrv}</div>
              <div style={{ fontSize: 9, color: '#aaa' }}>ms</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#888' }}>RESP</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{displayResp}</div>
              <div style={{ fontSize: 9, color: '#aaa' }}>/min</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#888' }}>SIG</div>
              <SignalQuality quality={neuro.signalQuality} size={16} />
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
            padding: '3px 12px',
            borderRight: '1px solid #aaa',
            boxShadow: 'inset -1px -1px #fff, inset 1px 1px grey',
          }}
        >
          {statusText}
        </div>
        <div
          style={{
            padding: '3px 12px',
            minWidth: 100,
            borderRight: '1px solid #aaa',
            boxShadow: 'inset -1px -1px #fff, inset 1px 1px grey',
          }}
        >
          Moves: {moves.length}
        </div>
        <div style={{ padding: '3px 12px', minWidth: 140, boxShadow: 'inset -1px -1px #fff, inset 1px 1px grey' }}>
          {neuro.source !== 'none' ? `Calm: ${calmPct}% | Arousal: ${arousalPct}%` : 'No signal'}
        </div>
      </div>
    </div>
  );
}
