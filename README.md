# Translation Backend

Minimal Express + PostgreSQL backend for frontend UI localization with:

- locale management
- full-locale translation replacement
- JWT-protected admin endpoints
- DB-backed admin users with hashed passwords
- ETag-based client sync via locale version numbers
- migration-based schema management for production

## Why the schema is adjusted

Your draft repeated the `locales` table definition where the `translations` table should be. This implementation uses:

- `locales(id, code)`
- `translations(locale_id, key, value)`
- `locale_versions(locale_id, version, updated_at)`

That is the minimum schema needed to support keyed translations plus O(1) ETag lookups.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Run migrations:

```bash
npm run migrate:up
```

4. Create the first admin user:

```bash
node src/scripts/createAdminUser.js admin strong-password
```

5. Start the server:

```bash
npm run dev
```

## AWS RDS

For Amazon RDS, point `DATABASE_URL` at the RDS Postgres instance:

```env
DATABASE_URL=postgres://username:password@db-name.xxxxxx.us-east-1.rds.amazonaws.com:5432/translations_db
```

Typical production settings:

```env
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
DB_POOL_MAX=10
```

Run migrations from any machine or CI job that can reach the RDS instance:

```bash
npm run migrate:up
```

`schema.sql` can still be used as a bootstrap/reference file, but production deployments should use migrations.

## Public API

### `GET /translations?locale=en`

Request header:

```http
If-None-Match: "3"
```

Responses:

- `304 Not Modified` with `ETag: "3"` and no body when unchanged
- `200 OK` with `ETag: "4"` and the full translation object when changed

### `GET /locales`

Returns an array of locale codes for the UI language selector:

```json
["en", "fr", "ru"]
```

## Admin API

### `POST /admin/login`

```json
{
  "username": "admin",
  "password": "change-me"
}
```

`username` is matched against the `admin_users` table and `password` is verified against a bcrypt hash.

### `POST /admin/locales`

```json
{
  "code": "en"
}
```

### `DELETE /admin/locales/:code`

Deletes the locale and cascades translations/version state.

### `PUT /admin/translations/:locale`

Replaces the entire locale payload and bumps the version:

```json
{
  "hello": "Hello",
  "welcome": "Welcome"
}
```

Admin should read the current locale payload through the public endpoint:

```http
GET /translations?locale=en
```

and write changes back through:

```http
PUT /admin/translations/en
```

This keeps the model simple: translations are always replaced as a whole locale object.

## Production notes

- Use AWS Secrets Manager or Parameter Store for `DATABASE_URL` and `JWT_SECRET`.
- Run `npm run migrate:up` during deployment before starting the app.
- Lock down the RDS security group so only your app/CI can connect.
- Create admin users through a secure operational flow, not by hardcoding credentials in source control.

## Suggested improvements

- Add request validation with a schema library such as `zod` or `joi`.
- If your translation files get large, add Redis caching keyed by `locale:version`.
- If you need audit history, add a `translation_events` table instead of overwriting in place.
