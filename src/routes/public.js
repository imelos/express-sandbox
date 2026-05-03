const express = require("express");
const db = require("../db");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validation");
const { translationsQuerySchema } = require("../schemas");
const { formatEtag, parseIfNoneMatch } = require("../utils/http");

const router = express.Router();

router.get(
  "/locales",
  asyncHandler(async (req, res) => {
    const result = await db.query(
      "SELECT code FROM locales ORDER BY code ASC"
    );

    res.json(result.rows.map((row) => row.code));
  })
);

router.get(
  "/translations",
  validate(translationsQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const { locale } = req.query;

    const localeResult = await db.query(
      `
        SELECT l.id, l.code, COALESCE(lv.version, 1) AS version
        FROM locales l
        LEFT JOIN locale_versions lv ON lv.locale_id = l.id
        WHERE l.code = $1
      `,
      [locale]
    );

    if (localeResult.rowCount === 0) {
      return res.status(404).json({ error: "Locale not found" });
    }

    const localeRow = localeResult.rows[0];
    const etag = formatEtag(localeRow.version);
    const incomingEtag = parseIfNoneMatch(req.headers["if-none-match"]);

    if (incomingEtag === etag) {
      res.set("Cache-Control", "public, must-revalidate");
      res.set("ETag", etag);
      return res.status(304).end();
    }

    const translationsResult = await db.query(
      `
        SELECT key, value
        FROM translations
        WHERE locale_id = $1
        ORDER BY key ASC
      `,
      [localeRow.id]
    );

    const payload = Object.fromEntries(
      translationsResult.rows.map((row) => [row.key, row.value])
    );

    res.set("Cache-Control", "public, must-revalidate");
    res.set("ETag", etag);
    return res.json(payload);
  })
);

module.exports = router;
