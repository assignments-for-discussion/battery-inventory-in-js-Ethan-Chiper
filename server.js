const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const dotenv  = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/battery', require('./routes/batteryRoutes'));

// Health check
app.get('/api/health', (_req, res) =>
  res.json({ status: 'OK', message: 'Battery Health API is running', timestamp: new Date() })
);

// 404
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found' })
);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 1303;
app.listen(PORT, () =>
  console.log(`🔋 Battery Health API → http://localhost:${PORT}`)
);

module.exports = app;
