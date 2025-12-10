const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const logger = require('../utils/logger');
const config = require('../config');

const execPromise = promisify(exec);

/**
 * Sanitizes a filename by removing unsafe characters
 * @param {string} filename - The filename to sanitize
 * @returns {string} The sanitized filename
 */
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9_-]/g, '_');
};

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
 * Generates Mermaid flowchart diagrams in multiple formats
 */
class MermaidFlowchartGenerator {
  constructor(data) {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }
    this.data = data;
    this.outputDir = config.directories.output;
    ensureDirectoryExists(this.outputDir);
  }

  /**
   * Generates the Mermaid diagram definition
   * @param {string} filename - The base filename (without extension)
   * @returns {Promise<string>} Path to the generated .mmd file
   */
  async generate(filename) {
    try {
      const sanitizedFilename = sanitizeFilename(filename);
      let diagram = 'graph LR\n';
      
      this.data.forEach(item => {
        if (item.this && item.next) {
          diagram += `  ${item.this} -->|next| ${item.next}\n`;
        }
        if (item.this && item.error) {
          diagram += `  ${item.this} -->|error| ${item.error}\n`;
        }
      });

      const filePath = path.join(this.outputDir, `${sanitizedFilename}.mmd`);
      fs.writeFileSync(filePath, diagram, 'utf-8');
      logger.info(`Mermaid diagram generated: ${filePath}`);
      
      return filePath;
    } catch (error) {
      logger.error('Error generating Mermaid diagram', { error: error.message });
      throw new Error(`Failed to generate Mermaid diagram: ${error.message}`);
    }
  }

  /**
   * Generates diagram image using Mermaid CLI
   * @private
   * @param {string} source - Source .mmd filename (without extension)
   * @param {string} output - Output filename (without extension)
   * @param {string} format - Output format (svg or png)
   * @returns {Promise<string>} Path to the generated image file
   */
  async _generateImage(source, output, format) {
    try {
      const sanitizedSource = sanitizeFilename(source);
      const sanitizedOutput = sanitizeFilename(output);
      
      const sourcePath = path.join(this.outputDir, `${sanitizedSource}.mmd`);
      const outputPath = path.join(this.outputDir, `${sanitizedOutput}.${format}`);

      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Source file not found: ${sourcePath}`);
      }

      const scaleOption = format === 'png' ? `--scale ${config.mermaid.scale}` : '';
      const command = `mmdc -i "${sourcePath}" -o "${outputPath}" ${scaleOption}`.trim();

      logger.debug(`Executing command: ${command}`);
      const { stdout, stderr } = await execPromise(command);

      if (stderr && !stderr.includes('Done')) {
        logger.warn(`Mermaid CLI warning: ${stderr}`);
      }

      logger.info(`${format.toUpperCase()} generated successfully: ${outputPath}`);
      return outputPath;
    } catch (error) {
      logger.error(`Error generating ${format.toUpperCase()}`, { error: error.message });
      throw new Error(`Failed to generate ${format.toUpperCase()}: ${error.message}`);
    }
  }

  /**
   * Generates SVG diagram
   * @param {string} source - Source .mmd filename (without extension)
   * @param {string} filename - Output filename (without extension)
   * @returns {Promise<string>} Path to the generated SVG file
   */
  async generateSVG(source, filename) {
    return this._generateImage(source, filename, 'svg');
  }

  /**
   * Generates PNG diagram
   * @param {string} source - Source .mmd filename (without extension)
   * @param {string} filename - Output filename (without extension)
   * @returns {Promise<string>} Path to the generated PNG file
   */
  async generatePNG(source, filename) {
    return this._generateImage(source, filename, 'png');
  }

  /**
   * Generates all diagram formats (mmd, svg, png)
   * @param {string} filename - Base filename for all outputs
   * @returns {Promise<Object>} Object containing paths to all generated files
   */
  async generateAll(filename) {
    try {
      const mmdPath = await this.generate(filename);
      const svgPath = await this.generateSVG(filename, filename);
      const pngPath = await this.generatePNG(filename, filename);

      return {
        mmd: mmdPath,
        svg: svgPath,
        png: pngPath,
      };
    } catch (error) {
      logger.error('Error generating all diagram formats', { error: error.message });
      throw error;
    }
  }
}

module.exports = MermaidFlowchartGenerator;
