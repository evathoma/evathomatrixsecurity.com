/**
 * Centralized Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const requestedStatus = Number(err.status || err.statusCode);
  const statusCode = requestedStatus >= 400 && requestedStatus <= 599 ? requestedStatus : 500;
  const clientMessages = {
    400: 'The request could not be understood. Please check the submitted information.',
    413: 'The submitted request is too large.',
    415: 'This request format is not supported.',
    429: 'Too many requests. Please try again later.',
  };
  const message = err.validationError
    ? err.message
    : clientMessages[statusCode];

  console.error(JSON.stringify({
    event: 'request.error',
    method: req.method,
    path: req.path,
    statusCode,
    code: err.code || undefined,
  }));

  res.status(statusCode).json({
    status: 'error',
    message: message || 'An unexpected error occurred. Please try again later.',
  });
}

module.exports = {
  errorHandler,
};
