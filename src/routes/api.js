const express = require('express');
const logger = require('../utils/logger');
const FlowchartService = require('../services/FlowchartService');
const { validate, flowchartSchema } = require('../middlewares/validation');

const router = express.Router();
const flowchartService = new FlowchartService();

/**
 * @route   POST /api/flowchart
 * @desc    Generate flowchart diagrams from exchange name
 * @access  Public
 * @body    { exchange: string, filename?: string }
 * @returns { success: boolean, data: object }
 */
router.post('/flowchart', validate(flowchartSchema), async (req, res, next) => {
  try {
    const { exchange, filename } = req.validatedBody;

    logger.info(`API request to generate flowchart`, { exchange, filename });

    const result = await flowchartService.generateFlowchart(exchange, filename);

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

module.exports = router;
