import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApp } from "../../app/create-app.js";

const app = createApp();

describe("game routes", () => {
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

  it("finishes a winning game and prevents double finish", async () => {
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
    const revealedCells = session.board.cells
      .filter((cell: { isMine: boolean }) => !cell.isMine)
      .map((cell: { row: number; col: number }) => ({ row: cell.row, col: cell.col }));

    const finishResponse = await app.inject({
      method: "POST",
      url: "/game/finish",
      payload: {
        sessionId: session.sessionId,
        status: "won",
        revealedCells,
      },
    });

    expect(finishResponse.statusCode).toBe(200);
    expect(finishResponse.json().status).toBe("won");

    const secondFinish = await app.inject({
      method: "POST",
      url: "/game/finish",
      payload: {
        sessionId: session.sessionId,
        status: "won",
        revealedCells,
      },
    });

    expect(secondFinish.statusCode).toBe(409);
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
});
