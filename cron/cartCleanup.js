const cron = require("node-cron");
const { deleteOldCarts } = require("../Services/cartservice");

// Run every hour at 0 minutes
cron.schedule("0 * * * *", () => {
  console.log(" Running Cart Cleanup Cron...");
  deleteOldCarts();
});
