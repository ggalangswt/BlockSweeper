import { HttpError } from "../../lib/http-error.js";
import { DEFAULT_BOARD_CONFIG } from "./game.constants.js";
import { createBoard, createSessionId, toClientBoard, validateFinishPayload } from "./game.logic.js";
import type { GameSessionRepository } from "./game.repository.js";
import type { FinishGameInput, StartGameInput } from "./game.types.js";

export class GameService {
  constructor(private readonly repository: GameSessionRepository) {}

  startGame(input: StartGameInput) {
    const board = createBoard(DEFAULT_BOARD_CONFIG);
    const session = this.repository.create({
      id: createSessionId(),
      walletAddress: input.walletAddress,
      txHash: input.txHash,
      weekId: input.weekId,
      createdAt: new Date().toISOString(),
      finishedAt: null,
      board,
      status: "playing",
    });

    return {
      sessionId: session.id,
      walletAddress: session.walletAddress,
      txHash: session.txHash,
      weekId: session.weekId,
      status: session.status,
      board: toClientBoard(session.board),
      createdAt: session.createdAt,
    };
  }

  finishGame(input: FinishGameInput) {
    const session = this.repository.findById(input.sessionId);
    if (!session) {
      throw new HttpError(404, "Game session not found");
    }

    if (session.status !== "playing") {
      throw new HttpError(409, "Game session already finished");
    }

    const validation = validateFinishPayload(session.board, input);

    session.status = validation.status;
    session.finishedAt = new Date().toISOString();
    session.finishPayload = input;

    this.repository.update(session);

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

  getSession(sessionId: string) {
    const session = this.repository.findById(sessionId);
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
      board: toClientBoard(session.board),
    };
  }
}
