const express = require("express");
const jwt = require("jsonwebtoken");
const config = require("../config");
const db = require("../db");
const { requireAdmin } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  if (
    username !== config.adminUsername ||
    password !== config.adminPassword
  ) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      role: "admin",
      username
    },
    config.jwtSecret,
    {
      expiresIn: "12h"
    }
  );

  return res.json({ token });
});

router.use(requireAdmin);

router.post(
  "/locales",
  asyncHandler(async (req, res) => {
    const { code } = req.body || {};

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Field 'code' is required" });
    }

    const localeCode = code.trim().toLowerCase();

    if (!localeCode) {
      return res.status(400).json({ error: "Field 'code' cannot be empty" });
    }

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
  asyncHandler(async (req, res) => {
    const localeCode = String(req.params.code || "").trim().toLowerCase();

    if (!localeCode) {
      return res.status(400).json({ error: "Locale code is required" });
    }

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
  asyncHandler(async (req, res) => {
    const localeCode = String(req.params.locale || "").trim().toLowerCase();
    const translations = req.body;

    if (!translations || Array.isArray(translations) || typeof translations !== "object") {
      return res.status(400).json({ error: "Body must be a JSON object" });
    }

    for (const [key, value] of Object.entries(translations)) {
      if (!key.trim()) {
        return res.status(400).json({ error: "Translation keys cannot be empty" });
      }

      if (typeof value !== "string") {
        return res.status(400).json({ error: `Translation '${key}' must be a string` });
      }
    }

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

      for (const [key, value] of entries) {
        await client.query(
          `
            INSERT INTO translations (locale_id, key, value)
            VALUES ($1, $2, $3)
          `,
          [localeId, key, value]
        );
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
