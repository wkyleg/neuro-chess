import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MoveRecord } from '../lib/gameStore';

interface AnalysisData {
  moves: MoveRecord[];
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

export function AnalysisPage() {
  const navigate = useNavigate();
  const data = useMemo(loadAnalysis, []);

  if (!data || data.moves.length === 0) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: 'var(--color-shell)' }}
      >
        <div className="window" style={{ width: 400 }}>
          <div className="title-bar">
            <div className="title-bar-text">Analysis</div>
          </div>
          <div className="window-body" style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, marginBottom: 16 }}>
              No game data available.
              <br />
              Play a game first to see your analysis.
            </p>
            <button type="button" onClick={() => navigate('/play')}>
              Go to Board
            </button>
          </div>
        </div>
      </div>
    );
  }

  const playerMoves = data.moves.filter((m) => m.composure >= 0);
  const chartData = playerMoves.map((m, i) => ({
    move: i + 1,
    label: m.san,
    composure: Math.round(m.composure * 100),
  }));

  const avgComposure = playerMoves.length > 0
    ? Math.round(playerMoves.reduce((sum, m) => sum + m.composure, 0) / playerMoves.length * 100)
    : 0;
  const stressMoves = playerMoves.filter((m) => m.composure < 0.4).length;
  const steadyMoves = playerMoves.filter((m) => m.composure >= 0.7).length;
  const minComposure = playerMoves.length > 0
    ? Math.round(Math.min(...playerMoves.map((m) => m.composure)) * 100)
    : 0;
  const maxComposure = playerMoves.length > 0
    ? Math.round(Math.max(...playerMoves.map((m) => m.composure)) * 100)
    : 0;

  const resultLabel = (() => {
    if (data.result === 'checkmate') return 'Checkmate';
    if (data.result === 'stalemate') return 'Stalemate';
    if (data.result === 'draw') return 'Draw';
    return data.result;
  })();

  const handleDownload = () => {
    const report = [
      'CHESS ANALYZER — Post-Game Report',
      '='.repeat(40),
      `Date: ${new Date(data.date).toLocaleString()}`,
      `Result: ${resultLabel}`,
      `Total Moves: ${data.moves.length}`,
      '',
      'COMPOSURE SUMMARY',
      '-'.repeat(40),
      `Average Composure: ${avgComposure}%`,
      `Min Composure: ${minComposure}%`,
      `Max Composure: ${maxComposure}%`,
      `Steady Moves (≥70%): ${steadyMoves}`,
      `Stressed Moves (<40%): ${stressMoves}`,
      '',
      'MOVE LOG',
      '-'.repeat(40),
      ...data.moves.map(
        (m, i) =>
          `${String(i + 1).padStart(3)}. ${m.san.padEnd(8)} composure: ${m.composure >= 0 ? `${Math.round(m.composure * 100)}%` : 'cpu'}`,
      ),
    ].join('\n');

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-analysis-${new Date(data.date).toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-shell)', ...mono }}>
      {/* Menu */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '2px 8px',
          borderBottom: '1px solid var(--color-border-dark)',
          fontSize: 12,
        }}
      >
        <button type="button" onClick={() => navigate('/')} style={{ fontSize: 12 }}>
          Home
        </button>
        <button type="button" onClick={() => navigate('/play')} style={{ fontSize: 12 }}>
          New Game
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {/* Timeline chart */}
        <div className="window" style={{ marginBottom: 8 }}>
          <div className="title-bar">
            <div className="title-bar-text">Composure Timeline — Move by Move</div>
          </div>
          <div className="window-body" style={{ padding: 16 }}>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                  <XAxis dataKey="move" tick={{ fontSize: 10 }} label={{ value: 'Move #', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: 'Composure %', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Composure']}
                    labelFormatter={(label: number) => {
                      const m = chartData.find((d) => d.move === label);
                      return m ? `Move ${label}: ${m.label}` : `Move ${label}`;
                    }}
                    contentStyle={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="composure"
                    stroke="var(--color-analysis-green)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'var(--color-analysis-green)' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ fontSize: 12, color: '#888', textAlign: 'center', padding: 20 }}>
                Not enough player moves to chart.
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {/* Summary stats */}
          <div className="window" style={{ flex: 1 }}>
            <div className="title-bar">
              <div className="title-bar-text">Summary Statistics</div>
            </div>
            <div className="window-body" style={{ padding: 16, fontSize: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '6px 0', color: '#888' }}>Result</td>
                    <td style={{ padding: '6px 0', fontWeight: 700, textAlign: 'right' }}>{resultLabel}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '6px 0', color: '#888' }}>Total Moves</td>
                    <td style={{ padding: '6px 0', fontWeight: 700, textAlign: 'right' }}>{data.moves.length}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '6px 0', color: '#888' }}>Avg Composure</td>
                    <td style={{ padding: '6px 0', fontWeight: 700, textAlign: 'right', color: 'var(--color-analysis-green)' }}>
                      {avgComposure}%
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '6px 0', color: '#888' }}>Min / Max</td>
                    <td style={{ padding: '6px 0', fontWeight: 700, textAlign: 'right' }}>
                      {minComposure}% / {maxComposure}%
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '6px 0', color: '#888' }}>Steady Moves (≥70%)</td>
                    <td style={{ padding: '6px 0', fontWeight: 700, textAlign: 'right', color: 'var(--color-analysis-green)' }}>
                      {steadyMoves}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0', color: '#888' }}>Stressed Moves (&lt;40%)</td>
                    <td style={{ padding: '6px 0', fontWeight: 700, textAlign: 'right', color: 'var(--color-alert)' }}>
                      {stressMoves}
                    </td>
                  </tr>
                </tbody>
              </table>

              <button
                type="button"
                onClick={handleDownload}
                style={{ marginTop: 16, width: '100%', fontSize: 11 }}
              >
                📄 Download Report (.txt)
              </button>
            </div>
          </div>

          {/* Move detail list */}
          <div className="window" style={{ flex: 1 }}>
            <div className="title-bar">
              <div className="title-bar-text">Move Detail</div>
            </div>
            <div className="window-body" style={{ padding: 0, maxHeight: 300, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f0f0f0', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '4px 8px', textAlign: 'left' }}>#</th>
                    <th style={{ padding: '4px 8px', textAlign: 'left' }}>Move</th>
                    <th style={{ padding: '4px 8px', textAlign: 'left' }}>Side</th>
                    <th style={{ padding: '4px 8px', textAlign: 'right' }}>Composure</th>
                  </tr>
                </thead>
                <tbody>
                  {data.moves.map((m, i) => (
                    <tr key={m.time} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '3px 8px', color: '#aaa' }}>{i + 1}</td>
                      <td style={{ padding: '3px 8px', fontWeight: 600 }}>{m.san}</td>
                      <td style={{ padding: '3px 8px', color: '#888' }}>{i % 2 === 0 ? 'W' : 'B'}</td>
                      <td style={{ padding: '3px 8px', textAlign: 'right' }}>
                        {m.composure >= 0 ? (
                          <span
                            style={{
                              color: m.composure >= 0.7
                                ? 'var(--color-analysis-green)'
                                : m.composure >= 0.4
                                  ? 'var(--color-amber)'
                                  : 'var(--color-alert)',
                              fontWeight: 600,
                            }}
                          >
                            {Math.round(m.composure * 100)}%
                          </span>
                        ) : (
                          <span style={{ color: '#ccc' }}>—</span>
                        )}
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
