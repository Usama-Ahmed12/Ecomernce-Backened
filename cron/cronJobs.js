const cron = require("node-cron");

console.log("Cron job loaded...");

// Testing cron (Runs every minute)
cron.schedule("* * * * *", () => {
  console.log("Cron job running every minute...");
});
