import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { finishGameSchema, startGameSchema } from "./game.schemas.js";
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

    const session = options.gameService.startGame(parsed.data);
    return reply.status(201).send(session);
  });

  fastify.post("/finish", async (request, reply) => {
    const parsed = finishGameSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid finish game payload",
        issues: parsed.error.flatten(),
      });
    }

    const result = options.gameService.finishGame(parsed.data);
    return reply.status(200).send(result);
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

    return reply.status(200).send(options.gameService.getSession(parsed.data.sessionId));
  });
};
