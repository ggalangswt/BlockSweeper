import { HttpError } from "../../lib/http-error.js";
import { getCurrentWeekId } from "../../lib/week.js";
import { DEFAULT_BOARD_CONFIG } from "./game.constants.js";
import {
  createBoard,
  createSessionId,
  revealCellsForSession,
  toClientBoard,
  validateFinishPayload,
} from "./game.logic.js";
import type { GameSessionRepository } from "./game.repository.js";
import type { FinishGameInput, RevealCellsInput, StartGameInput } from "./game.types.js";

export class GameService {
  constructor(private readonly repository: GameSessionRepository) {}

  async startGame(input: StartGameInput) {
    const currentWeekId = getCurrentWeekId();
    const session = this.repository.create({
      id: createSessionId(),
      walletAddress: input.walletAddress,
      txHash: input.txHash,
      weekId: currentWeekId,
      createdAt: new Date().toISOString(),
      finishedAt: null,
      board: null,
      status: "playing",
      revealedCellKeys: [],
      explodedCell: null,
    });

    const createdSession = await session;

    return {
      sessionId: createdSession.id,
      walletAddress: createdSession.walletAddress,
      txHash: createdSession.txHash,
      weekId: createdSession.weekId,
      status: createdSession.status,
      board: toClientBoard(DEFAULT_BOARD_CONFIG),
      createdAt: createdSession.createdAt,
    };
  }

  async revealCells(input: RevealCellsInput) {
    const session = await this.repository.findById(input.sessionId);
    if (!session) {
      throw new HttpError(404, "Game session not found");
    }

    if (session.status !== "playing") {
      throw new HttpError(409, "Game session already finished");
    }

    if (!session.board) {
      session.board = createBoard(DEFAULT_BOARD_CONFIG, input.cells[0]);
    }

    const revealResult = revealCellsForSession(session.board, session.revealedCellKeys, input);
    session.revealedCellKeys = revealResult.revealedKeys;

    if (revealResult.status !== "playing") {
      session.status = revealResult.status;
      session.finishedAt = new Date().toISOString();
      session.explodedCell = revealResult.explodedCell;
    }

    await this.repository.update(session);

    return {
      sessionId: session.id,
      status: session.status,
      revealedCells: revealResult.revealedCells,
      explodedCell: revealResult.explodedCell,
      mineCells: revealResult.mineCells,
      finishedAt: session.finishedAt,
    };
  }

  async finishGame(input: FinishGameInput) {
    const session = await this.repository.findById(input.sessionId);
    if (!session) {
      throw new HttpError(404, "Game session not found");
    }

    if (!session.board) {
      throw new HttpError(409, "Game session has no board state");
    }

    if (session.status !== "playing") {
      return {
        sessionId: session.id,
        walletAddress: session.walletAddress,
        txHash: session.txHash,
        weekId: session.weekId,
        status: session.status,
        finishedAt: session.finishedAt,
        revealedSafeCells: session.revealedCellKeys.length,
        explodedCell: session.explodedCell,
      };
    }

    const validation = validateFinishPayload(session.board, input);

    session.status = validation.status;
    session.finishedAt = new Date().toISOString();
    session.explodedCell = validation.explodedCell;
    session.finishPayload = input;

    await this.repository.update(session);

    return {
      sessionId: session.id,
      walletAddress: session.walletAddress,
      txHash: session.txHash,
      weekId: session.weekId,
      status: session.status,
      finishedAt: session.finishedAt,
      revealedSafeCells: validation.revealedSafeCells,
      explodedCell: validation.explodedCell,
    };
  }

  async getSession(sessionId: string) {
    const session = await this.repository.findById(sessionId);
    if (!session) {
      throw new HttpError(404, "Game session not found");
    }

    return {
      sessionId: session.id,
      walletAddress: session.walletAddress,
      txHash: session.txHash,
      weekId: session.weekId,
      status: session.status,
      createdAt: session.createdAt,
      finishedAt: session.finishedAt,
      board: toClientBoard(session.board?.config ?? DEFAULT_BOARD_CONFIG),
    };
  }

  async getWeeklyLeaderboard(weekId: number) {
    const targetWeekId = weekId || getCurrentWeekId();
    return {
      weekId: targetWeekId,
      entries: await this.repository.getWeeklyLeaderboard(targetWeekId),
    };
  }

  async getWeeklyStats(walletAddress: string, weekId: number) {
    return this.repository.getWeeklyStats(walletAddress, weekId || getCurrentWeekId());
  }
}
