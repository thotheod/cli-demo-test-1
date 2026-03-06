const express = require('express');
const { router: linksRouter } = require('./routes/links');

const app = express();

app.use(express.json());
app.use('/links', linksRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
