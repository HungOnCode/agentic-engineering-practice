const express = require('express');
const healthService = require('../services/health');

// Mounted at / so it serves both GET / and GET /health
const healthRouter = express.Router();

healthRouter.get('/', (req, res) => {
  res.json(healthService.getApiInfo());
});

healthRouter.get('/health', (req, res) => {
  res.json(healthService.getHealth());
});

module.exports = { healthRouter };
