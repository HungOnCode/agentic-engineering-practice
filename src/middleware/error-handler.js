function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  // Services throw plain { status, message } objects for expected errors; only log real failures
  if (status >= 500) console.error(err.stack || err);
  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = { errorHandler };
