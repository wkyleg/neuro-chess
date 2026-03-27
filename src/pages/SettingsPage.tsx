import { useNavigate } from 'react-router';
import { DeviceConnect } from '../components/DeviceConnect';
import { useGameStore } from '../lib/gameStore';
import { useNeuroConnection } from '../neuro/hooks';

const DIFFICULTIES: Array<{ value: 'easy' | 'medium' | 'hard'; label: string }> = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const { mockEnabled, enableMock, disableMock } = useNeuroConnection();
  const difficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);

  const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-shell)', ...mono }}>
      {/* Menu */}
      <div
        style={{
          display: 'flex', gap: 8,
          padding: '4px 12px',
          borderBottom: '1px solid var(--color-border-dark)',
          fontSize: 13,
        }}
      >
        <button type="button" onClick={() => navigate(-1)} style={{ padding: '4px 16px' }}>← Back</button>
        <button type="button" onClick={() => navigate('/')} style={{ padding: '4px 16px' }}>Home</button>
      </div>

      <div
        style={{
          flex: 1, overflow: 'auto', padding: 24,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 16, maxWidth: 600, margin: '0 auto', width: '100%',
        }}
      >
        {/* Difficulty */}
        <div className="window" style={{ width: '100%' }}>
          <div className="title-bar">
            <div className="title-bar-text">Difficulty</div>
          </div>
          <div className="window-body" style={{ padding: 20 }}>
            <fieldset style={{ padding: '12px 16px' }}>
              <legend>Computer opponent strength</legend>
              <div style={{ display: 'flex', gap: 8, padding: '12px 0' }}>
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDifficulty(d.value)}
                    style={{
                      padding: '6px 20px', fontSize: 13, cursor: 'pointer',
                      fontWeight: difficulty === d.value ? 700 : 400,
                      background: difficulty === d.value ? 'var(--color-accent)' : undefined,
                      color: difficulty === d.value ? '#fff' : undefined,
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                Powered by Stockfish 16 chess engine.
              </p>
            </fieldset>
          </div>
        </div>

        {/* Mock/Live toggle */}
        <div className="window" style={{ width: '100%' }}>
          <div className="title-bar">
            <div className="title-bar-text">Signal Mode</div>
          </div>
          <div className="window-body" style={{ padding: 20 }}>
            <fieldset style={{ padding: '12px 16px' }}>
              <legend>Mock / Live signals</legend>
              <div style={{ display: 'flex', gap: 8, padding: '12px 0' }}>
                <button
                  type="button"
                  onClick={() => disableMock()}
                  style={{
                    padding: '6px 20px', fontSize: 13, cursor: 'pointer',
                    fontWeight: !mockEnabled ? 700 : 400,
                    background: !mockEnabled ? 'var(--color-accent)' : undefined,
                    color: !mockEnabled ? '#fff' : undefined,
                  }}
                >
                  Live (Device)
                </button>
                <button
                  type="button"
                  onClick={() => enableMock()}
                  style={{
                    padding: '6px 20px', fontSize: 13, cursor: 'pointer',
                    fontWeight: mockEnabled ? 700 : 400,
                    background: mockEnabled ? 'var(--color-accent)' : undefined,
                    color: mockEnabled ? '#fff' : undefined,
                  }}
                >
                  Simulated (Mock)
                </button>
              </div>
            </fieldset>
          </div>
        </div>

        {/* Device connect */}
        <div className="window" style={{ width: '100%' }}>
          <div className="title-bar">
            <div className="title-bar-text">Device Connection</div>
          </div>
          <div className="window-body" style={{ padding: 20 }}>
            <DeviceConnect showSkip={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
