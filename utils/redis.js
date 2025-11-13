// utils/redis.js
const { createClient } = require("redis");
const logger = require("./logger"); // logger import

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379" // local Redis ya cloud Redis URL
});

redisClient.on("error", (err) => logger.error("Redis Client Error", { error: err }));

redisClient.connect()
  .then(() => logger.info(" Redis client connected"))
  .catch((err) => logger.error(" Redis connection failed", { error: err }));

module.exports = redisClient;
