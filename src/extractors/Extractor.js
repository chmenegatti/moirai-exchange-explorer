const EtcdClient = require('../clients/EtcdClient');
const JsonSaver = require('../savers/JsonSaver');
const logger = require('../utils/logger');

/**
 * Extracts data from ETCD and saves as JSON files
 */
class Extractor {
  constructor(etcdHosts, outputDir) {
    this.etcdClient = new EtcdClient(etcdHosts);
    this.jsonSaver = new JsonSaver(outputDir);
  }

  /**
   * Runs the extraction process
   * @returns {Promise<number>} Number of files saved
   */
  async run() {
    try {
      logger.info('Starting ETCD extraction process');
      const filteredKeys = await this.etcdClient.readAllKeys();
      
      if (!filteredKeys || Object.keys(filteredKeys).length === 0) {
        logger.warn('No keys found in ETCD after filtering');
        return 0;
      }

      const savedCount = this.jsonSaver.saveKeysAsJson(filteredKeys);
      logger.info(`Extraction completed successfully. Saved ${savedCount} files`);
      return savedCount;
    } catch (error) {
      logger.error('Error during extraction process', { error: error.message });
      throw error;
    }
  }
}

module.exports = Extractor;
