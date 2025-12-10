const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Service for managing and retrieving exchanges
 */
class ExchangeService {
  constructor() {
    this.jsonDir = config.directories.json;
  }

  /**
   * Validates that JSON directory exists and has files
   * @throws {Error} If directory doesn't exist or is empty
   */
  validateJsonDirectory() {
    if (!fs.existsSync(this.jsonDir)) {
      throw new Error('JSON directory does not exist. Please run data extraction first.');
    }

    const files = fs.readdirSync(this.jsonDir);
    if (files.length === 0) {
      throw new Error('JSON directory is empty. Please run data extraction first.');
    }
  }

  /**
   * Extracts all exchanges from JSON files
   * @returns {Promise<Array<string>>} Array of all exchanges found
   */
  async getAllExchanges() {
    try {
      logger.info('Extracting all exchanges from JSON files');

      this.validateJsonDirectory();

      const files = fs.readdirSync(this.jsonDir);
      const exchanges = new Set();

      files.forEach(file => {
        if (path.extname(file) !== '.json') return;

        try {
          const filePath = path.join(this.jsonDir, file);
          const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

          // Handle both array and single object
          if (Array.isArray(content)) {
            content.forEach(item => {
              if (item.Exchange) {
                exchanges.add(item.Exchange);
              }
            });
          } else if (content && content.Exchange) {
            exchanges.add(content.Exchange);
          }
        } catch (error) {
          logger.warn(`Error reading file ${file}`, { error: error.message });
        }
      });

      const allExchanges = Array.from(exchanges);
      logger.info(`Found ${allExchanges.length} distinct exchanges`);

      return allExchanges;
    } catch (error) {
      logger.error('Error extracting exchanges', { error: error.message });
      throw error;
    }
  }

  /**
   * Gets exchanges filtered by prefix and sorted alphabetically
   * @param {string} prefix - Prefix to filter exchanges (default: 'moirai')
   * @returns {Promise<Array<string>>} Sorted array of filtered exchanges
   */
  async getExchangesByPrefix(prefix = 'moirai') {
    try {
      logger.info(`Getting exchanges with prefix: ${prefix}`);

      const allExchanges = await this.getAllExchanges();

      // Filter by prefix and sort alphabetically
      const filteredExchanges = allExchanges
        .filter(exchange => exchange.toLowerCase().startsWith(prefix.toLowerCase()))
        .sort((a, b) => a.localeCompare(b));

      logger.info(`Found ${filteredExchanges.length} exchanges with prefix '${prefix}'`);

      return filteredExchanges;
    } catch (error) {
      logger.error('Error getting exchanges by prefix', { 
        error: error.message, 
        prefix 
      });
      throw error;
    }
  }
}

module.exports = ExchangeService;
