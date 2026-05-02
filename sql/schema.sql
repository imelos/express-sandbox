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

CREATE OR REPLACE FUNCTION bump_locale_version(target_locale_id INT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO locale_versions (locale_id, version, updated_at)
  VALUES (target_locale_id, 2, NOW())
  ON CONFLICT (locale_id)
  DO UPDATE
    SET version = locale_versions.version + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
