const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config");
const db = require("../db");
const { requireAdmin } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validation");
const { loginRateLimiter, adminRateLimiter } = require("../middleware/rateLimiters");
const {
  loginBodySchema,
  createLocaleBodySchema,
  localeParamsSchema,
  translationParamsSchema,
  translationsBodySchema
} = require("../schemas");

const router = express.Router();

function buildBulkTranslationsInsert(localeId, entries) {
  const placeholders = [];
  const values = [];

  entries.forEach(([key, value], index) => {
    const base = index * 3;
    placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
    values.push(localeId, key, value);
  });

  return {
    text: `
      INSERT INTO translations (locale_id, key, value)
      VALUES ${placeholders.join(", ")}
    `,
    values
  };
}

router.post("/login", loginRateLimiter, validate(loginBodySchema), asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const result = await db.query(
    `
      SELECT id, username, password_hash
      FROM admin_users
      WHERE username = $1
    `,
    [username]
  );

  if (result.rowCount === 0) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const adminUser = result.rows[0];
  const passwordMatches = await bcrypt.compare(password, adminUser.password_hash);

  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      role: "admin",
      adminUserId: adminUser.id,
      username: adminUser.username
    },
    config.jwtSecret,
    {
      expiresIn: "12h"
    }
  );

  return res.json({ token });
}));

router.use(adminRateLimiter);
router.use(requireAdmin);

router.post(
  "/locales",
  validate(createLocaleBodySchema),
  asyncHandler(async (req, res) => {
    const { code: localeCode } = req.body;

    const result = await db.withTransaction(async (client) => {
      const insertedLocale = await client.query(
        `
          INSERT INTO locales (code)
          VALUES ($1)
          RETURNING id, code
        `,
        [localeCode]
      );

      await client.query(
        `
          INSERT INTO locale_versions (locale_id, version)
          VALUES ($1, 1)
        `,
        [insertedLocale.rows[0].id]
      );

      return insertedLocale.rows[0];
    });

    res.status(201).json(result);
  })
);

router.delete(
  "/locales/:code",
  validate(localeParamsSchema, "params"),
  asyncHandler(async (req, res) => {
    const { code: localeCode } = req.params;

    const result = await db.query(
      "DELETE FROM locales WHERE code = $1 RETURNING code",
      [localeCode]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Locale not found" });
    }

    return res.status(204).end();
  })
);

router.put(
  "/translations/:locale",
  validate(translationParamsSchema, "params"),
  validate(translationsBodySchema),
  asyncHandler(async (req, res) => {
    const { locale: localeCode } = req.params;
    const translations = req.body;

    const result = await db.withTransaction(async (client) => {
      const localeResult = await client.query(
        "SELECT id, code FROM locales WHERE code = $1",
        [localeCode]
      );

      if (localeResult.rowCount === 0) {
        const error = new Error("Locale not found");
        error.statusCode = 404;
        throw error;
      }

      const localeId = localeResult.rows[0].id;

      await client.query("DELETE FROM translations WHERE locale_id = $1", [localeId]);

      const entries = Object.entries(translations);
      let nextVersion = null;

      if (entries.length > 0) {
        const bulkInsert = buildBulkTranslationsInsert(localeId, entries);
        await client.query(bulkInsert.text, bulkInsert.values);
      }

      const versionResult = await client.query(
        `
          INSERT INTO locale_versions (locale_id, version)
          VALUES ($1, 2)
          ON CONFLICT (locale_id)
          DO UPDATE SET version = locale_versions.version + 1
          RETURNING version
        `,
        [localeId]
      );
      nextVersion = versionResult.rows[0].version;

      return {
        locale: localeCode,
        version: nextVersion,
        translationsCount: entries.length
      };
    });

    res.json(result);
  })
);

module.exports = router;
