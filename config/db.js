const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info(" MongoDB Connected");

    // Seed admin after DB connection
    await seedAdmin();
  } catch (error) {
    logger.error(" MongoDB connection error", { error: error.message });
    process.exit(1);
  }
};

// ✅ Seed Admin function
const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPass = process.env.ADMIN_PASS;

    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      logger.info(" Admin already exists", { email: adminEmail });
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPass, 10);

    admin = new User({
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });

    await admin.save();
    logger.info(" Default admin created", { email: adminEmail });
  } catch (error) {
    logger.error(" Error seeding admin", { error: error.message });
  }
};

module.exports = connectDB;
