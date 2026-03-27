type Difficulty = 'easy' | 'medium' | 'hard';

interface EngineMove {
  from: string;
  to: string;
  promotion?: string;
}

const DIFFICULTY_CONFIG: Record<Difficulty, { skill: number; depth: number; movetime: number }> = {
  easy: { skill: 1, depth: 4, movetime: 200 },
  medium: { skill: 10, depth: 8, movetime: 500 },
  hard: { skill: 20, depth: 12, movetime: 1000 },
};

let worker: Worker | null = null;
let listeners: ((line: string) => void)[] = [];
let ready = false;

function getBasePath(): string {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
}

function ensureWorker(): Worker {
  if (worker) return worker;

  const basePath = getBasePath();
  const jsUrl = `${basePath}stockfish/stockfish-nnue-16-single.js`;
  const wasmUrl = `${basePath}stockfish/stockfish-nnue-16-single.wasm`;

  const workerScript = `
    self.Module = {
      locateFile: function(file) {
        if (file.indexOf('.wasm') > -1) return '${wasmUrl}';
        return file;
      }
    };
    importScripts('${jsUrl}');
  `;

  const blob = new Blob([workerScript], { type: 'application/javascript' });
  worker = new Worker(URL.createObjectURL(blob));

  worker.onmessage = (e: MessageEvent) => {
    const line = typeof e.data === 'string' ? e.data : '';
    for (const fn of listeners) fn(line);
  };

  return worker;
}

function sendCommand(cmd: string) {
  ensureWorker().postMessage(cmd);
}

function waitForLine(match: (line: string) => boolean, timeoutMs = 10000): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const idx = listeners.indexOf(handler);
      if (idx >= 0) listeners.splice(idx, 1);
      reject(new Error('Stockfish timeout'));
    }, timeoutMs);

    const handler = (line: string) => {
      if (match(line)) {
        clearTimeout(timer);
        const idx = listeners.indexOf(handler);
        if (idx >= 0) listeners.splice(idx, 1);
        resolve(line);
      }
    };
    listeners.push(handler);
  });
}

async function initEngine() {
  if (ready) return;
  ensureWorker();
  sendCommand('uci');
  await waitForLine((l) => l === 'uciok', 15000);
  sendCommand('isready');
  await waitForLine((l) => l === 'readyok', 15000);
  ready = true;
}

function parseUciMove(uci: string): EngineMove {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci.slice(4) : undefined;
  return { from, to, promotion };
}

export async function getBestMove(fen: string, difficulty: Difficulty): Promise<EngineMove> {
  await initEngine();

  const config = DIFFICULTY_CONFIG[difficulty];

  sendCommand('ucinewgame');
  sendCommand(`setoption name Skill Level value ${config.skill}`);
  sendCommand('isready');
  await waitForLine((l) => l === 'readyok');

  sendCommand(`position fen ${fen}`);
  sendCommand(`go depth ${config.depth} movetime ${config.movetime}`);

  const bestmoveLine = await waitForLine((l) => l.startsWith('bestmove'), config.movetime + 5000);
  const parts = bestmoveLine.split(' ');
  const uciMove = parts[1];

  if (!uciMove || uciMove === '(none)') {
    throw new Error('No move found');
  }

  return parseUciMove(uciMove);
}

export function destroyEngine() {
  if (worker) {
    sendCommand('quit');
    worker.terminate();
    worker = null;
    listeners = [];
    ready = false;
  }
}
