import { app } from "./app";
import { getNextPlayerElo } from "./util/elo";

(async () => {
  await app.start();
  app.logger.info("⚡️ Bolt app is running!");
})();
