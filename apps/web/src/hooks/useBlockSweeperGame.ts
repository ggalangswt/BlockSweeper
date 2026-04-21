import { useAccount } from "wagmi";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  finishGame,
  revealCells,
  startGame,
  type CellPosition,
  type FinishGameResponse,
  type StartGameResponse,
} from "../lib/api/blocksweeperApi";
import { getCurrentWeekId } from "../lib/contracts/blockSweeper";
import {
  applyFlags,
  applyRevealResult,
  createGameBoard,
  getChordAction,
  getFlaggedCount,
  getRevealedSafeCells,
  hasClearedAllSafeCells,
  toggleFlag,
  type GameBoard,
} from "../lib/game/board";
import { usePlayBlockSweeper } from "./usePlayBlockSweeper";

type GamePhase = "idle" | "pending-tx" | "creating-session" | "playing" | "won" | "lost";

const DEV_WALLET = "0x1111111111111111111111111111111111111111";

function toReadableErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("user rejected") || normalized.includes("user denied")) {
    return "Payment was cancelled.";
  }

  if (normalized.includes("failed to fetch")) {
    return "Backend is unreachable.";
  }

  if (message.length > 140) {
    return "Unable to start the session.";
  }

  return message;
}

export function useBlockSweeperGame() {
  const { address, isConnected } = useAccount();
  const playContract = usePlayBlockSweeper();
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [board, setBoard] = useState<GameBoard | null>(null);
  const [session, setSession] = useState<StartGameResponse | null>(null);
  const [result, setResult] = useState<FinishGameResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingFinish, setIsSubmittingFinish] = useState(false);
  const [isResolvingMove, setIsResolvingMove] = useState(false);
  const startedTxHashes = useRef(new Set<string>());
  const moveLockRef = useRef(false);
  const boardRef = useRef<GameBoard | null>(null);
  const sessionRef = useRef<StartGameResponse | null>(null);
  const phaseRef = useRef<GamePhase>("idle");

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const finalizeTerminalState = useCallback(
    async (status: "won" | "lost", nextBoard: GameBoard, explodedCell?: CellPosition | null) => {
      if (!session) {
        return;
      }

      setIsSubmittingFinish(true);
      setError(null);

      try {
        const nextResult = await finishGame({
          sessionId: session.sessionId,
          status,
          revealedCells: getRevealedSafeCells(nextBoard),
          explodedCell: explodedCell ?? undefined,
        });

        setResult(nextResult);
        setPhase(status);
      } catch (requestError) {
        setError(requestError instanceof Error ? toReadableErrorMessage(requestError.message) : "Failed to finish game");
      } finally {
        setIsSubmittingFinish(false);
      }
    },
    [session],
  );

  const startSessionFromTx = useCallback(
    async (txHash: string) => {
      if (startedTxHashes.current.has(txHash)) {
        return;
      }

      startedTxHashes.current.add(txHash);
      setError(null);
      setResult(null);
      setIsResolvingMove(false);
      moveLockRef.current = false;
      setPhase("creating-session");

      try {
        const nextSession = await startGame({
          walletAddress: address ?? DEV_WALLET,
          txHash,
          weekId: Number(getCurrentWeekId()),
        });

        setSession(nextSession);
        setBoard(createGameBoard(nextSession.board));
        setPhase("playing");
        playContract.reset();
      } catch (requestError) {
        startedTxHashes.current.delete(txHash);
        setPhase("idle");
        setError(
          requestError instanceof Error ? toReadableErrorMessage(requestError.message) : "Failed to start game session",
        );
      }
    },
    [address, playContract],
  );

  useEffect(() => {
    if (playContract.isPending) {
      setPhase("pending-tx");
      setError(null);
    }
  }, [playContract.isPending]);

  useEffect(() => {
    if (!playContract.isConfirmed || !playContract.hash) {
      return;
    }

    void startSessionFromTx(playContract.hash);
  }, [playContract.hash, playContract.isConfirmed, startSessionFromTx]);

  useEffect(() => {
    if (!playContract.error) {
      return;
    }

    setPhase("idle");
    setError(toReadableErrorMessage(playContract.error.message));
  }, [playContract.error]);

  const startNewGame = useCallback(async () => {
    setError(null);
    setSession(null);
    setBoard(null);
    setResult(null);
    setIsResolvingMove(false);
    moveLockRef.current = false;

    if (import.meta.env.DEV && (!isConnected || !playContract.registry)) {
      const devTxHash = `0x${Date.now().toString(16).padStart(64, "0")}`;
      await startSessionFromTx(devTxHash);
      return;
    }

    if (!isConnected) {
      setError("Open the app inside MiniPay to start an onchain run.");
      return;
    }

    playContract.play();
  }, [isConnected, playContract, startSessionFromTx]);

  const revealCell = useCallback(
    async (position: CellPosition) => {
      if (moveLockRef.current || isSubmittingFinish) {
        return;
      }

      const currentBoard = boardRef.current;
      const currentSession = sessionRef.current;

      if (!currentBoard || !currentSession || phaseRef.current !== "playing") {
        return;
      }

      const localCell = currentBoard.cells[position.row]?.[position.col];
      if (!localCell || localCell.isFlagged || localCell.isRevealed) {
        return;
      }

      moveLockRef.current = true;
      setIsResolvingMove(true);

      try {
        const revealResult = await revealCells({
          sessionId: currentSession.sessionId,
          cells: [position],
        });

        const nextBoard = applyRevealResult(
          boardRef.current ?? currentBoard,
          revealResult.revealedCells,
          revealResult.mineCells,
          revealResult.explodedCell,
        );
        setBoard(nextBoard);

        if (revealResult.status === "won" || revealResult.status === "lost") {
          await finalizeTerminalState(revealResult.status, nextBoard, revealResult.explodedCell);
          return;
        }

        if (hasClearedAllSafeCells(nextBoard)) {
          await finalizeTerminalState("won", nextBoard);
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? toReadableErrorMessage(requestError.message) : "Reveal failed");
      } finally {
        moveLockRef.current = false;
        setIsResolvingMove(false);
      }
    },
    [finalizeTerminalState, isSubmittingFinish],
  );

  const flagCell = useCallback(
    (position: CellPosition) => {
      if (!board || phase !== "playing" || isSubmittingFinish || isResolvingMove) {
        return;
      }

      setBoard(toggleFlag(board, position));
    },
    [board, isResolvingMove, isSubmittingFinish, phase],
  );

  const chordCell = useCallback(
    async (position: CellPosition) => {
      if (moveLockRef.current || isSubmittingFinish) {
        return;
      }

      const currentBoard = boardRef.current;
      const currentSession = sessionRef.current;

      if (!currentBoard || !currentSession || phaseRef.current !== "playing") {
        return;
      }

      const action = getChordAction(currentBoard, position);

      if (action.flagPositions.length > 0) {
        const nextBoard = applyFlags(currentBoard, action.flagPositions);
        setBoard(nextBoard);

        if (hasClearedAllSafeCells(nextBoard)) {
          await finalizeTerminalState("won", nextBoard);
        }

        return;
      }

      if (action.revealPositions.length === 0) {
        return;
      }

      moveLockRef.current = true;
      setIsResolvingMove(true);

      try {
        const revealResult = await revealCells({
          sessionId: currentSession.sessionId,
          cells: action.revealPositions,
        });

        const nextBoard = applyRevealResult(
          boardRef.current ?? currentBoard,
          revealResult.revealedCells,
          revealResult.mineCells,
          revealResult.explodedCell,
        );
        setBoard(nextBoard);

        if (revealResult.status === "won" || revealResult.status === "lost") {
          await finalizeTerminalState(revealResult.status, nextBoard, revealResult.explodedCell);
          return;
        }

        if (hasClearedAllSafeCells(nextBoard)) {
          await finalizeTerminalState("won", nextBoard);
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? toReadableErrorMessage(requestError.message) : "Chord reveal failed");
      } finally {
        moveLockRef.current = false;
        setIsResolvingMove(false);
      }
    },
    [finalizeTerminalState, isSubmittingFinish],
  );

  const resetToLobby = useCallback(() => {
    setPhase("idle");
    setBoard(null);
    setSession(null);
    setResult(null);
    setError(null);
    setIsSubmittingFinish(false);
    setIsResolvingMove(false);
    moveLockRef.current = false;
    playContract.reset();
  }, [playContract]);

  const stats = useMemo(() => {
    if (!board) {
      return {
        mineCount: 40,
        flaggedCount: 0,
        revealedSafeCount: 0,
      };
    }

    return {
      mineCount: board.mineCount,
      flaggedCount: getFlaggedCount(board),
      revealedSafeCount: getRevealedSafeCells(board).length,
    };
  }, [board]);

  const walletAddress =
    session?.walletAddress ?? address ?? (import.meta.env.DEV ? DEV_WALLET : null);
  const statsRefreshKey = `${session?.sessionId ?? "none"}:${result?.finishedAt ?? "pending"}:${phase}`;

  return {
    phase,
    board,
    session,
    result,
    error,
    isSubmittingFinish,
    isResolvingMove,
    startNewGame,
    revealCell,
    flagCell,
    chordCell,
    resetToLobby,
    isConnected,
    isPendingTx: phase === "pending-tx" || playContract.isConfirming,
    isDevBypass: import.meta.env.DEV && (!isConnected || !playContract.registry),
    txHash: playContract.hash,
    weekId: Number(getCurrentWeekId()),
    stats,
    walletAddress,
    statsRefreshKey,
    isSessionOpen:
      phase === "creating-session" || phase === "playing" || phase === "won" || phase === "lost",
  };
}
