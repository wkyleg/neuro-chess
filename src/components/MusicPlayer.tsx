import { useRef, useState } from 'react';

interface Track {
  title: string;
  artist: string;
  url: string;
}

const TRACKS: Track[] = [
  {
    title: 'Opening / Pawn Storm',
    artist: 'Karpov Not Kasparov',
    url: 'https://freemusicarchive.org/file/music/WFMU/Karpov_Not_Kasparov/Soundtrack_For_A_Game_Of_Chess/Karpov_Not_Kasparov_-_01_-_OpeningPawn_Storm.mp3',
  },
  {
    title: 'Kaissa',
    artist: 'Karpov Not Kasparov',
    url: 'https://freemusicarchive.org/file/music/WFMU/Karpov_Not_Kasparov/Soundtrack_For_A_Game_Of_Chess/Karpov_Not_Kasparov_-_02_-_Kaissa.mp3',
  },
  {
    title: 'The Trouble With Time',
    artist: 'Karpov Not Kasparov',
    url: 'https://freemusicarchive.org/file/music/WFMU/Karpov_Not_Kasparov/Soundtrack_For_A_Game_Of_Chess/Karpov_Not_Kasparov_-_03_-_The_Trouble_With_Time.mp3',
  },
  {
    title: 'Mechanical Turk',
    artist: 'Karpov Not Kasparov',
    url: 'https://freemusicarchive.org/file/music/WFMU/Karpov_Not_Kasparov/Soundtrack_For_A_Game_Of_Chess/Karpov_Not_Kasparov_-_04_-_Mechanical_Turk.mp3',
  },
  {
    title: 'Deep Fritz',
    artist: 'Karpov Not Kasparov',
    url: 'https://freemusicarchive.org/file/music/WFMU/Karpov_Not_Kasparov/Soundtrack_For_A_Game_Of_Chess/Karpov_Not_Kasparov_-_05_-_Deep_Fritz.mp3',
  },
];

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const play = (idx: number) => {
    setCurrentIdx(idx);
    setPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = TRACKS[idx].url;
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
      <audio ref={audioRef} onEnded={handleEnded} />

      <div style={{ marginBottom: 12, fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
        Soundtrack for a Game of Chess
      </div>

      {/* Track list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>
        {TRACKS.map((track, i) => (
          <button
            key={track.title}
            type="button"
            onClick={() => play(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 8px', fontSize: 11, textAlign: 'left',
              background: currentIdx === i ? 'var(--color-accent)' : 'transparent',
              color: currentIdx === i ? '#fff' : 'var(--color-text)',
              border: 'none', cursor: 'pointer', width: '100%',
            }}
          >
            <span style={{ opacity: 0.5, width: 14, flexShrink: 0 }}>
              {currentIdx === i && playing ? '▶' : `${i + 1}.`}
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {track.title}
            </span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
        <button type="button" onClick={toggle} style={{ padding: '2px 12px', fontSize: 11 }}>
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <button type="button" onClick={next} style={{ padding: '2px 12px', fontSize: 11 }}>
          ⏭ Next
        </button>
      </div>

      {/* Volume */}
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

      {/* Now playing */}
      {currentIdx !== null && (
        <div style={{ padding: 8, background: '#f0ede6', border: '1px solid #ddd', fontSize: 10 }}>
          <div style={{ color: '#888', marginBottom: 2 }}>NOW PLAYING</div>
          <div style={{ fontWeight: 600 }}>{TRACKS[currentIdx].title}</div>
          <div style={{ color: '#888' }}>{TRACKS[currentIdx].artist}</div>
        </div>
      )}

      {/* Attribution */}
      <div style={{ marginTop: 12, fontSize: 9, color: '#aaa', lineHeight: 1.4 }}>
        Music: "Soundtrack For A Game Of Chess" by Karpov Not Kasparov. Licensed under CC BY-NC-SA 3.0 via Free Music Archive.
      </div>
    </div>
  );
}
