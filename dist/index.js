"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
(async () => {
    await app_1.app.start();
    app_1.app.logger.info("⚡️ Bolt app is running!");
})();
