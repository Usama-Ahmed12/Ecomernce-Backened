const app = require('./app');

// Load Cron Jobs 
// Cart Cleanup Cron
require('./cron/cartCleanup');

// Order Cleanup Cron
require('./cron/orderCleanup');  // ye assume karo orderCleanup.js me cancelOldPendingOrders cron setup hai

// --------------------------------------------------------

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
