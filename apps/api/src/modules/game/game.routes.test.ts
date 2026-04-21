import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApp } from "../../app/create-app.js";
import { getCurrentWeekId } from "../../lib/week.js";
import { InMemoryGameSessionRepository } from "./game.repository.js";

const repository = new InMemoryGameSessionRepository();
const app = createApp({
  repository,
});

describe("game routes", () => {
  const currentWeekId = getCurrentWeekId();

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns health status", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("starts a new game session", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/game/start",
      payload: {
        walletAddress: "0x1111111111111111111111111111111111111111",
        txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        weekId: 10,
      },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json();
    expect(body.sessionId).toBeTypeOf("string");
    expect(body.board.rows).toBe(16);
    expect(body.board.cols).toBe(16);
    expect(body.board.mineCount).toBe(40);
    expect(body.board.cells).toBeUndefined();
    expect(body.status).toBe("playing");
  });

  it("rejects invalid start payload", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/game/start",
      payload: {
        walletAddress: "oops",
        txHash: "nope",
        weekId: 0,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("reveals a first click safely", async () => {
    const startResponse = await app.inject({
      method: "POST",
      url: "/game/start",
      payload: {
        walletAddress: "0x2222222222222222222222222222222222222222",
        txHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        weekId: 20,
      },
    });

    const session = startResponse.json();

    const revealResponse = await app.inject({
      method: "POST",
      url: "/game/reveal",
      payload: {
        sessionId: session.sessionId,
        cells: [{ row: 0, col: 0 }],
      },
    });

    expect(revealResponse.statusCode).toBe(200);
    expect(revealResponse.json().explodedCell).toBeNull();
  });

  it("rejects reveal on unknown session", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/game/reveal",
      payload: {
        sessionId: "missing",
        cells: [{ row: 0, col: 0 }],
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it("rejects finish on unknown session", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/game/finish",
      payload: {
        sessionId: "missing",
        status: "won",
        revealedCells: [],
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it("returns weekly leaderboard from persisted sessions", async () => {
    const walletA = "0x3333333333333333333333333333333333333333";
    const walletB = "0x4444444444444444444444444444444444444444";

    const startA = await app.inject({
      method: "POST",
      url: "/game/start",
      payload: {
        walletAddress: walletA,
        txHash: "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
        weekId: currentWeekId,
      },
    });

    const startB = await app.inject({
      method: "POST",
      url: "/game/start",
      payload: {
        walletAddress: walletB,
        txHash: "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
        weekId: currentWeekId,
      },
    });

    await app.inject({
      method: "POST",
      url: "/game/reveal",
      payload: {
        sessionId: startA.json().sessionId,
        cells: [{ row: 0, col: 0 }],
      },
    });

    await app.inject({
      method: "POST",
      url: "/game/reveal",
      payload: {
        sessionId: startB.json().sessionId,
        cells: [{ row: 0, col: 0 }],
      },
    });

    const storedSession = await repository.findById(startA.json().sessionId);
    if (!storedSession) {
      throw new Error("Expected stored session to exist");
    }

    storedSession.status = "won";
    storedSession.finishedAt = new Date().toISOString();
    await repository.update(storedSession);

    const response = await app.inject({
      method: "GET",
      url: `/game/leaderboard?weekId=${currentWeekId}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().weekId).toBe(currentWeekId);
    expect(response.json().entries.length).toBeGreaterThanOrEqual(2);

    const walletAEntry = response.json().entries.find((entry: { walletAddress: string }) => entry.walletAddress === walletA);
    const walletBEntry = response.json().entries.find((entry: { walletAddress: string }) => entry.walletAddress === walletB);

    expect(walletAEntry).toBeTruthy();
    expect(walletAEntry.wins).toBe(1);
    expect(walletAEntry.totalPlays).toBe(1);
    expect(walletBEntry).toBeTruthy();
    expect(walletBEntry.wins).toBe(0);
    expect(walletBEntry.totalPlays).toBe(1);
  });

  it("returns weekly stats for a wallet", async () => {
    const wallet = "0x5555555555555555555555555555555555555555";
    const start = await app.inject({
      method: "POST",
      url: "/game/start",
      payload: {
        walletAddress: wallet,
        txHash: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        weekId: currentWeekId,
      },
    });

    await app.inject({
      method: "POST",
      url: "/game/reveal",
      payload: {
        sessionId: start.json().sessionId,
        cells: [{ row: 0, col: 0 }],
      },
    });

    await app.inject({
      method: "POST",
      url: "/game/finish",
      payload: {
        sessionId: start.json().sessionId,
        status: "lost",
        revealedCells: [],
        explodedCell: { row: 1, col: 1 },
      },
    });

    const response = await app.inject({
      method: "GET",
      url: `/game/stats/${wallet}?weekId=${currentWeekId}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().walletAddress).toBe(wallet);
    expect(response.json().weekId).toBe(currentWeekId);
    expect(response.json().wins).toBe(0);
    expect(response.json().totalPlays).toBe(1);
  });
});
