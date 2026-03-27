import { useNavigate } from 'react-router';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--color-shell)' }}>
      <div className="window" style={{ width: 420 }}>
        <div className="title-bar">
          <div className="title-bar-text">Chess Analyzer.exe</div>
        </div>
        <div className="window-body" style={{ padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, marginBottom: 8 }}>
            CHESS ANALYZER
          </h1>
          <p style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>
            Composure-tracking chess training workstation
          </p>
          <button type="button" onClick={() => navigate('/play')}>
            Launch
          </button>
        </div>
      </div>
    </div>
  );
}
