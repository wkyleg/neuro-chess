import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, BarChart, Bar, ComposedChart,
} from 'recharts';
import type { MoveRecord, NeuroSnapshot } from '../lib/gameStore';

interface AnalysisData {
  moves: MoveRecord[];
  neuroSnapshots: NeuroSnapshot[];
  result: string;
  date: number;
}

function loadAnalysis(): AnalysisData | null {
  try {
    const raw = sessionStorage.getItem('neuro-chess-analysis');
    if (!raw) return null;
    return JSON.parse(raw) as AnalysisData;
  } catch {
    return null;
  }
}

function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <tr style={{ borderBottom: '1px solid #ddd' }}>
      <td style={{ padding: '6px 12px', color: '#888', fontSize: 12 }}>{label}</td>
      <td style={{ padding: '6px 12px', fontWeight: 700, textAlign: 'right', fontSize: 12, color: color ?? 'inherit' }}>{value}</td>
    </tr>
  );
}

function ChartWindow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="window" style={{ marginBottom: 12 }}>
      <div className="title-bar">
        <div className="title-bar-text">{title}</div>
      </div>
      <div className="window-body" style={{ padding: 16 }}>
        {children}
      </div>
    </div>
  );
}

const chartTooltipStyle = {
  fontSize: 11,
  fontFamily: "'IBM Plex Mono', monospace",
  background: '#fff',
  border: '1px solid #ccc',
};

