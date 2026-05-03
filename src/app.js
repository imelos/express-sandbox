const express = require("express");
const helmet = require("helmet");
const config = require("./config");
const requestContext = require("./middleware/requestContext");
const requestLogger = require("./middleware/requestLogger");
const publicRoutes = require("./routes/public");
const adminRoutes = require("./routes/admin");
const logger = require("./utils/logger");

const app = express();

app.disable("x-powered-by");
app.use(requestContext);
app.use(requestLogger);
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(express.json({ limit: config.jsonBodyLimit }));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use(publicRoutes);
app.use("/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((error, req, res, next) => {
  if (error.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body too large" });
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  if (error.code === "23505") {
    return res.status(409).json({ error: "Resource already exists" });
  }

  if (error.code === "23503") {
    return res.status(400).json({ error: "Referenced resource does not exist" });
  }

  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    logger.error("request.failed", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode,
      errorMessage: error.message,
      errorStack: error.stack
    });
  }

  res.status(statusCode).json({
    error: statusCode >= 500 ? "Internal server error" : error.message
  });
});

module.exports = app;
