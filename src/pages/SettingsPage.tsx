import { useNavigate } from 'react-router';
import { DeviceConnect } from '../components/DeviceConnect';
import { useGameStore } from '../lib/gameStore';
import { useNeuroConnection } from '../neuro/hooks';

const THEMES = ['default', 'marble', 'wood', 'tournament', 'midnight'];
const DIFFICULTIES: Array<{ value: 'easy' | 'medium' | 'hard'; label: string }> = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const { mockEnabled, enableMock, disableMock } = useNeuroConnection();
  const difficulty = useGameStore((s) => s.difficulty);
  const boardTheme = useGameStore((s) => s.boardTheme);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const setBoardTheme = useGameStore((s) => s.setBoardTheme);

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
        <button type="button" onClick={() => navigate(-1)} style={{ fontSize: 12 }}>
          ← Back
        </button>
        <button type="button" onClick={() => navigate('/')} style={{ fontSize: 12 }}>
          Home
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          maxWidth: 640,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Board theme */}
        <div className="window" style={{ width: '100%' }}>
          <div className="title-bar">
            <div className="title-bar-text">Board Theme</div>
          </div>
          <div className="window-body" style={{ padding: 16 }}>
            <fieldset>
              <legend>Select board appearance</legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' }}>
                {THEMES.map((t) => (
                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="theme"
                      checked={boardTheme === t}
                      onChange={() => setBoardTheme(t)}
                    />
                    <span style={{ textTransform: 'capitalize' }}>{t}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        {/* Difficulty */}
        <div className="window" style={{ width: '100%' }}>
          <div className="title-bar">
            <div className="title-bar-text">Difficulty</div>
          </div>
          <div className="window-body" style={{ padding: 16 }}>
            <fieldset>
              <legend>Computer opponent strength</legend>
              <div style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
                {DIFFICULTIES.map((d) => (
                  <label key={d.value} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="difficulty"
                      checked={difficulty === d.value}
                      onChange={() => setDifficulty(d.value)}
                    />
                    {d.label}
                  </label>
                ))}
              </div>
              <p style={{ fontSize: 10, color: '#888', marginTop: 4 }}>
                Currently uses random move engine. Stockfish integration coming soon.
              </p>
            </fieldset>
          </div>
        </div>

        {/* Mock/Live toggle */}
        <div className="window" style={{ width: '100%' }}>
          <div className="title-bar">
            <div className="title-bar-text">Signal Mode</div>
          </div>
          <div className="window-body" style={{ padding: 16 }}>
            <fieldset>
              <legend>Mock / Live signals</legend>
              <div style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="signalMode"
                    checked={!mockEnabled}
                    onChange={() => disableMock()}
                  />
                  Live (Device)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="signalMode"
                    checked={mockEnabled}
                    onChange={() => enableMock()}
                  />
                  Simulated (Mock)
                </label>
              </div>
            </fieldset>
          </div>
        </div>

        {/* Device connect */}
        <div className="window" style={{ width: '100%' }}>
          <div className="title-bar">
            <div className="title-bar-text">Device Connection</div>
          </div>
          <div className="window-body" style={{ padding: 16 }}>
            <DeviceConnect showSkip={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
