import "dotenv/config";

import { env } from "./config/env.js";
import { createApp } from "./app/create-app.js";

const app = createApp();

app
  .listen({
    port: env.PORT,
    host: env.HOST,
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
