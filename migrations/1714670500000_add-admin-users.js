exports.up = (pgm) => {
  pgm.createTable("admin_users", {
    id: "id",
    username: {
      type: "text",
      notNull: true,
      unique: true
    },
    password_hash: {
      type: "text",
      notNull: true
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp")
    }
  });
};

exports.down = (pgm) => {
  pgm.dropTable("admin_users");
};
