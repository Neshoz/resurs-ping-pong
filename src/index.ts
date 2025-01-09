import { app } from "./app";

(async () => {
  await app.start();
  app.logger.info("⚡️ Bolt app is running!");
})();
