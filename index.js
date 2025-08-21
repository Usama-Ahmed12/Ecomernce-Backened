require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware to parse JSON
app.use(express.json());

// ✅ Routes import
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes'); // ✅ Add product routes

// ✅ Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes); // ✅ Use product routes
// Static folder for uploaded images
app.use('/uploads', express.static('uploads'));

// Test route
app.get('/', (req, res) => {
  res.send('🚀 API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
