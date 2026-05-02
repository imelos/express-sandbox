module.exports = {
  dir: "migrations",
  migrationsTable: "pgmigrations",
  databaseUrl: process.env.DATABASE_URL,
  ssl:
    process.env.DB_SSL === "true"
      ? {
          rejectUnauthorized:
            process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false"
        }
      : false
};
