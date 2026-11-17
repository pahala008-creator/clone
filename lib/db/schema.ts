import { pgTable, serial, text, timestamp, unique } from 'drizzle-orm/pg-core'

export const contacts = pgTable(
  'contacts',
  {
    id: serial('id').primaryKey(),
    identifier: text('identifier').notNull(),
    kind: text('kind', { enum: ['phone', 'username'] }).notNull(),
    source: text('source').notNull().default('text'),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.kind, t.identifier)],
)

export const botSettings = pgTable('bot_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Contact = typeof contacts.$inferSelect
