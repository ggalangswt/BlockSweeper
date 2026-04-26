import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { getCurrentWeekId } from "../../lib/week.js";
import {
  finishGameSchema,
  revealCellsSchema,
  startGameSchema,
  walletStatsParamsSchema,
  weekIdQuerySchema,
} from "./game.schemas.js";
import type { GameService } from "./game.service.js";

type GameRoutesOptions = {
  gameService: GameService;
};

export const gameRoutes: FastifyPluginAsync<GameRoutesOptions> = async (fastify, options) => {
  fastify.post("/start", async (request, reply) => {
    const parsed = startGameSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid start game payload",
        issues: parsed.error.flatten(),
      });
    }

    const session = await options.gameService.startGame(parsed.data);
    return reply.status(201).send(session);
  });

  fastify.post("/reveal", async (request, reply) => {
    const parsed = revealCellsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid reveal payload",
        issues: parsed.error.flatten(),
      });
    }

    const result = await options.gameService.revealCells(parsed.data);
    return reply.status(200).send(result);
  });

  fastify.post("/finish", async (request, reply) => {
    const parsed = finishGameSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid finish game payload",
        issues: parsed.error.flatten(),
      });
    }

    const result = await options.gameService.finishGame(parsed.data);
    return reply.status(200).send(result);
  });

  fastify.get("/leaderboard", async (request, reply) => {
    const parsed = weekIdQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid leaderboard query",
        issues: parsed.error.flatten(),
      });
    }

    return reply.status(200).send(await options.gameService.getWeeklyLeaderboard(parsed.data.weekId ?? getCurrentWeekId()));
  });

  fastify.get("/stats/:walletAddress", async (request, reply) => {
    const parsedParams = walletStatsParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.status(400).send({
        message: "Invalid wallet address",
        issues: parsedParams.error.flatten(),
      });
    }

    const parsedQuery = weekIdQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) {
      return reply.status(400).send({
        message: "Invalid stats query",
        issues: parsedQuery.error.flatten(),
      });
    }

    return reply
      .status(200)
      .send(
        await options.gameService.getWeeklyStats(
          parsedParams.data.walletAddress,
          parsedQuery.data.weekId ?? getCurrentWeekId(),
        ),
      );
  });

  fastify.get("/recent/:walletAddress", async (request, reply) => {
    const parsed = walletStatsParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid wallet address",
        issues: parsed.error.flatten(),
      });
    }

    return reply.status(200).send(await options.gameService.getRecentRuns(parsed.data.walletAddress, 5));
  });

  fastify.get("/:sessionId", async (request, reply) => {
    const paramsSchema = z.object({
      sessionId: z.string().min(1),
    });

    const parsed = paramsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid session id",
        issues: parsed.error.flatten(),
      });
    }

    return reply.status(200).send(await options.gameService.getSession(parsed.data.sessionId));
  });
};
