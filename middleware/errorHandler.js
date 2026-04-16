const { ValidationError } = require('sequelize');

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // Default error status and message
  let statusCode = err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errors = [];

  // Handle Sequelize validation errors
  if (err instanceof ValidationError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  // Handle token expiration
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Handle duplicate key errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = 'Duplicate entry';
    errors = err.errors.map(e => ({
      field: e.path,
      message: `${e.value} is already in use`
    }));
  }

  // Send error response
  if (req.accepts('json')) {
    res.status(statusCode).json({
      success: false,
      message,
      errors: errors.length ? errors : undefined,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  } else {
    // For non-API routes, render an error page
    res.status(statusCode).render('error', {
      title: `Error ${statusCode}`,
      message,
      status: statusCode,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

module.exports = { errorHandler };
