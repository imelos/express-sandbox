const crypto = require("crypto");

function requestContext(req, res, next) {
  req.requestId = crypto.randomUUID();
  res.set("X-Request-Id", req.requestId);
  next();
}

module.exports = requestContext;
