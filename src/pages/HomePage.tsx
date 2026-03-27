import { useNavigate } from 'react-router';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'var(--color-shell)' }}
    >
      <div className="window" style={{ width: 460 }}>
        <div className="title-bar">
          <div className="title-bar-text">Chess Analyzer v1.0</div>
        </div>
        <div className="window-body" style={{ padding: 32, textAlign: 'center' }}>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: 'var(--color-accent)',
              letterSpacing: 3,
              marginBottom: 8,
              textTransform: 'uppercase',
            }}
          >
            Elata Biosciences
          </div>
          <h1
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 4,
              color: 'var(--color-text)',
            }}
          >
            CHESS ANALYZER
          </h1>
          <div
            style={{
              width: 48,
              height: 2,
              background: 'var(--color-accent)',
              margin: '8px auto 16px',
            }}
          />
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              color: '#666',
              lineHeight: 1.7,
              marginBottom: 32,
              maxWidth: 340,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Neuro-physiological analysis meets strategic play.
            <br />
            Monitor your mind while you move.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button type="button" onClick={() => navigate('/play')} style={{ minWidth: 120, padding: '6px 24px' }}>
              ▶ Launch
            </button>
            <button type="button" onClick={() => navigate('/settings')} style={{ minWidth: 120, padding: '6px 24px' }}>
              ⚙ Settings
            </button>
          </div>

          <div
            style={{
              marginTop: 24,
              fontSize: 10,
              color: '#999',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            Build {new Date().toISOString().slice(0, 10).replace(/-/g, '')} · SDK v0.1
          </div>
        </div>
      </div>
    </div>
  );
}
