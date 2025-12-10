const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Schema for flowchart generation request
 */
const flowchartSchema = Joi.object({
  exchange: Joi.string()
    .required()
    .min(1)
    .max(255)
    .pattern(/^[a-zA-Z0-9._-]+$/)
    .messages({
      'string.empty': 'Exchange name is required',
      'string.pattern.base': 'Exchange name can only contain letters, numbers, dots, underscores, and hyphens',
      'any.required': 'Exchange name is required',
    }),
  filename: Joi.string()
    .optional()
    .min(1)
    .max(100)
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .default('flowchart')
    .messages({
      'string.pattern.base': 'Filename can only contain letters, numbers, underscores, and hyphens',
    }),
  direction: Joi.string()
    .optional()
    .valid('LR', 'TD')
    .default('LR')
    .messages({
      'any.only': 'Direction must be either LR (left-right) or TD (top-down)',
    }),
});

/**
 * Middleware to validate request body against a Joi schema
 * @param {Joi.ObjectSchema} schema - The Joi schema to validate against
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Validation error', { errors, body: req.body });

      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errors,
      });
    }

    req.validatedBody = value;
    next();
  };
};

module.exports = {
  validate,
  flowchartSchema,
};
