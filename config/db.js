const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/user"); // Make sure User model path is correct
const logger = require("../utils/logger");

//  Connect to MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      logger.error("Database: MONGO_URI environment variable is not defined.");
      process.exit(1); // Exit if DB URI is missing
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    // console.log(`Connected to MongoDB: ${conn.connection.host}`); // Host name bhi log kar sakte hain
    logger.info("Database: MongoDB Connected successfully.", { dbName: conn.connection.name, dbHost: conn.connection.host });

    // Seed admin after successful DB connection
    await seedAdmin();
  } catch (error) {
    logger.error("Database: MongoDB connection error", { error: error.message, stack: error.stack });
    process.exit(1); // Exit process on database connection failure
  }
};

//  Seed Admin function
const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPass = process.env.ADMIN_PASS;

    if (!adminEmail || !adminPass) {
      logger.warn("Admin Seeder: ADMIN_EMAIL or ADMIN_PASS environment variables are not defined. Skipping admin seeding.");
      return; // Skip seeding if credentials are not provided
    }

    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      logger.info("Admin Seeder: Admin already exists, skipping creation.", { email: adminEmail });
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPass, 10);

    admin = new User({
      firstName: "Super",
      lastName: "Admin",
      phoneNumber: "0000000000",   // dummy number for default admin
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isVerified: true, // Admin should be verified by default
    });

    await admin.save();
    logger.info("Admin Seeder: Default admin created successfully.", { email: adminEmail });
  } catch (error) {
    logger.error("Admin Seeder: Error seeding default admin user", { error: error.message, stack: error.stack, adminEmail: process.env.ADMIN_EMAIL });
    // Don't exit process here, as app might still function without admin if it's not critical for startup.
  }
};

module.exports = connectDB;