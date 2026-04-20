import Fastify from "fastify";

import { HttpError } from "../lib/http-error.js";
import { InMemoryGameSessionRepository } from "../modules/game/game.repository.js";
import { gameRoutes } from "../modules/game/game.routes.js";
import { GameService } from "../modules/game/game.service.js";

export function createApp() {
  const app = Fastify({
    logger: true,
  });

  const gameRepository = new InMemoryGameSessionRepository();
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
