/**
 * MARK/THREE — Bauhaus Game Night
 * Warm paper, disciplined geometry, and an off-centre editorial game composition.
 */
import { Bot, Check, Copy, RotateCcw, Sparkles, Trophy, Users, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Player = "X" | "O";
type GameResult = Player | "DRAW" | null;
type Board = Array<Player | null>;
type Score = Record<Player | "draws", number>;
type PlayerRecord = Record<"wins" | "losses" | "draws", number>;
type GameMode = "LOCAL" | "AI";
type Difficulty = "EASY" | "HARD";
type ShareFeedback = "idle" | "copied" | "failed";

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

const emptyBoard = (): Board => Array<Player | null>(9).fill(null);
const availableMoves = (board: Board) => board.flatMap((cell, index) => (cell ? [] : [index]));

function getRoundResult(board: Board): { result: GameResult; line: number[] } {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { result: board[a], line: [...line] };
    }
  }

  return board.every(Boolean) ? { result: "DRAW", line: [] } : { result: null, line: [] };
}

function minimax(board: Board, depth: number, maximizing: boolean, aiPlayer: Player, humanPlayer: Player): number {
  const { result } = getRoundResult(board);
  if (result === aiPlayer) return 10 - depth;
  if (result === humanPlayer) return depth - 10;
  if (result === "DRAW") return 0;

  const scores = availableMoves(board).map((move) => {
    const nextBoard = [...board];
    nextBoard[move] = maximizing ? aiPlayer : humanPlayer;
    return minimax(nextBoard, depth + 1, !maximizing, aiPlayer, humanPlayer);
  });

  return maximizing ? Math.max(...scores) : Math.min(...scores);
}

function getHardMove(board: Board, aiPlayer: Player, humanPlayer: Player): number {
  let bestMove = availableMoves(board)[0] ?? 0;
  let bestScore = -Infinity;

  for (const move of availableMoves(board)) {
    const nextBoard = [...board];
    nextBoard[move] = aiPlayer;
    const score = minimax(nextBoard, 0, false, aiPlayer, humanPlayer);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function getStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getStoredBoolean(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) === true : fallback;
  } catch {
    return fallback;
  }
}

