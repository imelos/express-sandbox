const express = require("express");
const publicRoutes = require("./routes/public");
const adminRoutes = require("./routes/admin");

const app = express();

app.disable("x-powered-by");
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use(publicRoutes);
app.use("/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((error, req, res, next) => {
  if (error.code === "23505") {
    return res.status(409).json({ error: "Resource already exists" });
  }

  if (error.code === "23503") {
    return res.status(400).json({ error: "Referenced resource does not exist" });
  }

  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    error: statusCode >= 500 ? "Internal server error" : error.message
  });
});

module.exports = app;
