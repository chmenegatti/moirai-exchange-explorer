const express = require('express');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config');
const FlowchartService = require('../services/FlowchartService');
const ExchangeService = require('../services/ExchangeService');
const { validate, flowchartSchema } = require('../middlewares/validation');

const router = express.Router();
const flowchartService = new FlowchartService();
const exchangeService = new ExchangeService();

/**
 * @route   POST /api/flowchart
 * @desc    Generate flowchart diagrams from exchange name
 * @access  Public
 * @body    { exchange: string, filename?: string }
 * @returns { success: boolean, data: object } or Mermaid/SVG content based on Accept header
 */
router.post('/flowchart', validate(flowchartSchema), async (req, res, next) => {
  try {
    const { exchange, filename } = req.validatedBody;
    const acceptHeader = req.headers.accept || '';
    const sanitizedFilename = (filename || 'flowchart').replace(/[^a-zA-Z0-9_-]/g, '_');

    logger.info(`API request to generate flowchart`, { exchange, filename });

    const result = await flowchartService.generateFlowchart(exchange, filename);

    // If client accepts text/vnd.mermaid, return the Mermaid code
    if (acceptHeader.includes('text/vnd.mermaid') || acceptHeader.includes('text/plain')) {
      const mmdPath = path.join(config.directories.output, `${sanitizedFilename}.mmd`);

      if (fs.existsSync(mmdPath)) {
        const mmdContent = fs.readFileSync(mmdPath, 'utf-8');
        res.setHeader('Content-Type', 'text/plain');
        return res.send(mmdContent);
      }
    }

    // If client accepts SVG, return the SVG file content
    if (acceptHeader.includes('image/svg+xml')) {
      const svgPath = path.join(config.directories.output, `${sanitizedFilename}.svg`);

      if (fs.existsSync(svgPath)) {
        const svgContent = fs.readFileSync(svgPath, 'utf-8');
        res.setHeader('Content-Type', 'image/svg+xml');
        return res.send(svgContent);
      }
    }

    // Otherwise return JSON response with data
    res.json({
      success: true,
      message: 'Flowchart generated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 * @returns { success: boolean, message: string, timestamp: string }
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /api/exchanges
 * @desc    Get all distinct exchanges starting with 'moirai' sorted alphabetically
 * @access  Public
 * @query   prefix - Optional prefix to filter exchanges (default: 'moirai')
 * @returns { success: boolean, data: { exchanges: string[], count: number } }
 */
router.get('/exchanges', async (req, res, next) => {
  try {
    const prefix = req.query.prefix || 'moirai';

    logger.info(`API request to get exchanges`, { prefix });

    const exchanges = await exchangeService.getExchangesByPrefix(prefix);

    res.json({
      success: true,
      message: 'Exchanges retrieved successfully',
      data: {
        prefix,
        count: exchanges.length,
        exchanges,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
