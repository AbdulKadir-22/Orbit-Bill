const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log error (with stack in dev, message in prod)
  if (process.env.NODE_ENV === 'development') {
    logger.error({ err: error }, error.message);
  } else {
    logger.error(error.message);
  }

  // Handle Mongoose Bad ObjectId (CastError)
  if (error.name === 'CastError') {
    const message = `Invalid format for resource parameter '${error.path}': ${error.value}`;
    error = ApiError.badRequest(message, [
      { field: error.path, message: 'Invalid ID format' },
    ]);
  }

  // Handle Mongoose Validation Error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors || {}).map((val) => ({
      field: val.path,
      message: val.message,
    }));
    error = ApiError.badRequest('Validation failed', errors);
  }

  // Handle Mongoose Duplicate Key Error (11000)
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    const message = `A record with that ${field} already exists.`;
    error = ApiError.conflict(message, [
      { field, message: `${field} must be unique` },
    ]);
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid authentication token');
  }
  if (error.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Authentication token has expired');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  const responsePayload = {
    success: false,
    message,
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;
