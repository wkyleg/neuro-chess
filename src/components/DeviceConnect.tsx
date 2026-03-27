import { useNeuroConnection } from '../neuro/hooks';

interface DeviceConnectProps {
  onReady?: () => void;
  showSkip?: boolean;
  onSkip?: () => void;
}

export function DeviceConnect({ onReady, showSkip = true, onSkip }: DeviceConnectProps) {
  const {
    eegConnected,
    cameraActive,
    wasmReady,
    connecting,
    error,
    connectHeadband,
    enableCamera,
    enableMock,
  } = useNeuroConnection();

  const hasConnection = eegConnected || cameraActive;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <fieldset style={{ padding: '12px 16px' }}>
        <legend>Webcam</legend>
        <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Heart rate and HRV via facial video analysis</p>
        {cameraActive ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-analysis-green)', fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-analysis-green)', display: 'inline-block' }} />
            Camera connected
          </div>
        ) : (
          <button
            type="button"
            onClick={() => enableCamera()}
            disabled={connecting.camera}
            style={{ padding: '4px 16px', fontSize: 12 }}
          >
            {connecting.camera ? 'Connecting...' : 'Enable Camera'}
          </button>
        )}
        {error.camera && <p style={{ fontSize: 12, color: 'var(--color-alert)', marginTop: 6 }}>{error.camera}</p>}
      </fieldset>

      {wasmReady && (
        <fieldset style={{ padding: '12px 16px' }}>
          <legend>EEG Headband</legend>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Brain wave analysis via Bluetooth headband</p>
          {eegConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-analysis-green)', fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-analysis-green)', display: 'inline-block' }} />
              Headband connected
            </div>
          ) : (
            <button
              type="button"
              onClick={() => connectHeadband()}
              disabled={connecting.eeg}
              style={{ padding: '4px 16px', fontSize: 12 }}
            >
              {connecting.eeg ? 'Scanning...' : 'Connect Headband'}
            </button>
          )}
          {error.eeg && <p style={{ fontSize: 12, color: 'var(--color-alert)', marginTop: 6 }}>{error.eeg}</p>}
          <p style={{ fontSize: 10, color: '#888', marginTop: 8 }}>Requires Chrome or Edge with Web Bluetooth enabled</p>
        </fieldset>
      )}

      {import.meta.env.DEV && (
        <button
          type="button"
          onClick={() => enableMock()}
          style={{ fontSize: 11, padding: '4px 16px', alignSelf: 'flex-start' }}
        >
          Enable simulated signals (dev)
        </button>
      )}

      {(hasConnection && onReady) || (showSkip && onSkip) ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {hasConnection && onReady && (
            <button type="button" onClick={onReady} style={{ flex: 1, padding: '4px 16px', fontSize: 12 }}>
              Continue
            </button>
          )}
          {showSkip && onSkip && (
            <button type="button" onClick={onSkip} style={{ padding: '4px 16px', fontSize: 12 }}>
              Skip
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
