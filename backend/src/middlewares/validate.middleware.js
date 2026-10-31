const ApiError = require('../utils/ApiError');

/**
 * Higher-order middleware to validate incoming request data against Zod schemas.
 *
 * @param {Object} schemas - { body?, params?, query? }
 */
const validate = (schemas = {}) => {
  return (req, res, next) => {
    const errorDetails = [];

    ['body', 'params', 'query'].forEach((key) => {
      if (schemas[key]) {
        const result = schemas[key].safeParse(req[key]);
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            const fieldPath = issue.path.length ? `${key}.${issue.path.join('.')}` : key;
            errorDetails.push({
              field: issue.path.join('.') || key,
              location: key,
              message: issue.message,
            });
          });
        } else {
          // Replace with sanitized/coerced data from schema
          req[key] = result.data;
        }
      }
    });

    if (errorDetails.length > 0) {
      return next(new ApiError(400, 'Validation failed', errorDetails));
    }

    next();
  };
};

module.exports = validate;
