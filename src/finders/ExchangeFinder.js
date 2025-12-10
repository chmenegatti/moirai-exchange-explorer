const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Comparison function for sorting results
 * @param {Object} a - First object to compare
 * @param {Object} b - Second object to compare
 * @returns {number} Comparison result
 */
const compareResults = (a, b) => {
  const isErrorA = a.this && a.this.includes('error');
  const isErrorB = b.this && b.this.includes('error');

  if (isErrorA && !isErrorB) return 1;
  if (!isErrorA && isErrorB) return -1;

  const versionA = (a.this || '').replace(/[^\d.]/g, '').split('.').map(Number);
  const versionB = (b.this || '').replace(/[^\d.]/g, '').split('.').map(Number);

  for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
    const diff = (versionA[i] || 0) - (versionB[i] || 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
};

/**
 * Finds and filters configurations based on Exchange value
 */
class ExchangeFinder {
  constructor(data, filename) {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }
    this.data = data;
    this.filename = filename;
    this.outputDir = config.directories.output;
  }

  /**
   * Finds all items matching the given exchange value
   * @param {string} exchangeValue - The exchange value to search for
   * @returns {Promise<Array>} Array of filtered and sorted results
   * @throws {Error} If unable to process or save results
   */
  async find(exchangeValue) {
    try {
      if (!exchangeValue) {
        throw new Error('Exchange value is required');
      }

      logger.info(`Searching for exchange: ${exchangeValue}`);

      const results = this.data.reduce((acc, { fileName, content }) => {
        if (Array.isArray(content)) {
          content.forEach(item => {
            if (item.Exchange === exchangeValue) {
              acc.push({
                etcd: fileName.replace('.json', ''),
                this: item.BindingKey,
                next: item.OkRoutingKey,
                error: item.ErrorRoutingKey,
              });
            }
          });
        } else if (content && content.Exchange === exchangeValue) {
          acc.push({
            etcd: fileName.replace('.json', ''),
            this: content.BindingKey,
            next: content.OkRoutingKey,
            error: content.ErrorRoutingKey,
          });
        }
        return acc;
      }, []);

      results.sort(compareResults);
      logger.info(`Found ${results.length} matches for exchange: ${exchangeValue}`);

      // Save results to file
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }

      const outputPath = path.join(this.outputDir, `${this.filename}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
      logger.info(`Results saved to: ${outputPath}`);

      return results;
    } catch (error) {
      logger.error('Error finding exchange', { 
        error: error.message, 
        exchangeValue 
      });
      throw new Error(`Failed to find exchange: ${error.message}`);
    }
  }
}

module.exports = ExchangeFinder;
