const env = require('./config/env');
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./config/logger');

let server;

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Start HTTP server
  server = app.listen(env.PORT, () => {
    logger.info(`OrbitBill API running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    if (env.SWAGGER_ENABLED) {
      logger.info(`Swagger API docs available at http://localhost:${env.PORT}/api-docs`);
    }
  });
};

startServer();

// Graceful shutdown handler
const shutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions and unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection caught');
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception thrown');
  process.exit(1);
});
