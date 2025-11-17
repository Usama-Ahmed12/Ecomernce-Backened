const cron = require("node-cron");
const { cancelOldPendingOrders } = require("../Services/orderservices");
const logger = require("../utils/logger");

cron.schedule("0 * * * *", async () => {
  logger.info(" Running Order Cleanup Cron...");
  const result = await cancelOldPendingOrders();
  logger.info(`Cron Job Result: ${JSON.stringify(result)}`);
});