export default function Home() {
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [activePlayer, setActivePlayer] = useState<Player>("X");
  const [result, setResult] = useState<GameResult>(null);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [scores, setScores] = useState<Score>(() => getStoredValue("mark-three-score", { X: 0, O: 0, draws: 0 }));
  const [playerRecord, setPlayerRecord] = useState<PlayerRecord>(() => getStoredValue("mark-three-player-record", { wins: 0, losses: 0, draws: 0 }));
  const [gameMode, setGameMode] = useState<GameMode>("LOCAL");
  const [difficulty, setDifficulty] = useState<Difficulty>("HARD");
  const [humanPlayer, setHumanPlayer] = useState<Player>("X");
  const [showPlayerSetup, setShowPlayerSetup] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<ShareFeedback>("idle");
  const [soundEnabled, setSoundEnabled] = useState(() => getStoredBoolean("mark-three-sound-enabled", true));
  const audioContextRef = useRef<AudioContext | null>(null);

  const aiPlayer: Player = humanPlayer === "X" ? "O" : "X";
  const opponentName = gameMode === "AI" ? "The house" : "Player two";
  const isHumanTurn = gameMode === "LOCAL" || activePlayer === humanPlayer;
  const winningLineClass = winningLine.join("-");

  useEffect(() => {
    window.localStorage.setItem("mark-three-score", JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    window.localStorage.setItem("mark-three-player-record", JSON.stringify(playerRecord));
  }, [playerRecord]);

  useEffect(() => {
    window.localStorage.setItem("mark-three-sound-enabled", JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const prepareAudio = useCallback(() => {
    if (typeof window === "undefined" || !window.AudioContext) return null;
    if (!audioContextRef.current) audioContextRef.current = new window.AudioContext();
    if (audioContextRef.current.state === "suspended") void audioContextRef.current.resume();
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((kind: "mark" | "win", player?: Player) => {
    if (!soundEnabled) return;
    const audio = prepareAudio();
    if (!audio) return;

    const notes = kind === "win"
      ? [392, 523.25, 659.25]
      : [player === "X" ? 516 : 430];
    const now = audio.currentTime;

    notes.forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const start = now + index * (kind === "win" ? 0.095 : 0);
      oscillator.type = kind === "win" ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(kind === "win" ? 0.045 : 0.03, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + (kind === "win" ? 0.26 : 0.1));
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + (kind === "win" ? 0.27 : 0.11));
    });
  }, [prepareAudio, soundEnabled]);

  const resetRound = useCallback(() => {
    setBoard(emptyBoard());
    setActivePlayer("X");
    setResult(null);
    setWinningLine([]);
    setIsThinking(false);
    setShareFeedback("idle");
  }, []);

  const settleMove = useCallback((nextBoard: Board, player: Player) => {
    const { result: nextResult, line } = getRoundResult(nextBoard);
    setBoard(nextBoard);

    if (nextResult) {
      setResult(nextResult);
      setWinningLine(line);
      setScores((current) => {
        const key = nextResult === "DRAW" ? "draws" : nextResult;
        return { ...current, [key]: current[key] + 1 };
      });
      if (gameMode === "AI") {
        const recordKey = nextResult === "DRAW" ? "draws" : nextResult === humanPlayer ? "wins" : "losses";
        setPlayerRecord((current) => ({ ...current, [recordKey]: current[recordKey] + 1 }));
      }
      playSound("win");
      return;
    }

    playSound("mark", player);
    setActivePlayer(player === "X" ? "O" : "X");
  }, [gameMode, humanPlayer, playSound]);

  useEffect(() => {
    if (gameMode !== "AI" || activePlayer !== aiPlayer || result || isThinking || showPlayerSetup) return;

    setIsThinking(true);
    const timer = window.setTimeout(() => {
      const moves = availableMoves(board);
      if (!moves.length) return;

      const selectedMove = difficulty === "HARD"
        ? getHardMove(board, aiPlayer, humanPlayer)
        : moves[Math.floor(Math.random() * moves.length)];
      const nextBoard = [...board];
      nextBoard[selectedMove] = aiPlayer;
      settleMove(nextBoard, aiPlayer);
      setIsThinking(false);
    }, difficulty === "HARD" ? 520 : 360);

    return () => window.clearTimeout(timer);
  }, [activePlayer, aiPlayer, board, difficulty, gameMode, humanPlayer, isThinking, result, settleMove, showPlayerSetup]);

  const status = useMemo(() => {
    if (result === "DRAW") return "The board is full. Call it even.";
    if (result === aiPlayer && gameMode === "AI") return "The house owns this line.";
    if (result === humanPlayer && gameMode === "AI") return "You own this line.";
    if (result) return `${result} owns this line.`;
    if (isThinking) return "The house is considering its mark.";
    if (gameMode === "AI") return activePlayer === humanPlayer ? "Place your next mark." : "The house takes a turn.";
    return `Place the next mark · ${activePlayer}.`;
  }, [activePlayer, aiPlayer, gameMode, humanPlayer, isThinking, result]);

  const handleCellClick = (index: number) => {
    if (board[index] || result || isThinking || !isHumanTurn || showPlayerSetup) return;
    prepareAudio();
    const nextBoard = [...board];
    nextBoard[index] = activePlayer;
    settleMove(nextBoard, activePlayer);
  };

  const enterLocalTable = () => {
    setGameMode("LOCAL");
    setShowPlayerSetup(false);
    setScores({ X: 0, O: 0, draws: 0 });
    resetRound();
  };

  const openPlayerSetup = () => {
    setShowPlayerSetup(true);
    setShareFeedback("idle");
  };

  const startSinglePlayer = () => {
    prepareAudio();
    setGameMode("AI");
    setShowPlayerSetup(false);
    setScores({ X: 0, O: 0, draws: 0 });
    resetRound();
  };

  const beginNextRound = () => resetRound();

  const clearMatch = () => {
    resetRound();
    setScores({ X: 0, O: 0, draws: 0 });
  };

  const resetRecord = () => setPlayerRecord({ wins: 0, losses: 0, draws: 0 });

  const copyFinalState = async () => {
    if (!result) return;
    const boardRows = [0, 3, 6].map((start) => board.slice(start, start + 3).map((cell) => cell ?? "·").join(" "));
    const outcome = result === "DRAW" ? "DRAW" : gameMode === "AI" ? result === humanPlayer ? "You won" : "The house won" : `${result} won`;
    const copy = [
      "MARK/THREE — final board",
      ...boardRows,
      `${outcome} · ${gameMode === "AI" ? `${difficulty.toLowerCase()} house, you played ${humanPlayer}` : "local table"}`,
      `Table score — X ${scores.X} : O ${scores.O} : Draws ${scores.draws}`,
      ...(gameMode === "AI" ? [`Your record — W ${playerRecord.wins} : L ${playerRecord.losses} : D ${playerRecord.draws}`] : []),
    ].join("\n");

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copy);
      } else {
        const helper = document.createElement("textarea");
        helper.value = copy;
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        document.body.removeChild(helper);
      }
      setShareFeedback("copied");
    } catch {
      setShareFeedback("failed");
    }

    window.setTimeout(() => setShareFeedback("idle"), 2600);
  };

  return (
    <main className="game-page">
      <div className="paper-field" aria-hidden="true" />
      <div className="graphic-orbit orbit-one" aria-hidden="true" />
      <div className="graphic-orbit orbit-two" aria-hidden="true" />

      <div className="page-frame">
        <header className="masthead">
          <a className="brand" href="#game" aria-label="MARK/THREE game board">
            <img src="/mark-three/mark-three-logo.png" alt="" className="brand-mark" />
            <span className="brand-name">MARK/<em>THREE</em></span>
          </a>
          <p className="masthead-note">{gameMode === "AI" ? `A quiet match against the house. You are ${humanPlayer}.` : "A nine-square ritual for two."}</p>
          <div className="masthead-actions">
            <button className={`sound-toggle ${soundEnabled ? "is-on" : ""}`} onClick={() => { prepareAudio(); setSoundEnabled((current) => !current); }} type="button" aria-label={soundEnabled ? "Mute game sounds" : "Unmute game sounds"} aria-pressed={soundEnabled}>
              {soundEnabled ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
              <span>{soundEnabled ? "Sound on" : "Sound off"}</span>
            </button>
            <button className="text-action" onClick={clearMatch} type="button">
              <RotateCcw size={16} strokeWidth={2.2} />
              Sweep the table
            </button>
          </div>
        </header>

        <section className="intro" aria-labelledby="game-title">
          <div className="intro-copy">
            <p className="eyebrow"><Sparkles size={14} aria-hidden="true" /> {gameMode === "AI" ? "Single-player table" : "Local two-player game"}</p>
            <h1 id="game-title">Make the <span>first</span> mark.</h1>
            <p className="lede">Three marks in a row settles the round. The score stays with the table.</p>
          </div>
          <div className="intro-rule" aria-hidden="true">
            <span>03</span>
            <i />
            <small>align to win</small>
          </div>
        </section>

        <section className="play-area" id="game" aria-label="Tic-Tac-Toe game">
          <div className="board-panel">
            <img className="board-art" src="/mark-three/bauhaus-game-night-hero.png" alt="" aria-hidden="true" />
            <div className="round-topline">
              <span className="round-label">{isThinking ? "The house is thinking" : "The square is yours"}</span>
              <span className={`player-chip chip-${result ? "finished" : activePlayer.toLowerCase()} ${isThinking ? "is-thinking" : ""}`}>
                {result ? "Round complete" : isThinking ? "House moves" : `Turn · ${activePlayer}`}
              </span>
            </div>

            <div className="game-settings" aria-label="Game options">
              <div className="setting-group">
                <span className="setting-label">Table</span>
                <div className="choice-group" role="group" aria-label="Choose game mode">
                  <button type="button" className={gameMode === "LOCAL" && !showPlayerSetup ? "is-selected" : ""} onClick={enterLocalTable} aria-pressed={gameMode === "LOCAL" && !showPlayerSetup}>
                    <Users size={14} aria-hidden="true" /> Two players
                  </button>
                  <button type="button" className={gameMode === "AI" || showPlayerSetup ? "is-selected" : ""} onClick={openPlayerSetup} aria-pressed={gameMode === "AI" || showPlayerSetup}>
                    <Bot size={14} aria-hidden="true" /> Play the house
                  </button>
                </div>
              </div>
              {gameMode === "AI" && !showPlayerSetup && (
                <div className="setting-group difficulty-group">
                  <span className="setting-label">House play</span>
                  <div className="choice-group" role="group" aria-label="Choose computer difficulty">
                    <button type="button" className={difficulty === "EASY" ? "is-selected" : ""} onClick={() => { setDifficulty("EASY"); resetRound(); }} aria-pressed={difficulty === "EASY"}>Easy</button>
                    <button type="button" className={difficulty === "HARD" ? "is-selected" : ""} onClick={() => { setDifficulty("HARD"); resetRound(); }} aria-pressed={difficulty === "HARD"}>Hard</button>
                  </div>
                </div>
              )}
            </div>

            <div className={`game-board ${isThinking ? "is-thinking" : ""}`} role="group" aria-label="Three by three Tic-Tac-Toe board">
              {winningLine.length === 3 && <span className={`winning-stroke winning-stroke-${winningLineClass}`} aria-hidden="true" />}
              {board.map((cell, index) => {
                const row = Math.floor(index / 3) + 1;
                const column = (index % 3) + 1;
                const isWinningCell = winningLine.includes(index);
                const cellLabel = cell ? `${cell} at row ${row}, column ${column}` : `Empty square at row ${row}, column ${column}`;

                return (
                  <button key={index} type="button" className={`board-cell ${cell ? "is-filled" : ""} ${isWinningCell ? "is-winning" : ""}`} onClick={() => handleCellClick(index)} aria-label={cellLabel} disabled={Boolean(cell) || Boolean(result) || isThinking || !isHumanTurn || showPlayerSetup}>
                    {cell && <span className={`mark mark-${cell.toLowerCase()}`} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            {showPlayerSetup && (
              <section className="player-setup" role="dialog" aria-modal="true" aria-labelledby="player-setup-title">
                <p className="eyebrow"><Bot size={14} aria-hidden="true" /> Single-player setup</p>
                <h2 id="player-setup-title">Choose your mark.</h2>
                <p>You can open as X, or let the house make the first move while you take O.</p>
                <div className="mark-picker" role="group" aria-label="Choose your player mark">
                  <button type="button" className={humanPlayer === "X" ? "is-selected pick-x" : "pick-x"} onClick={() => setHumanPlayer("X")} aria-pressed={humanPlayer === "X"}>X <span>You open</span></button>
                  <button type="button" className={humanPlayer === "O" ? "is-selected pick-o" : "pick-o"} onClick={() => setHumanPlayer("O")} aria-pressed={humanPlayer === "O"}>O <span>House opens</span></button>
                </div>
                <div className="setup-actions">
                  <button className="setup-cancel" type="button" onClick={enterLocalTable}>Return to local table</button>
                  <button className="primary-action" type="button" onClick={startSinglePlayer}>Start as {humanPlayer}</button>
                </div>
              </section>
            )}

            {!showPlayerSetup && (
              <div className="round-footer" aria-live="polite">
                <p className={`round-status ${result ? "is-settled" : ""}`}>{status}</p>
                <div className="round-actions">
                  {result && (
                    <button className={`share-action ${shareFeedback}`} type="button" onClick={copyFinalState}>
                      {shareFeedback === "copied" ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                      {shareFeedback === "copied" ? "Board copied" : shareFeedback === "failed" ? "Copy unavailable" : "Share final board"}
                    </button>
                  )}
                  <button className="primary-action" type="button" onClick={beginNextRound}>
                    <RotateCcw size={17} aria-hidden="true" />
                    {result ? "Deal next round" : "Clear this round"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="score-panel" aria-label="Match score">
            <div className="score-heading">
              <p className="eyebrow"><Trophy size={14} aria-hidden="true" /> Table score</p>
              <p>{gameMode === "AI" ? `Can you outplay the house on ${difficulty.toLowerCase()}?` : "First to three has bragging rights."}</p>
            </div>

            <div className="score-list">
              <div className="score-row score-x"><span className="score-symbol">X</span><span className="score-name">{gameMode === "AI" ? humanPlayer === "X" ? "You" : "The house" : "Player one"}</span><strong>{scores.X}</strong></div>
              <div className="score-row score-o"><span className="score-symbol">O</span><span className="score-name">{gameMode === "AI" ? humanPlayer === "O" ? "You" : "The house" : opponentName}</span><strong>{scores.O}</strong></div>
              <div className="score-row score-draw"><span className="score-symbol">=</span><span className="score-name">Draws</span><strong>{scores.draws}</strong></div>
            </div>

            {gameMode === "AI" && (
              <section className="player-record" aria-label="Your persistent record">
                <div className="record-heading"><span>Your record</span><button type="button" onClick={resetRecord}>Reset</button></div>
                <div className="record-values"><span><b>{playerRecord.wins}</b>W</span><span><b>{playerRecord.losses}</b>L</span><span><b>{playerRecord.draws}</b>D</span></div>
              </section>
            )}

            <figure className="side-poster">
              <img src="/mark-three/mark-three-side-poster.png" alt="Abstract red, blue and black game shapes." />
              <figcaption>{gameMode === "AI" ? <>Meet the house.<br />Leave a line.</> : <>Choose a side.<br />Leave a line.</>}</figcaption>
            </figure>
          </aside>
        </section>

        <footer className="page-footer"><span>MARK/THREE</span><span>Built for quick games &amp; long rivalries.</span><span>© 2026</span></footer>
      </div>
    </main>
  );
}
