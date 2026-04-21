import Fastify from "fastify";

import { getPool } from "../lib/db.js";
import { HttpError } from "../lib/http-error.js";
import { gameRoutes } from "../modules/game/game.routes.js";
import {
  PostgresGameSessionRepository,
  type GameSessionRepository,
} from "../modules/game/game.repository.js";
import { GameService } from "../modules/game/game.service.js";

type CreateAppOptions = {
  repository?: GameSessionRepository;
};

export function createApp(options: CreateAppOptions = {}) {
  const app = Fastify({
    logger: true,
  });

  app.addHook("onRequest", async (request, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type");

    if (request.method === "OPTIONS") {
      return reply.status(204).send();
    }
  });

  const gameRepository = options.repository ?? new PostgresGameSessionRepository(getPool());
  const gameService = new GameService(gameRepository);

  app.get("/health", async () => ({
    status: "ok",
  }));

  app.register(gameRoutes, {
    prefix: "/game",
    gameService,
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof HttpError) {
      return reply.status(error.statusCode).send({
        message: error.message,
        details: error.details ?? null,
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      message: "Internal server error",
    });
  });

  return app;
}
