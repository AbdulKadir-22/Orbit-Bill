const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const express = require('express');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const logger = require('./config/logger');
const swaggerSpec = require('./config/swagger');

const authRoutes = require('./modules/auth/auth.routes');
const staffRoutes = require('./modules/users/user.routes');
const productRoutes = require('./modules/products/product.routes');
const planRoutes = require('./modules/plans/plan.routes');
const taxRoutes = require('./modules/taxes/tax.routes');
const discountRoutes = require('./modules/discounts/discount.routes');
const customerRoutes = require('./modules/customers/customer.routes');

const { globalRateLimiter } = require('./middlewares/rateLimit.middleware');
const notFoundHandler = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration with origin and credentials
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Express JSON body parser with size limit & URL encoded parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser for refresh token cookies
app.use(cookieParser());

// Sanitize inputs against MongoDB Operator Injection
app.use(
  mongoSanitize({
    allowDots: true,
    replaceWith: '_',
  })
);

// Morgan HTTP request logging piped through pino logger
const morganStream = {
  write: (message) => logger.info(message.trim()),
};
app.use(
  morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: morganStream,
  })
);

// Global API Rate Limiter
app.use('/api', globalRateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OrbitBill API is operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Swagger documentation
if (env.SWAGGER_ENABLED) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Mount API v1 router
const apiV1Router = express.Router();
apiV1Router.use('/auth', authRoutes);
apiV1Router.use('/staff', staffRoutes);
apiV1Router.use('/products', productRoutes);
apiV1Router.use('/plans', planRoutes);
apiV1Router.use('/taxes', taxRoutes);
apiV1Router.use('/discounts', discountRoutes);
apiV1Router.use('/customers', customerRoutes);

app.use('/api/v1', apiV1Router);

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
