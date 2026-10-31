const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const userRoutes = require('./modules/users/user.routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FLUX User Management API',
      version: '1.0.0',
      description: 'RESTful API for User Management built with Node.js, Express, MongoDB, and Mongoose (MVC Architecture)',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development Server',
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Documentation Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Health check / root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FLUX API is running',
    documentation: '/api-docs',
  });
});

// API Routes
app.use('/api/users', userRoutes);

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found on ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
