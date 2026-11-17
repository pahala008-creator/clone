# Contact Manager Bot

Owner-only Telegram webhook bot on Next.js + Neon Postgres. Save phone numbers and @usernames you enter yourself, then list, count, export (.txt/.json) or delete them. It does not look up or check accounts on Telegram.

## Environment variables

- `DATABASE_URL` – provided by the Neon integration
- `TELEGRAM_BOT_TOKEN` – from @BotFather
- `TELEGRAM_OWNER_ID` – your numeric Telegram user ID
- `TELEGRAM_WEBHOOK_SECRET` – long random string

## Connect

After publishing, open `https://<your-domain>/api/telegram/setup?key=<TELEGRAM_WEBHOOK_SECRET>` once to register the webhook and command menu.

## Database

```sql
CREATE TABLE contacts (id serial PRIMARY KEY, identifier text NOT NULL, kind text NOT NULL CHECK (kind IN ('phone','username')), source text NOT NULL DEFAULT 'text', note text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (kind, identifier));
CREATE TABLE bot_settings (key text PRIMARY KEY, value text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
```
