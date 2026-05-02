const { Pool } = require("pg");
const config = require("./config");

const poolConfig = {
  max: config.dbPoolMax,
  idleTimeoutMillis: config.dbIdleTimeoutMs,
  connectionTimeoutMillis: config.dbConnectionTimeoutMs,
  connectionString: config.databaseUrl
};

if (config.dbSsl) {
  poolConfig.ssl = {
    rejectUnauthorized: config.dbSslRejectUnauthorized
  };
}

const pool = new Pool(poolConfig);

async function withTransaction(work) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  withTransaction
};
