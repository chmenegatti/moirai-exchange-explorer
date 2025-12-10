const { Etcd3 } = require('etcd3');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Client for interacting with ETCD
 */
class EtcdClient {
  constructor(hosts = null) {
    this.hosts = hosts || config.etcd.hosts;
    this.client = new Etcd3({ hosts: this.hosts });
    logger.info(`ETCD client initialized with hosts: ${this.hosts}`);
  }

  /**
   * Reads all keys from ETCD, filtering out keys containing '/env-'
   * @returns {Promise<Object>} Object containing filtered key-value pairs
   * @throws {Error} If unable to read from ETCD
   */
  async readAllKeys() {
    try {
      logger.info('Reading all keys from ETCD');
      const allKeys = await this.client.getAll().strings();
      
      const filteredKeys = Object.keys(allKeys).reduce((acc, key) => {
        if (!key.includes('/env-')) {
          acc[key] = allKeys[key];
        }
        return acc;
      }, {});

      logger.info(`Retrieved ${Object.keys(filteredKeys).length} keys from ETCD (filtered)`);
      return filteredKeys;
    } catch (error) {
      logger.error('Error reading keys from ETCD', { error: error.message, hosts: this.hosts });
      throw new Error(`Failed to read from ETCD: ${error.message}`);
    } finally {
      await this.close();
    }
  }

  /**
   * Reads a specific key from ETCD
   * @param {string} key - The key to read
   * @returns {Promise<string|null>} The value or null if not found
   */
  async readKey(key) {
    try {
      logger.debug(`Reading key from ETCD: ${key}`);
      const value = await this.client.get(key).string();
      return value;
    } catch (error) {
      logger.error(`Error reading key ${key} from ETCD`, { error: error.message });
      throw new Error(`Failed to read key ${key}: ${error.message}`);
    }
  }

  /**
   * Closes the ETCD connection
   */
  async close() {
    try {
      this.client.close();
      logger.debug('ETCD client connection closed');
    } catch (error) {
      logger.warn('Error closing ETCD connection', { error: error.message });
    }
  }
}

module.exports = EtcdClient;
