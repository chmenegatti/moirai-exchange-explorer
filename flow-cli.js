#!/usr/bin/env node

const { Command } = require('commander');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const Extractor = require('./src/extractors/Extractor');
const FlowchartService = require('./src/services/FlowchartService');

const program = new Command();

program
  .name('flow-cli')
  .description('CLI for ETCD configuration management and flowchart generation')
  .version('2.0.0');

program
  .option('-g, --generate', 'Get data from ETCD and save as JSON')
  .option('-e, --exchange <exchange>', 'Exchange name to find')
  .option('-o, --output <filename>', 'Output filename for results (default: flowchart)')
  .option('-d, --diagram <jsonfile>', 'Generate diagrams from existing JSON file in output directory');

program.parse(process.argv);

const options = program.opts();

/**
 * Run the ETCD extractor
 */
const runExtractor = async () => {
  try {
    logger.info('Starting ETCD data extraction');
    const extractor = new Extractor(config.etcd.hosts, config.directories.json);
    const count = await extractor.run();
    logger.info(`Extraction completed. ${count} files saved to ${config.directories.json}`);
    console.log(`✓ Successfully extracted ${count} files to ${config.directories.json}`);
  } catch (error) {
    logger.error('Extraction failed', { error: error.message });
    console.error(`✗ Extraction failed: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Generate flowchart from exchange name
 */
const generateFlowchart = async (exchangeName, filename) => {
  try {
    logger.info('Starting flowchart generation', { exchangeName, filename });
    const service = new FlowchartService();
    const result = await service.generateFlowchart(exchangeName, filename);
    
    console.log(`\n✓ Flowchart generated successfully!`);
    console.log(`  Exchange: ${result.exchange}`);
    console.log(`  Results found: ${result.resultsCount}`);
    console.log(`\nGenerated files:`);
    console.log(`  JSON: ${result.files.json}`);
    console.log(`  Mermaid: ${result.files.mmd}`);
    console.log(`  SVG: ${result.files.svg}`);
    console.log(`  PNG: ${result.files.png}`);
  } catch (error) {
    logger.error('Flowchart generation failed', { error: error.message });
    console.error(`✗ Flowchart generation failed: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Generate diagrams from existing JSON
 */
const generateFromExisting = async (jsonFilename) => {
  try {
    logger.info('Generating diagrams from existing JSON', { jsonFilename });
    const service = new FlowchartService();
    const result = await service.generateFromExistingJson(jsonFilename);
    
    console.log(`\n✓ Diagrams generated successfully!`);
    console.log(`  Source: ${result.source}`);
    console.log(`  Results: ${result.resultsCount}`);
    console.log(`\nGenerated files:`);
    console.log(`  Mermaid: ${result.files.mmd}`);
    console.log(`  SVG: ${result.files.svg}`);
    console.log(`  PNG: ${result.files.png}`);
  } catch (error) {
    logger.error('Diagram generation failed', { error: error.message });
    console.error(`✗ Diagram generation failed: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Main execution
 */
const main = async () => {
  try {
    // Extract data from ETCD
    if (options.generate) {
      await runExtractor();
    }

    // Generate flowchart from exchange
    if (options.exchange) {
      const filename = options.output || 'flowchart';
      await generateFlowchart(options.exchange, filename);
    }

    // Generate diagrams from existing JSON
    if (options.diagram) {
      await generateFromExisting(options.diagram);
    }

    // Show help if no options provided
    if (!options.generate && !options.exchange && !options.diagram) {
      program.help();
    }
  } catch (error) {
    logger.error('CLI execution failed', { error: error.message });
    console.error(`✗ Error: ${error.message}`);
    process.exit(1);
  }
};

main();