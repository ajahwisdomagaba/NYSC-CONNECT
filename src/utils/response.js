exports.successResponse = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data
  });
};

exports.errorResponse = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  return res.status(statusCode).json({
    status: 'error',
    message,
    ...(errors && { errors })
  });
};