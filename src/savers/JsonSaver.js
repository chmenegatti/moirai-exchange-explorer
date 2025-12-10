const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Ensures a directory exists, creating it if necessary
 * @param {string} dirPath - The directory path
 */
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`Created directory: ${dirPath}`);
  }
};

/**
 * Saves ETCD keys as individual JSON files
 */
class JsonSaver {
  constructor(outputDir) {
    this.outputDir = outputDir;
    ensureDirectoryExists(this.outputDir);
  }

  /**
   * Saves ETCD keys as JSON files
   * @param {Object} keys - Object containing key-value pairs from ETCD
   * @returns {number} Number of files saved
   */
  saveKeysAsJson(keys) {
    try {
      let savedCount = 0;

      Object.keys(keys).forEach((key) => {
        const sanitizedKey = key.replace(/\//g, '');
        const filePath = path.join(this.outputDir, `${sanitizedKey}.json`);

        let value = keys[key];

        // Try to parse the value as JSON
        try {
          value = JSON.parse(value);
        } catch (error) {
          logger.debug(`Value for key ${key} is not valid JSON, saving as string`);
        }

        // Write the JSON file with proper formatting
        fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
        logger.debug(`Saved: ${filePath}`);
        savedCount++;
      });

      logger.info(`Saved ${savedCount} files to ${this.outputDir}`);
      return savedCount;
    } catch (error) {
      logger.error('Error saving keys as JSON', { error: error.message });
      throw new Error(`Failed to save keys as JSON: ${error.message}`);
    }
  }
}

module.exports = JsonSaver;
