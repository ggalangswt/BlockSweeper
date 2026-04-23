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
import { getTargetChainId, getTargetChainName, isSupportedChain } from "../lib/chains";
import {
  applyFlags,
  applyRevealResult,
  createGameBoard,
  getChordAction,
  getFlaggedCount,
  getRevealedSafeCells,
  hasClearedAllSafeCells,
  revealBoardCell,
  toggleFlag,
  type GameBoard,
} from "../lib/game/board";
import { isMiniPayProvider } from "../lib/ethereum";
import { useWalletChainId } from "./useWalletChainId";
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
  const walletChainId = useWalletChainId();
  const playContract = usePlayBlockSweeper();
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [board, setBoard] = useState<GameBoard | null>(null);
  const [session, setSession] = useState<StartGameResponse | null>(null);
  const [result, setResult] = useState<FinishGameResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingFinish, setIsSubmittingFinish] = useState(false);
  const startedTxHashes = useRef(new Set<string>());

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

    if (import.meta.env.DEV && (!isConnected || !playContract.registry)) {
      const devTxHash = `0x${Date.now().toString(16).padStart(64, "0")}`;
      await startSessionFromTx(devTxHash);
      return;
    }

    if (!isConnected) {
      setError("Open the app inside MiniPay to start an onchain run.");
      return;
    }

    if (!walletChainId || walletChainId !== getTargetChainId()) {
      setError(
        isMiniPayProvider()
          ? `MiniPay is on the wrong network. Open Settings > Developer Settings > Use Testnet to switch to ${getTargetChainName()}.`
          : `Switch your wallet to ${getTargetChainName()} and try again.`,
      );
      return;
    }

    try {
      await playContract.play();
    } catch (requestError) {
      setPhase("idle");
      setError(
        requestError instanceof Error
          ? toReadableErrorMessage(requestError.message)
          : "Unable to start the session.",
      );
    }
  }, [isConnected, playContract, startSessionFromTx, walletChainId]);

  const revealCell = useCallback(
    async (position: CellPosition) => {
      if (!board || !session || phase !== "playing" || isSubmittingFinish) {
        return;
      }

      const localCell = board.cells[position.row]?.[position.col];
      if (!localCell || localCell.isFlagged || localCell.isRevealed) {
        return;
      }

      try {
        if (getRevealedSafeCells(board).length === 0) {
          const revealResult = await revealCells({
            sessionId: session.sessionId,
            cells: [position],
          });

          const serverBoard = applyRevealResult(
            createGameBoard(revealResult.board),
            revealResult.revealedCells,
            revealResult.mineCells,
            revealResult.explodedCell,
          );
          setBoard(serverBoard);

          if (revealResult.status === "lost") {
            await finalizeTerminalState("lost", serverBoard, revealResult.explodedCell);
          } else if (revealResult.status === "won" || hasClearedAllSafeCells(serverBoard)) {
            await finalizeTerminalState("won", serverBoard);
          }

          return;
        }

        const revealResult = revealBoardCell(board, position);
        const nextBoard = revealResult.board;
        setBoard(nextBoard);

        if (revealResult.status === "lost") {
          await finalizeTerminalState("lost", nextBoard, revealResult.explodedCell);
        } else if (revealResult.status === "won" || hasClearedAllSafeCells(nextBoard)) {
          await finalizeTerminalState("won", nextBoard);
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? toReadableErrorMessage(requestError.message) : "Reveal failed");
      }
    },
    [board, finalizeTerminalState, isSubmittingFinish, phase, session],
  );

  const flagCell = useCallback(
    (position: CellPosition) => {
      if (!board || phase !== "playing" || isSubmittingFinish) {
        return;
      }

      setBoard(toggleFlag(board, position));
    },
    [board, isSubmittingFinish, phase],
  );

  const chordCell = useCallback(
    async (position: CellPosition) => {
      if (!board || !session || phase !== "playing" || isSubmittingFinish) {
        return;
      }

      const action = getChordAction(board, position);

      if (action.flagPositions.length > 0) {
        const nextBoard = applyFlags(board, action.flagPositions);
        setBoard(nextBoard);

        if (hasClearedAllSafeCells(nextBoard)) {
          await finalizeTerminalState("won", nextBoard);
        }

        return;
      }

      if (action.revealPositions.length === 0) {
        return;
      }

      try {
        let nextBoard = board;
        let explodedCell: CellPosition | null = null;
        let terminalStatus: "playing" | "won" | "lost" = "playing";

        for (const revealPosition of action.revealPositions) {
          const revealResult = revealBoardCell(nextBoard, revealPosition);
          nextBoard = revealResult.board;

          if (revealResult.status === "lost") {
            explodedCell = revealResult.explodedCell;
            terminalStatus = "lost";
            break;
          }

          if (revealResult.status === "won") {
            terminalStatus = "won";
          }
        }

        setBoard(nextBoard);

        if (terminalStatus === "lost") {
          await finalizeTerminalState("lost", nextBoard, explodedCell);
          return;
        }

        if (terminalStatus === "won" || hasClearedAllSafeCells(nextBoard)) {
          await finalizeTerminalState("won", nextBoard);
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? toReadableErrorMessage(requestError.message) : "Chord reveal failed");
      }
    },
    [board, finalizeTerminalState, isSubmittingFinish, phase, session],
  );

  const resetToLobby = useCallback(() => {
    setPhase("idle");
    setBoard(null);
    setSession(null);
    setResult(null);
    setError(null);
    setIsSubmittingFinish(false);
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
  const targetChainName = getTargetChainName();
  const isWrongNetwork = isConnected && (!walletChainId || walletChainId !== getTargetChainId());
  const wrongNetworkMessage = isWrongNetwork
    ? isMiniPayProvider()
      ? `MiniPay is on the wrong network. Open Settings > Developer Settings > Use Testnet to switch to ${targetChainName}.`
      : `Wallet is on ${walletChainId && !isSupportedChain(walletChainId) ? `Chain ${walletChainId}` : "the wrong network"}. Switch to ${targetChainName}.`
    : null;

  return {
    phase,
    board,
    session,
    result,
    error,
    isSubmittingFinish,
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
    walletChainId,
    targetChainName,
    isWrongNetwork,
    wrongNetworkMessage,
    isSessionOpen:
      phase === "creating-session" || phase === "playing" || phase === "won" || phase === "lost",
  };
}
