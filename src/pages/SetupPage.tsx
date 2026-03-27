import { useNavigate } from 'react-router';
import { DeviceConnect } from '../components/DeviceConnect';

export function SetupPage() {
  const navigate = useNavigate();

  const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'var(--color-shell)', ...mono }}
    >
      <div className="window" style={{ width: 500 }}>
        <div className="title-bar">
          <div className="title-bar-text">Device Setup</div>
        </div>
        <div className="window-body" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
            Connect Your Sensors
          </h2>
          <p style={{ fontSize: 12, color: '#555', marginBottom: 20, lineHeight: 1.6 }}>
            Connect your webcam or EEG headband to track neural and physiological
            signals during your chess game. This data powers real-time feedback
            and post-game analysis.
          </p>

          <DeviceConnect
            onReady={() => navigate('/play')}
            showSkip
            onSkip={() => navigate('/play')}
          />
        </div>
      </div>
    </div>
  );
}
