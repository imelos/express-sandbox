exports.up = (pgm) => {
  pgm.createTable("locales", {
    id: "id",
    code: {
      type: "text",
      notNull: true,
      unique: true
    }
  });

  pgm.createTable("translations", {
    locale_id: {
      type: "integer",
      notNull: true,
      references: "locales(id)",
      onDelete: "CASCADE"
    },
    key: {
      type: "text",
      notNull: true
    },
    value: {
      type: "text",
      notNull: true
    }
  });

  pgm.addConstraint("translations", "translations_pkey", {
    primaryKey: ["locale_id", "key"]
  });

  pgm.createIndex("translations", ["locale_id", "key"], {
    name: "translations_locale_id_key_idx"
  });

  pgm.createTable("locale_versions", {
    locale_id: {
      type: "integer",
      primaryKey: true,
      references: "locales(id)",
      onDelete: "CASCADE"
    },
    version: {
      type: "integer",
      notNull: true,
      default: 1
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp")
    }
  });
};

exports.down = (pgm) => {
  pgm.dropTable("locale_versions");
  pgm.dropIndex("translations", ["locale_id", "key"], {
    name: "translations_locale_id_key_idx"
  });
  pgm.dropTable("translations");
  pgm.dropTable("locales");
};
