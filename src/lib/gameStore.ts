import { Chess } from 'chess.js';
import { create } from 'zustand';

export interface NeuroContext {
  calm: number;
  arousal: number;
  bpm: number | null;
  hrv: number | null;
  alphaPower: number | null;
  betaPower: number | null;
  thetaPower: number | null;
  deltaPower: number | null;
  gammaPower: number | null;
  alphaPeakFreq: number | null;
  alphaBumpState: string | null;
  respirationRate: number | null;
}

export interface MoveRecord {
  san: string;
  time: number;
  calm: number;
  arousal: number;
  bpm: number | null;
  hrv: number | null;
  alphaPower: number | null;
  betaPower: number | null;
  thetaPower: number | null;
  deltaPower: number | null;
  gammaPower: number | null;
  alphaPeakFreq: number | null;
  respirationRate: number | null;
  side: 'w' | 'b';
  whitePieces: number;
  blackPieces: number;
}

export interface NeuroSnapshot {
  time: number;
  calm: number;
  arousal: number;
  bpm: number | null;
  hrv: number | null;
  alphaPower: number | null;
  betaPower: number | null;
  thetaPower: number | null;
  deltaPower: number | null;
  gammaPower: number | null;
  alphaPeakFreq: number | null;
  alphaBumpState: string | null;
  respirationRate: number | null;
}

interface GameState {
  game: Chess;
  moves: MoveRecord[];
  neuroSnapshots: NeuroSnapshot[];
  status: 'idle' | 'playing' | 'checkmate' | 'stalemate' | 'draw';
  turn: 'w' | 'b';
  isGameOver: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  gameStartTime: number;
}

function countPieces(game: Chess, color: 'w' | 'b'): number {
  return game.board().flat().filter((sq) => sq && sq.color === color).length;
}

interface GameActions {
  makeMove: (from: string, to: string, neuro: NeuroContext) => boolean;
  computerMove: (engineMove?: { from: string; to: string; promotion?: string }) => void;
  addNeuroSnapshot: (neuro: NeuroContext) => void;
  reset: () => void;
  setDifficulty: (d: GameState['difficulty']) => void;
}

export type GameStore = GameState & GameActions;

function pickRandomMove(game: Chess): { from: string; to: string; promotion?: string } | null {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  const captures = moves.filter((m) => m.captured);
  const checks = moves.filter((m) => m.san.includes('+'));

  const roll = Math.random();
  if (checks.length > 0 && roll < 0.3) return checks[Math.floor(Math.random() * checks.length)];
  if (captures.length > 0 && roll < 0.5) return captures[Math.floor(Math.random() * captures.length)];
  return moves[Math.floor(Math.random() * moves.length)];
}

function deriveStatus(game: Chess): GameState['status'] {
  if (game.isCheckmate()) return 'checkmate';
  if (game.isStalemate()) return 'stalemate';
  if (game.isDraw()) return 'draw';
  return 'playing';
}

const EMPTY_NEURO: NeuroContext = {
  calm: 0, arousal: 0, bpm: null, hrv: null,
  alphaPower: null, betaPower: null, thetaPower: null,
  deltaPower: null, gammaPower: null, alphaPeakFreq: null,
  alphaBumpState: null, respirationRate: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  game: new Chess(),
  moves: [],
  neuroSnapshots: [],
  status: 'idle',
  turn: 'w',
  isGameOver: false,
  difficulty: 'medium',
  gameStartTime: 0,

  makeMove: (from, to, neuro) => {
    const { game } = get();
    const side = game.turn();
    try {
      const result = game.move({ from, to, promotion: 'q' });
      if (!result) return false;

      const record: MoveRecord = {
        san: result.san,
        time: Date.now(),
        calm: neuro.calm,
        arousal: neuro.arousal,
        bpm: neuro.bpm,
        hrv: neuro.hrv,
        alphaPower: neuro.alphaPower,
        betaPower: neuro.betaPower,
        thetaPower: neuro.thetaPower,
        deltaPower: neuro.deltaPower,
        gammaPower: neuro.gammaPower,
        alphaPeakFreq: neuro.alphaPeakFreq,
        respirationRate: neuro.respirationRate,
        side,
        whitePieces: countPieces(game, 'w'),
        blackPieces: countPieces(game, 'b'),
      };
      const status = deriveStatus(game);

      set({
        game,
        moves: [...get().moves, record],
        turn: game.turn(),
        status,
        isGameOver: game.isGameOver(),
      });
      return true;
    } catch {
      return false;
    }
  },

  computerMove: (engineMove?: { from: string; to: string; promotion?: string }) => {
    const { game } = get();
    if (game.isGameOver() || game.turn() !== 'b') return;

    const move = engineMove ?? pickRandomMove(game);
    if (!move) return;

    const result = game.move(move);
    if (!result) return;

    const record: MoveRecord = {
      san: result.san,
      time: Date.now(),
      ...EMPTY_NEURO,
      side: 'b',
      whitePieces: countPieces(game, 'w'),
      blackPieces: countPieces(game, 'b'),
    };
    const status = deriveStatus(game);

    set({
      game,
      moves: [...get().moves, record],
      turn: game.turn(),
      status,
      isGameOver: game.isGameOver(),
    });
  },

  addNeuroSnapshot: (neuro) => {
    const elapsed = (Date.now() - get().gameStartTime) / 1000;
    set((s) => ({
      neuroSnapshots: [
        ...s.neuroSnapshots,
        {
          time: elapsed,
          calm: neuro.calm,
          arousal: neuro.arousal,
          bpm: neuro.bpm,
          hrv: neuro.hrv,
          alphaPower: neuro.alphaPower,
          betaPower: neuro.betaPower,
          thetaPower: neuro.thetaPower,
          deltaPower: neuro.deltaPower,
          gammaPower: neuro.gammaPower,
          alphaPeakFreq: neuro.alphaPeakFreq,
          alphaBumpState: neuro.alphaBumpState,
          respirationRate: neuro.respirationRate,
        },
      ],
    }));
  },

  reset: () => {
    set({
      game: new Chess(),
      moves: [],
      neuroSnapshots: [],
      status: 'idle',
      turn: 'w',
      isGameOver: false,
      gameStartTime: Date.now(),
    });
  },

  setDifficulty: (difficulty) => set({ difficulty }),
}));
