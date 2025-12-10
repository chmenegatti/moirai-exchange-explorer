require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  etcd: {
    hosts: process.env.ETCD_HOSTS || '127.0.0.1:2379',
  },
  directories: {
    json: process.env.JSON_DIR || './json',
    output: process.env.OUTPUT_DIR || './output',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
  },
  mermaid: {
    scale: parseInt(process.env.MERMAID_SCALE, 10) || 8,
  },
};

module.exports = config;
