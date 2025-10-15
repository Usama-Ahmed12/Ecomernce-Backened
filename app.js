require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const connectDB = require('./config/db');
const logger = require('./utils/logger');   // ✅ Import logger

//  Connect to MongoDB
connectDB();

const app = express();

//  Enable CORS (keep before routes)
app.use(cors());

// Enable Helmet (for secure headers)
app.use(helmet());

//  Rate limiter middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

// Middleware to parse JSON
app.use(express.json());

//  Request logger middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - Body: ${JSON.stringify(req.body)}`);
  next();
});

//  Central routes import
const routes = require('./routes');
app.use('/api', routes);

//  Static folder for uploaded images
app.use('/uploads', express.static('uploads'));

//  Test routes
app.get('/', (req, res) => {
  res.send('🚀 API is running...');
});

app.get('/health', (req, res) => {
  res.json({ status: "OK" });
});

//  Dummy route to test global error handler
app.get('/error-test', (req, res, next) => {
  const err = new Error("Database connection failed!");
  err.status = 500;
  next(err);  // send to global error handler
});

//  404 handler for unknown routes
app.use((req, res, next) => {
  logger.warn(`404 - Route Not Found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

//  Global Error Handler (always last middleware)
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.method} ${req.originalUrl}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong!",
    data: null
  });
});

module.exports = app;
