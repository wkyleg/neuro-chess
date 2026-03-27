import { beforeEach, describe, expect, it } from 'vitest';
import type { NeuroContext } from './gameStore';
import { useGameStore } from './gameStore';

const MOCK_NEURO: NeuroContext = {
  calm: 0.75,
  arousal: 0.3,
  bpm: 72,
  hrv: 45,
  alphaPower: 0.6,
  betaPower: 0.4,
  thetaPower: 0.3,
  deltaPower: 0.2,
  gammaPower: 0.1,
  alphaPeakFreq: 10.5,
  alphaBumpState: 'present',
  respirationRate: 14.2,
};

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('starts with initial state', () => {
    const state = useGameStore.getState();
    expect(state.status).toBe('idle');
    expect(state.turn).toBe('w');
    expect(state.isGameOver).toBe(false);
    expect(state.moves).toHaveLength(0);
    expect(state.neuroSnapshots).toHaveLength(0);
    expect(state.difficulty).toBe('medium');
  });

  it('makes a valid move and records neuro data', () => {
    const ok = useGameStore.getState().makeMove('e2', 'e4', MOCK_NEURO);
    expect(ok).toBe(true);

    const state = useGameStore.getState();
    expect(state.moves).toHaveLength(1);
    expect(state.moves[0].san).toBe('e4');
    expect(state.moves[0].calm).toBe(0.75);
    expect(state.moves[0].arousal).toBe(0.3);
    expect(state.moves[0].bpm).toBe(72);
    expect(state.moves[0].side).toBe('w');
    expect(state.moves[0].whitePieces).toBe(16);
    expect(state.moves[0].blackPieces).toBe(16);
    expect(state.turn).toBe('b');
  });

  it('rejects an invalid move', () => {
    const ok = useGameStore.getState().makeMove('e2', 'e5', MOCK_NEURO);
    expect(ok).toBe(false);
    expect(useGameStore.getState().moves).toHaveLength(0);
  });

  it('computer makes a random move as fallback', () => {
    useGameStore.getState().makeMove('e2', 'e4', MOCK_NEURO);
    useGameStore.getState().computerMove();

    const state = useGameStore.getState();
    expect(state.moves).toHaveLength(2);
    expect(state.moves[1].side).toBe('b');
    expect(state.turn).toBe('w');
  });

  it('computer accepts an engine move', () => {
    useGameStore.getState().makeMove('e2', 'e4', MOCK_NEURO);
    useGameStore.getState().computerMove({ from: 'e7', to: 'e5' });

    const state = useGameStore.getState();
    expect(state.moves).toHaveLength(2);
    expect(state.moves[1].san).toBe('e5');
  });

  it('does not let computer move when game is over or not black turn', () => {
    useGameStore.getState().computerMove();
    expect(useGameStore.getState().moves).toHaveLength(0);
  });

  it('records neuro snapshots', () => {
    useGameStore.setState({ status: 'playing', gameStartTime: Date.now() - 5000 });
    useGameStore.getState().addNeuroSnapshot(MOCK_NEURO);

    const snapshots = useGameStore.getState().neuroSnapshots;
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].calm).toBe(0.75);
    expect(snapshots[0].bpm).toBe(72);
    expect(snapshots[0].time).toBeGreaterThan(0);
  });

  it('resets to initial state', () => {
    useGameStore.getState().makeMove('e2', 'e4', MOCK_NEURO);
    useGameStore.getState().computerMove();
    useGameStore.getState().addNeuroSnapshot(MOCK_NEURO);

    useGameStore.getState().reset();
    const state = useGameStore.getState();
    expect(state.moves).toHaveLength(0);
    expect(state.neuroSnapshots).toHaveLength(0);
    expect(state.status).toBe('idle');
    expect(state.turn).toBe('w');
  });

  it('sets difficulty', () => {
    useGameStore.getState().setDifficulty('hard');
    expect(useGameStore.getState().difficulty).toBe('hard');

    useGameStore.getState().setDifficulty('easy');
    expect(useGameStore.getState().difficulty).toBe('easy');
  });

  it('detects checkmate', () => {
    const store = useGameStore.getState();
    const game = store.game;

    game.move('f2f3');
    game.move('e7e5');
    game.move('g2g4');

    useGameStore.setState({ game, turn: game.turn() });

    useGameStore.getState().makeMove('d8', 'h4', MOCK_NEURO);

    const state = useGameStore.getState();
    expect(state.status).toBe('checkmate');
    expect(state.isGameOver).toBe(true);
  });

  it('tracks piece counts after captures', () => {
    const { game } = useGameStore.getState();

    game.move('e2e4');
    game.move('d7d5');
    useGameStore.setState({ game, turn: game.turn() });

    useGameStore.getState().makeMove('e4', 'd5', MOCK_NEURO);
    const lastMove = useGameStore.getState().moves[0];
    expect(lastMove.blackPieces).toBe(15);
    expect(lastMove.whitePieces).toBe(16);
  });
});
