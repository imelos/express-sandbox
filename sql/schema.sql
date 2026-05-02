CREATE TABLE locales (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL
);

CREATE TABLE translations (
  locale_id INT NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (locale_id, key)
);

CREATE INDEX translations_locale_id_key_idx
  ON translations (locale_id, key);

CREATE TABLE locale_versions (
  locale_id INT PRIMARY KEY REFERENCES locales(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
