#!/usr/bin/env node

const bcrypt = require("bcryptjs");
const db = require("../db");

async function main() {
  const username = String(process.argv[2] || "").trim().toLowerCase();
  const password = String(process.argv[3] || "");

  if (!username || !password) {
    console.error("Usage: node src/scripts/createAdminUser.js <username> <password>");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const result = await db.query(
      `
        INSERT INTO admin_users (username, password_hash)
        VALUES ($1, $2)
        RETURNING id, username, created_at
      `,
      [username, passwordHash]
    );

    console.log(JSON.stringify(result.rows[0], null, 2));
  } finally {
    await db.pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
