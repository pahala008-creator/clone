import { and, asc, count, eq, sql } from 'drizzle-orm'
import { db } from './db'
import { botSettings, contacts, type Contact } from './db/schema'

export type ParsedItem = { identifier: string; kind: 'phone' | 'username' }

export const MAX_ITEMS_PER_IMPORT = 5000
export const PAGE_SIZE = 20

const USERNAME_RE = /^@?([a-zA-Z][a-zA-Z0-9_]{4,31})$/

export function parseIdentifier(raw: string): ParsedItem | null {
  const value = raw.trim()
  if (!value) return null

  const username = value.match(USERNAME_RE)
  if (username) return { kind: 'username', identifier: `@${username[1].toLowerCase()}` }

  const cleaned = value.replace(/[\s\-().]/g, '')
  const phone = cleaned.match(/^(\+?)(\d{7,15})$/)
  if (phone) return { kind: 'phone', identifier: `${phone[1]}${phone[2]}` }

  return null
}

export function parseMany(raw: string) {
  const tokens = raw.split(/[\s,;]+/).filter(Boolean)
  const valid: ParsedItem[] = []
  const seen = new Set<string>()
  let invalid = 0
  let duplicatesInInput = 0

  for (const token of tokens) {
    const item = parseIdentifier(token)
    if (!item) {
      invalid++
      continue
    }
    const key = `${item.kind}:${item.identifier}`
    if (seen.has(key)) {
      duplicatesInInput++
      continue
    }
    seen.add(key)
    valid.push(item)
  }

  return { valid, invalid, duplicatesInInput, total: tokens.length }
}

export async function addMany(items: ParsedItem[], source: string) {
  let inserted = 0
  for (let i = 0; i < items.length; i += 500) {
    const chunk = items.slice(i, i + 500).map((item) => ({ ...item, source }))
    const rows = await db
      .insert(contacts)
      .values(chunk)
      .onConflictDoNothing({ target: [contacts.kind, contacts.identifier] })
      .returning({ id: contacts.id })
    inserted += rows.length
  }
  return { inserted, alreadySaved: items.length - inserted }
}

export async function getCounts() {
  const rows = await db
    .select({ kind: contacts.kind, total: count() })
    .from(contacts)
    .groupBy(contacts.kind)
  const phone = rows.find((r) => r.kind === 'phone')?.total ?? 0
  const username = rows.find((r) => r.kind === 'username')?.total ?? 0
  return { phone, username, total: phone + username }
}

export async function listPage(page: number) {
  const safePage = Math.max(1, Math.floor(page) || 1)
  const rows = await db
    .select()
    .from(contacts)
    .orderBy(asc(contacts.id))
    .limit(PAGE_SIZE)
    .offset((safePage - 1) * PAGE_SIZE)
  return { page: safePage, rows }
}

export async function listAll(): Promise<Contact[]> {
  return db.select().from(contacts).orderBy(asc(contacts.id))
}

export async function deleteOne(item: ParsedItem) {
  const rows = await db
    .delete(contacts)
    .where(and(eq(contacts.kind, item.kind), eq(contacts.identifier, item.identifier)))
    .returning({ id: contacts.id })
  return rows.length > 0
}

export async function deleteAll() {
  const rows = await db.delete(contacts).returning({ id: contacts.id })
  return rows.length
}

export async function setSetting(key: string, value: string) {
  await db
    .insert(botSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: botSettings.key, set: { value, updatedAt: sql`now()` } })
}

export async function getSetting(key: string) {
  const [row] = await db.select().from(botSettings).where(eq(botSettings.key, key)).limit(1)
  return row?.value ?? null
}

export async function clearSetting(key: string) {
  await db.delete(botSettings).where(eq(botSettings.key, key))
}
