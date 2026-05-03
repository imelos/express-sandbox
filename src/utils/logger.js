const config = require("../config");

function log(level, message, fields = {}) {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    env: config.env,
    ...fields
  };

  const serialized = JSON.stringify(entry);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  console.log(serialized);
}

module.exports = {
  info: (message, fields) => log("info", message, fields),
  warn: (message, fields) => log("warn", message, fields),
  error: (message, fields) => log("error", message, fields)
};
