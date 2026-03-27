import { useRef, useState } from 'react';

interface Track {
  title: string;
  composer: string;
  file: string;
}

const TRACKS: Track[] = [
  { title: 'Prelude No. 1 in C Major, BWV 846', composer: 'J.S. Bach', file: 'bach-prelude-c-major.mp3' },
  { title: 'Für Elise', composer: 'L. van Beethoven', file: 'beethoven-fur-elise.mp3' },
  { title: 'Moonlight Sonata, Op. 27 No. 2', composer: 'L. van Beethoven', file: 'beethoven-moonlight-sonata.mp3' },
  { title: 'Nocturne Op. 9 No. 1 in B♭ minor', composer: 'F. Chopin', file: 'chopin-nocturne-op9-no1.mp3' },
  { title: 'Waltz in D♭ Major', composer: 'F. Chopin', file: 'chopin-waltz-d-flat.mp3' },
  { title: 'Rêverie', composer: 'C. Debussy', file: 'debussy-reverie.mp3' },
  { title: 'Arabesque No. 1', composer: 'C. Debussy', file: 'debussy-arabesque-1.mp3' },
  { title: 'Danse Bohémienne', composer: 'C. Debussy', file: 'debussy-danse-bohemienne.mp3' },
  { title: 'Gymnopédie No. 1', composer: 'E. Satie', file: 'satie-gymnopedie-1.mp3' },
  { title: 'Prelude, Op. 12 No. 7', composer: 'S. Prokofiev', file: 'prokofiev-prelude-op12.mp3' },
];

function getMusicUrl(file: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}music/${file}`;
}

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const play = (idx: number) => {
    setCurrentIdx(idx);
    setPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = getMusicUrl(TRACKS[idx].file);
      audioRef.current.volume = volume;
      audioRef.current.play().catch(() => {});
    }
  };

  const toggle = () => {
    if (!audioRef.current || currentIdx === null) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  const next = () => {
    const nextIdx = currentIdx !== null ? (currentIdx + 1) % TRACKS.length : 0;
    play(nextIdx);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number.parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const handleEnded = () => {
    next();
  };

  return (
    <div style={{ padding: 12, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>
      {/* biome-ignore lint/a11y/useMediaCaption: instrumental music needs no captions */}
      <audio ref={audioRef} onEnded={handleEnded} />

      <div style={{ marginBottom: 12, fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
        Classical Piano
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>
        {TRACKS.map((track, i) => (
          <button
            key={track.file}
            type="button"
            onClick={() => play(i)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              fontSize: 11,
              textAlign: 'left',
              background: currentIdx === i ? 'var(--color-accent)' : 'transparent',
              color: currentIdx === i ? '#fff' : 'var(--color-text)',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <span style={{ opacity: 0.5, width: 14, flexShrink: 0, fontSize: 10 }}>
              {currentIdx === i && playing ? '▶' : `${i + 1}.`}
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {track.title}
            </span>
            <span style={{ opacity: 0.4, fontSize: 9, flexShrink: 0 }}>{track.composer}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
        <button type="button" onClick={toggle} style={{ padding: '2px 12px', fontSize: 11 }}>
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <button type="button" onClick={next} style={{ padding: '2px 12px', fontSize: 11 }}>
          ⏭ Next
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <span style={{ fontSize: 10, color: '#888' }}>Vol</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={handleVolumeChange}
          style={{ flex: 1 }}
        />
      </div>

      {currentIdx !== null && (
        <div style={{ padding: 8, background: '#f0ede6', border: '1px solid #ddd', fontSize: 10 }}>
          <div style={{ color: '#888', marginBottom: 2 }}>NOW PLAYING</div>
          <div style={{ fontWeight: 600 }}>{TRACKS[currentIdx].title}</div>
          <div style={{ color: '#666' }}>{TRACKS[currentIdx].composer}</div>
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 9, color: '#aaa', lineHeight: 1.4 }}>
        Public domain recordings from the Internet Archive.
      </div>
    </div>
  );
}
