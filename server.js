const app = require('./app');

const PORT = process.env.PORT || 5000;

// Bind to 0.0.0.0 so ngrok can access it
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
