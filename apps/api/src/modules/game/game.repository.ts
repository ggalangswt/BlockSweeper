import type { GameSession } from "./game.types.js";

export interface GameSessionRepository {
  create(session: GameSession): GameSession;
  findById(id: string): GameSession | null;
  update(session: GameSession): GameSession;
}

export class InMemoryGameSessionRepository implements GameSessionRepository {
  private readonly sessions = new Map<string, GameSession>();

  create(session: GameSession) {
    this.sessions.set(session.id, session);
    return session;
  }

  findById(id: string) {
    return this.sessions.get(id) ?? null;
  }

  update(session: GameSession) {
    this.sessions.set(session.id, session);
    return session;
  }
}