const axisTick = { fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" };

export function AnalysisPage() {
  const navigate = useNavigate();
  const data = useMemo(loadAnalysis, []);

  if (!data || data.moves.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--color-shell)' }}>
        <div className="window" style={{ width: 400 }}>
          <div className="title-bar">
            <div className="title-bar-text">Analysis</div>
          </div>
          <div className="window-body" style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, marginBottom: 16 }}>
              No game data available. Play a game first.
            </p>
            <button type="button" onClick={() => navigate('/play')} style={{ padding: '4px 16px' }}>Go to Board</button>
          </div>
        </div>
      </div>
    );
  }

  const playerMoves = data.moves.filter((m) => m.side === 'w');
  const snapshots = data.neuroSnapshots ?? [];

  // Stats
  const avgCalm = playerMoves.length > 0
    ? Math.round(playerMoves.reduce((s, m) => s + m.calm, 0) / playerMoves.length * 100)
    : 0;
  const avgArousal = playerMoves.length > 0
    ? Math.round(playerMoves.reduce((s, m) => s + m.arousal, 0) / playerMoves.length * 100)
    : 0;
  const bpmValues = playerMoves.filter((m) => m.bpm !== null).map((m) => m.bpm as number);
  const avgBpm = bpmValues.length > 0 ? Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length) : null;
  const hrvValues = playerMoves.filter((m) => m.hrv !== null).map((m) => m.hrv as number);
  const avgHrv = hrvValues.length > 0 ? Math.round(hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length) : null;

  const calmStart = playerMoves.slice(0, 3).reduce((a, m) => a + m.calm, 0) / Math.max(playerMoves.slice(0, 3).length, 1);
  const calmEnd = playerMoves.slice(-3).reduce((a, m) => a + m.calm, 0) / Math.max(playerMoves.slice(-3).length, 1);
  const calmTrend = calmEnd - calmStart > 0.03 ? 'Improved' : calmEnd - calmStart < -0.03 ? 'Declined' : 'Stable';

  const stressMoves = playerMoves.filter((m) => m.calm < 0.4).length;
  const steadyMoves = playerMoves.filter((m) => m.calm >= 0.7).length;

  let longestCalmStreak = 0;
  let currentStreak = 0;
  for (const m of playerMoves) {
    if (m.calm >= 0.6) { currentStreak++; longestCalmStreak = Math.max(longestCalmStreak, currentStreak); }
    else { currentStreak = 0; }
  }

  const mostStressedIdx = playerMoves.length > 0
    ? playerMoves.reduce((minI, m, i, arr) => m.calm < arr[minI].calm ? i : minI, 0)
    : -1;
  const mostStressedMove = mostStressedIdx >= 0 ? playerMoves[mostStressedIdx] : null;

  const whiteCaptured = 16 - (data.moves.length > 0 ? data.moves[data.moves.length - 1].whitePieces : 16);
  const blackCaptured = 16 - (data.moves.length > 0 ? data.moves[data.moves.length - 1].blackPieces : 16);

  // Thinking time between player moves
  const thinkingTimes: number[] = [];
  for (let i = 0; i < data.moves.length; i++) {
    if (data.moves[i].side === 'w' && i >= 2) {
      const prevPlayerIdx = data.moves.slice(0, i).map((m, j) => m.side === 'w' ? j : -1).filter((j) => j >= 0).pop();
      if (prevPlayerIdx !== undefined) {
        thinkingTimes.push((data.moves[i].time - data.moves[prevPlayerIdx].time) / 1000);
      }
    }
  }

  const resultLabel = (() => {
    if (data.result === 'checkmate') return 'Checkmate';
    if (data.result === 'stalemate') return 'Stalemate';
    if (data.result === 'draw') return 'Draw';
    return data.result;
  })();

  // Chart data
  const calmArousalData = playerMoves.map((m, i) => ({
    move: i + 1, san: m.san,
    calm: Math.round(m.calm * 100),
    arousal: Math.round(m.arousal * 100),
  }));

  const hrTimelineData = playerMoves.filter((m) => m.bpm !== null).map((m, i) => ({
    move: i + 1, bpm: Math.round(m.bpm as number),
    hrv: m.hrv !== null ? Math.round(m.hrv as number) : undefined,
  }));

  const hasEeg = playerMoves.some((m) => m.alphaPower !== null);
  const eegData = hasEeg ? playerMoves.filter((m) => m.alphaPower !== null).map((m, i) => ({
    move: i + 1,
    alpha: +(m.alphaPower ?? 0).toFixed(3),
    beta: +(m.betaPower ?? 0).toFixed(3),
    theta: +(m.thetaPower ?? 0).toFixed(3),
    delta: +(m.deltaPower ?? 0).toFixed(3),
    gamma: +(m.gammaPower ?? 0).toFixed(3),
  })) : [];

  const materialData = data.moves.filter((_, i) => i % 2 === 0 || i === data.moves.length - 1).map((m, i) => ({
    move: i + 1, white: m.whitePieces, black: m.blackPieces,
  }));

  const calmBarData = playerMoves.map((m, i) => ({
    move: i + 1, calm: Math.round(m.calm * 100), san: m.san,
  }));

  const alphaPeakData = hasEeg ? playerMoves.filter((m) => m.alphaPeakFreq !== null).map((m, i) => ({
    move: i + 1, freq: +(m.alphaPeakFreq ?? 0).toFixed(1),
  })) : [];

  const respData = playerMoves.filter((m) => m.respirationRate !== null).map((m, i) => ({
    move: i + 1, rate: +(m.respirationRate ?? 0).toFixed(1),
  }));

  const thinkingData = thinkingTimes.map((t, i) => ({ move: i + 2, seconds: +t.toFixed(1) }));

  // Snapshot-based timeline data
  const snapshotCalmData = snapshots.map((s) => ({
    time: Math.round(s.time), calm: Math.round(s.calm * 100), arousal: Math.round(s.arousal * 100),
  }));

  const snapshotBpmData = snapshots.filter((s) => s.bpm !== null).map((s) => ({
    time: Math.round(s.time), bpm: Math.round(s.bpm as number),
    hrv: s.hrv !== null ? Math.round(s.hrv as number) : undefined,
  }));

  const snapshotEegData = snapshots.filter((s) => s.alphaPower !== null).map((s) => ({
    time: Math.round(s.time),
    alpha: +(s.alphaPower ?? 0).toFixed(3),
    beta: +(s.betaPower ?? 0).toFixed(3),
    theta: +(s.thetaPower ?? 0).toFixed(3),
    delta: +(s.deltaPower ?? 0).toFixed(3),
    gamma: +(s.gammaPower ?? 0).toFixed(3),
  }));

  const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };

  const handleDownload = () => {
    const report = [
      'CHESS ANALYZER — Post-Game Report',
      '='.repeat(40),
      `Date: ${new Date(data.date).toLocaleString()}`,
      `Result: ${resultLabel}`,
      `Total Moves: ${data.moves.length}`,
      `Avg Calm: ${avgCalm}%`,
      `Avg Arousal: ${avgArousal}%`,
      avgBpm !== null ? `Avg HR: ${avgBpm} BPM` : '',
      avgHrv !== null ? `Avg HRV: ${avgHrv} ms` : '',
      `Calm Trend: ${calmTrend}`,
      '',
      'MOVE LOG',
      '-'.repeat(40),
      ...data.moves.map(
        (m, i) => `${String(i + 1).padStart(3)}. ${m.san.padEnd(8)} ${m.side} calm:${m.side === 'w' ? `${Math.round(m.calm * 100)}%` : '--'} W:${m.whitePieces} B:${m.blackPieces}`,
      ),
    ].filter(Boolean).join('\n');

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-analysis-${new Date(data.date).toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-shell)', ...mono }}>
      {/* Menu */}
      <div style={{ display: 'flex', gap: 8, padding: '4px 12px', borderBottom: '1px solid var(--color-border-dark)', fontSize: 13 }}>
        <button type="button" onClick={() => navigate('/')} style={{ padding: '4px 16px' }}>Home</button>
        <button type="button" onClick={() => navigate('/play')} style={{ padding: '4px 16px' }}>New Game</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Summary Stats */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div className="window" style={{ flex: 1 }}>
              <div className="title-bar"><div className="title-bar-text">Game Summary</div></div>
              <div className="window-body" style={{ padding: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <StatRow label="Result" value={resultLabel} />
                    <StatRow label="Total Moves" value={data.moves.length} />
                    <StatRow label="Avg Calm" value={`${avgCalm}%`} color="var(--color-analysis-green)" />
                    <StatRow label="Avg Arousal" value={`${avgArousal}%`} color="var(--color-amber)" />
                    <StatRow label="Calm Trend" value={calmTrend} color={calmTrend === 'Improved' ? 'var(--color-analysis-green)' : calmTrend === 'Declined' ? 'var(--color-alert)' : undefined} />
                    <StatRow label="Steady Moves" value={steadyMoves} color="var(--color-analysis-green)" />
                    <StatRow label="Stressed Moves" value={stressMoves} color="var(--color-alert)" />
                    <StatRow label="Calm Streak" value={`${longestCalmStreak} moves`} />
                  </tbody>
                </table>
              </div>
            </div>

            <div className="window" style={{ flex: 1 }}>
              <div className="title-bar"><div className="title-bar-text">Performance</div></div>
              <div className="window-body" style={{ padding: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {avgBpm !== null && <StatRow label="Avg Heart Rate" value={`${avgBpm} BPM`} />}
                    {avgHrv !== null && <StatRow label="Avg HRV" value={`${avgHrv} ms`} />}
                    <StatRow label="White Lost" value={`${whiteCaptured} pieces`} />
                    <StatRow label="Black Lost" value={`${blackCaptured} pieces`} />
                    {mostStressedMove && (
                      <StatRow
                        label="Most Stressed"
                        value={`${mostStressedMove.san} (${Math.round(mostStressedMove.calm * 100)}%)`}
                        color="var(--color-alert)"
                      />
                    )}
                    {thinkingTimes.length > 0 && (
                      <StatRow
                        label="Avg Think Time"
                        value={`${(thinkingTimes.reduce((a, b) => a + b, 0) / thinkingTimes.length).toFixed(1)}s`}
                      />
                    )}
                  </tbody>
                </table>
                <button type="button" onClick={handleDownload} style={{ marginTop: 12, width: '100%', padding: '4px 16px', fontSize: 11 }}>
                  Download Report (.txt)
                </button>
              </div>
            </div>
          </div>

          {/* Chart 1: Calm + Arousal per move */}
          {calmArousalData.length > 1 && (
            <ChartWindow title="Calm + Arousal — Per Move">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={calmArousalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                  <XAxis dataKey="move" tick={axisTick} />
                  <YAxis domain={[0, 100]} tick={axisTick} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={chartTooltipStyle} labelFormatter={(v) => `Move ${v}`} />
                  <Line type="monotone" dataKey="calm" stroke="var(--color-analysis-green)" strokeWidth={2} dot={{ r: 2 }} name="Calm %" />
                  <Line type="monotone" dataKey="arousal" stroke="var(--color-amber)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Arousal %" />
                </LineChart>
              </ResponsiveContainer>
            </ChartWindow>
          )}

          {/* Chart 2: Calm bar per move */}
          {calmBarData.length > 1 && (
            <ChartWindow title="Calm Level at Each Move">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={calmBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                  <XAxis dataKey="move" tick={axisTick} />
                  <YAxis domain={[0, 100]} tick={axisTick} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={chartTooltipStyle} labelFormatter={(v) => `Move ${v}`} />
                  <Bar dataKey="calm" name="Calm %" fill="var(--color-analysis-green)" opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </ChartWindow>
          )}

          {/* Chart 3: Heart Rate + HRV per move */}
          {hrTimelineData.length > 1 && (
            <ChartWindow title="Heart Rate + HRV — Per Move">
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={hrTimelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                  <XAxis dataKey="move" tick={axisTick} />
                  <YAxis yAxisId="bpm" tick={axisTick} />
                  <YAxis yAxisId="hrv" orientation="right" tick={axisTick} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line yAxisId="bpm" type="monotone" dataKey="bpm" stroke="#c00" strokeWidth={2} dot={{ r: 2 }} name="Heart Rate" />
                  {hrTimelineData.some((d) => d.hrv !== undefined) && (
                    <Line yAxisId="hrv" type="monotone" dataKey="hrv" stroke="var(--color-accent)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="HRV (ms)" />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </ChartWindow>
          )}

          {/* Chart 4: Material balance */}
          {materialData.length > 1 && (
            <ChartWindow title="Material Balance — Pieces Over Game">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={materialData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                  <XAxis dataKey="move" tick={axisTick} />
                  <YAxis domain={[0, 16]} tick={axisTick} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line type="stepAfter" dataKey="white" stroke="var(--color-analysis-green)" strokeWidth={2} name="White Pieces" />
                  <Line type="stepAfter" dataKey="black" stroke="var(--color-alert)" strokeWidth={2} name="Black Pieces" />
                </LineChart>
              </ResponsiveContainer>
            </ChartWindow>
          )}

          {/* Chart 5: Thinking time */}
          {thinkingData.length > 1 && (
            <ChartWindow title="Thinking Time — Between Moves">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={thinkingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                  <XAxis dataKey="move" tick={axisTick} />
                  <YAxis tick={axisTick} tickFormatter={(v) => `${v}s`} />
                  <Tooltip contentStyle={chartTooltipStyle} labelFormatter={(v) => `Move ${v}`} />
                  <Bar dataKey="seconds" name="Think Time (s)" fill="var(--color-rack-gray)" opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </ChartWindow>
          )}

          {/* Chart 6: EEG Band Powers per move */}
          {eegData.length > 1 && (
            <ChartWindow title="EEG Band Powers — Per Move">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={eegData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                  <XAxis dataKey="move" tick={axisTick} />
                  <YAxis tick={axisTick} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line type="monotone" dataKey="alpha" stroke="var(--color-analysis-green)" strokeWidth={2} dot={false} name="Alpha" />
                  <Line type="monotone" dataKey="beta" stroke="#c00" strokeWidth={2} dot={false} name="Beta" />
                  <Line type="monotone" dataKey="theta" stroke="var(--color-accent)" strokeWidth={1.5} dot={false} name="Theta" />
                  <Line type="monotone" dataKey="delta" stroke="var(--color-amber)" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Delta" />
                  <Line type="monotone" dataKey="gamma" stroke="#888" strokeWidth={1} strokeDasharray="2 4" dot={false} name="Gamma" />
                </LineChart>
              </ResponsiveContainer>
            </ChartWindow>
          )}

          {/* Chart 7: Alpha Peak Frequency */}
          {alphaPeakData.length > 1 && (
            <ChartWindow title="Alpha Peak Frequency — Per Move">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={alphaPeakData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                  <XAxis dataKey="move" tick={axisTick} />
                  <YAxis tick={axisTick} tickFormatter={(v) => `${v}Hz`} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line type="monotone" dataKey="freq" stroke="var(--color-analysis-green)" strokeWidth={2} dot={{ r: 2 }} name="Alpha Peak Hz" />
                </LineChart>
              </ResponsiveContainer>
            </ChartWindow>
          )}

          {/* Chart 8: Respiration Rate */}
          {respData.length > 1 && (
            <ChartWindow title="Respiration Rate — Per Move">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={respData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                  <XAxis dataKey="move" tick={axisTick} />
                  <YAxis tick={axisTick} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area type="monotone" dataKey="rate" stroke="var(--color-analysis-green)" fill="var(--color-analysis-green)" fillOpacity={0.1} strokeWidth={2} name="Breaths/min" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartWindow>
          )}

          {/* Snapshot-based timeline charts (if snapshots available) */}
          {snapshotCalmData.length > 2 && (
            <ChartWindow title="Neural Timeline — Over Session (Real-Time)">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={snapshotCalmData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                  <XAxis dataKey="time" tick={axisTick} tickFormatter={(v) => `${v}s`} />
                  <YAxis domain={[0, 100]} tick={axisTick} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={chartTooltipStyle} labelFormatter={(v) => `${v}s`} />
                  <Line type="monotone" dataKey="calm" stroke="var(--color-analysis-green)" strokeWidth={2} dot={false} name="Calm" />
                  <Line type="monotone" dataKey="arousal" stroke="var(--color-amber)" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Arousal" />
                </LineChart>
              </ResponsiveContainer>
            </ChartWindow>
          )}

          {snapshotBpmData.length > 2 && (
            <ChartWindow title="Heart Rate Timeline — Over Session">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={snapshotBpmData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                  <XAxis dataKey="time" tick={axisTick} tickFormatter={(v) => `${v}s`} />
                  <YAxis tick={axisTick} />
                  <Tooltip contentStyle={chartTooltipStyle} labelFormatter={(v) => `${v}s`} />
                  <Area type="monotone" dataKey="bpm" stroke="#c00" fill="#c00" fillOpacity={0.08} strokeWidth={2} name="BPM" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartWindow>
          )}

          {snapshotEegData.length > 2 && (
            <ChartWindow title="EEG Band Powers — Over Session (Real-Time)">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={snapshotEegData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                  <XAxis dataKey="time" tick={axisTick} tickFormatter={(v) => `${v}s`} />
                  <YAxis tick={axisTick} />
                  <Tooltip contentStyle={chartTooltipStyle} labelFormatter={(v) => `${v}s`} />
                  <Line type="monotone" dataKey="alpha" stroke="var(--color-analysis-green)" strokeWidth={2} dot={false} name="Alpha" />
                  <Line type="monotone" dataKey="beta" stroke="#c00" strokeWidth={2} dot={false} name="Beta" />
                  <Line type="monotone" dataKey="theta" stroke="var(--color-accent)" strokeWidth={1.5} dot={false} name="Theta" />
                  <Line type="monotone" dataKey="delta" stroke="var(--color-amber)" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Delta" />
                  <Line type="monotone" dataKey="gamma" stroke="#888" strokeWidth={1} strokeDasharray="2 4" dot={false} name="Gamma" />
                </LineChart>
              </ResponsiveContainer>
            </ChartWindow>
          )}

          {/* Move detail table */}
          <div className="window" style={{ marginBottom: 12 }}>
            <div className="title-bar"><div className="title-bar-text">Move Detail</div></div>
            <div className="window-body" style={{ padding: 0, maxHeight: 400, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f0ede6', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>#</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>Move</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>Side</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Calm</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Arousal</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>HR</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>W/B</th>
                  </tr>
                </thead>
                <tbody>
                  {data.moves.map((m, i) => (
                    <tr key={m.time} style={{ borderBottom: '1px solid #eee', background: m.side === 'w' && m.calm < 0.4 ? '#fef2f2' : undefined }}>
                      <td style={{ padding: '4px 8px', color: '#aaa' }}>{i + 1}</td>
                      <td style={{ padding: '4px 8px', fontWeight: 600 }}>{m.san}</td>
                      <td style={{ padding: '4px 8px', color: '#888' }}>{m.side === 'w' ? 'W' : 'B'}</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', color: m.side === 'w' ? (m.calm >= 0.7 ? 'var(--color-analysis-green)' : m.calm >= 0.4 ? 'var(--color-amber)' : 'var(--color-alert)') : '#ccc', fontWeight: 600 }}>
                        {m.side === 'w' ? `${Math.round(m.calm * 100)}%` : '—'}
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', color: m.side === 'w' ? 'var(--color-amber)' : '#ccc' }}>
                        {m.side === 'w' ? `${Math.round(m.arousal * 100)}%` : '—'}
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', color: '#888' }}>
                        {m.bpm !== null ? Math.round(m.bpm) : '—'}
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', color: '#888', fontSize: 10 }}>
                        {m.whitePieces}/{m.blackPieces}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
