const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found on ${req.method} ${req.originalUrl}`,
  });
};

module.exports = notFoundHandler;
