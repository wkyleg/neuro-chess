import { Chess } from 'chess.js';
import { create } from 'zustand';

export interface MoveRecord {
  san: string;
  time: number;
  composure: number;
}

interface GameState {
  game: Chess;
  moves: MoveRecord[];
  status: 'idle' | 'playing' | 'checkmate' | 'stalemate' | 'draw';
  turn: 'w' | 'b';
  isGameOver: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  boardTheme: string;
}

interface GameActions {
  makeMove: (from: string, to: string, composure: number) => boolean;
  computerMove: () => void;
  reset: () => void;
  setDifficulty: (d: GameState['difficulty']) => void;
  setBoardTheme: (t: string) => void;
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

export const useGameStore = create<GameStore>((set, get) => ({
  game: new Chess(),
  moves: [],
  status: 'idle',
  turn: 'w',
  isGameOver: false,
  difficulty: 'medium',
  boardTheme: 'default',

  makeMove: (from, to, composure) => {
    const { game } = get();
    try {
      const result = game.move({ from, to, promotion: 'q' });
      if (!result) return false;

      const record: MoveRecord = { san: result.san, time: Date.now(), composure };
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

  computerMove: () => {
    const { game } = get();
    if (game.isGameOver() || game.turn() !== 'b') return;

    const move = pickRandomMove(game);
    if (!move) return;

    const result = game.move(move);
    if (!result) return;

    const record: MoveRecord = { san: result.san, time: Date.now(), composure: -1 };
    const status = deriveStatus(game);

    set({
      game,
      moves: [...get().moves, record],
      turn: game.turn(),
      status,
      isGameOver: game.isGameOver(),
    });
  },

  reset: () => {
    set({
      game: new Chess(),
      moves: [],
      status: 'idle',
      turn: 'w',
      isGameOver: false,
    });
  },

  setDifficulty: (difficulty) => set({ difficulty }),
  setBoardTheme: (boardTheme) => set({ boardTheme }),
}));
