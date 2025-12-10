const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Reads and processes JSON files from a directory
 */
class JsonFileReader {
  constructor(directory) {
    this.directory = directory;
  }

  /**
   * Reads all JSON files from the configured directory
   * @returns {Promise<Array>} Array of objects containing fileName and content
   * @throws {Error} If directory doesn't exist or cannot be read
   */
  async readFiles() {
    try {
      if (!fs.existsSync(this.directory)) {
        throw new Error(`Directory does not exist: ${this.directory}`);
      }

      const files = fs.readdirSync(this.directory);
      logger.info(`Found ${files.length} files in ${this.directory}`);

      const jsonFiles = files
        .filter(file => path.extname(file) === '.json')
        .map(file => {
          try {
            const filePath = path.join(this.directory, file);
            const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            return { fileName: file, content };
          } catch (error) {
            logger.warn(`Error reading file ${file}`, { error: error.message });
            return null;
          }
        })
        .filter(Boolean);

      logger.info(`Successfully read ${jsonFiles.length} JSON files`);
      return jsonFiles;
    } catch (error) {
      logger.error('Error reading JSON files', { 
        error: error.message, 
        directory: this.directory 
      });
      throw new Error(`Failed to read JSON files: ${error.message}`);
    }
  }

  /**
   * Reads a specific JSON file
   * @param {string} filename - The name of the file to read
   * @returns {Promise<Object>} The parsed JSON content
   */
  async readFile(filename) {
    try {
      const filePath = path.join(this.directory, filename);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filename}`);
      }

      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      logger.debug(`Successfully read file: ${filename}`);
      return content;
    } catch (error) {
      logger.error(`Error reading file ${filename}`, { error: error.message });
      throw new Error(`Failed to read file ${filename}: ${error.message}`);
    }
  }
}

module.exports = JsonFileReader;
