const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config');
const JsonFileReader = require('../readers/JsonFileReader');
const ExchangeFinder = require('../finders/ExchangeFinder');
const MermaidFlowchartGenerator = require('../generators/MermaidFlowchartGenerator');

/**
 * Service for orchestrating flowchart generation
 */
class FlowchartService {
  constructor() {
    this.jsonDir = config.directories.json;
    this.outputDir = config.directories.output;
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
   * Generates flowchart from exchange name
   * @param {string} exchangeName - The exchange name to search for
   * @param {string} filename - Base filename for outputs
   * @returns {Promise<Object>} Object containing all generated file paths and data
   */
  async generateFlowchart(exchangeName, filename = 'flowchart') {
    try {
      logger.info(`Starting flowchart generation for exchange: ${exchangeName}`);

      // Validate JSON directory
      this.validateJsonDirectory();

      // Read JSON files
      const reader = new JsonFileReader(this.jsonDir);
      const jsonData = await reader.readFiles();

      if (!jsonData || jsonData.length === 0) {
        throw new Error('No valid JSON files found');
      }

      // Find matching exchange data
      const finder = new ExchangeFinder(jsonData, filename);
      const results = await finder.find(exchangeName);

      if (!results || results.length === 0) {
        throw new Error(`No results found for exchange: ${exchangeName}`);
      }

      // Generate diagrams
      const generator = new MermaidFlowchartGenerator(results);
      const generatedFiles = await generator.generateAll(filename);

      // Return simplified response with essential data
      const response = {
        exchange: exchangeName,
        resultsCount: results.length,
        results: results,
      };

      logger.info(`Flowchart generation completed for: ${exchangeName}`, {
        resultsCount: results.length,
        files: ['json', 'mmd', 'svg', 'png'],
      });

      return response;
    } catch (error) {
      logger.error('Error generating flowchart', { 
        error: error.message, 
        exchangeName 
      });
      throw error;
    }
  }

  /**
   * Generates diagrams from existing JSON file
   * @param {string} jsonFilename - The JSON filename in output directory
   * @returns {Promise<Object>} Object containing generated file paths and data
   */
  async generateFromExistingJson(jsonFilename) {
    try {
      logger.info(`Generating diagrams from existing JSON: ${jsonFilename}`);

      const jsonPath = path.join(this.outputDir, jsonFilename);
      
      if (!fs.existsSync(jsonPath)) {
        throw new Error(`JSON file not found: ${jsonFilename}`);
      }

      const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      const baseName = path.parse(jsonFilename).name;

      const generator = new MermaidFlowchartGenerator(content);
      await generator.generateAll(baseName);

      const response = {
        source: jsonFilename,
        resultsCount: content.length,
        results: content,
      };

      logger.info(`Diagrams generated from existing JSON: ${jsonFilename}`);
      return response;
    } catch (error) {
      logger.error('Error generating from existing JSON', { 
        error: error.message, 
        jsonFilename 
      });
      throw error;
    }
  }
}

module.exports = FlowchartService;
