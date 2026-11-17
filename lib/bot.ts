import {
  MAX_ITEMS_PER_IMPORT,
  PAGE_SIZE,
  addMany,
  clearSetting,
  deleteAll,
  deleteOne,
  getCounts,
  getSetting,
  listAll,
  listPage,
  parseIdentifier,
  parseMany,
  setSetting,
} from './contacts'
import { downloadFile, sendDocument, sendMessage, type TelegramMessage } from './telegram'

const MAX_FILE_BYTES = 512 * 1024
const DELETE_CONFIRM_KEY = 'delete_all_requested_at'
const DELETE_CONFIRM_WINDOW_MS = 5 * 60 * 1000

export const BOT_COMMANDS = [
  { command: 'help', description: 'Show available commands' },
  { command: 'add', description: 'Save numbers or @usernames' },
  { command: 'list', description: 'List saved contacts, e.g. /list 2' },
  { command: 'count', description: 'Show how many contacts are saved' },
  { command: 'export', description: 'Download contacts as a .txt file' },
  { command: 'exportjson', description: 'Download contacts as a .json file' },
  { command: 'delete', description: 'Delete one contact' },
  { command: 'deleteall', description: 'Delete every contact (asks to confirm)' },
]

const HELP = [
  'Contact manager',
  '',
  'Send numbers or @usernames as plain text, or upload a .txt/.csv file, to save them.',
  'Separate entries with spaces, commas or new lines.',
  '',
  ...BOT_COMMANDS.map((c) => `/${c.command} - ${c.description}`),
].join('\n')

export function isOwner(message: TelegramMessage) {
  const owner = process.env.TELEGRAM_OWNER_ID
  return Boolean(owner && message.from && String(message.from.id) === owner.trim())
}

async function importText(chatId: number, raw: string, source: string) {
  const parsed = parseMany(raw)
  if (parsed.total > MAX_ITEMS_PER_IMPORT) {
    return sendMessage(chatId, `Too many entries (${parsed.total}). Send at most ${MAX_ITEMS_PER_IMPORT} at a time.`)
  }
  if (parsed.valid.length === 0) {
    return sendMessage(chatId, 'No valid phone numbers or @usernames found. Send /help for the format.')
  }
  const result = await addMany(parsed.valid, source)
  return sendMessage(
    chatId,
    [
      `Saved ${result.inserted} new contact(s).`,
      result.alreadySaved ? `${result.alreadySaved} were already saved.` : null,
      parsed.duplicatesInInput ? `${parsed.duplicatesInInput} duplicate(s) in your input were skipped.` : null,
      parsed.invalid ? `${parsed.invalid} entr${parsed.invalid === 1 ? 'y was' : 'ies were'} not valid.` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  )
}

async function handleCommand(chatId: number, command: string, args: string) {
  switch (command) {
    case 'start':
    case 'help':
      return sendMessage(chatId, HELP)

    case 'add':
      if (!args) return sendMessage(chatId, 'Usage: /add +628123456789 @someone')
      return importText(chatId, args, 'text')

    case 'list': {
      const { total } = await getCounts()
      const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
      const { page, rows } = await listPage(Number(args) || 1)
      if (rows.length === 0) return sendMessage(chatId, total ? `Page ${page} is empty. There are ${pages} page(s).` : 'No contacts saved yet.')
      const start = (page - 1) * PAGE_SIZE
      const lines = rows.map((r, i) => `${start + i + 1}. ${r.identifier}`)
      return sendMessage(chatId, [`Page ${page}/${pages} (${total} total)`, '', ...lines].join('\n'))
    }

    case 'count': {
      const counts = await getCounts()
      return sendMessage(chatId, `Total: ${counts.total}\nPhone numbers: ${counts.phone}\nUsernames: ${counts.username}`)
    }

    case 'export':
    case 'exportjson': {
      const rows = await listAll()
      if (rows.length === 0) return sendMessage(chatId, 'No contacts to export.')
      const stamp = new Date().toISOString().slice(0, 10)
      if (command === 'export') {
        return sendDocument(chatId, `contacts-${stamp}.txt`, rows.map((r) => r.identifier).join('\n'), 'text/plain')
      }
      const json = JSON.stringify(
        rows.map((r) => ({ identifier: r.identifier, kind: r.kind, source: r.source, createdAt: r.createdAt })),
        null,
        2,
      )
      return sendDocument(chatId, `contacts-${stamp}.json`, json, 'application/json')
    }

    case 'delete': {
      const item = parseIdentifier(args)
      if (!item) return sendMessage(chatId, 'Usage: /delete +628123456789 or /delete @someone')
      const removed = await deleteOne(item)
      return sendMessage(chatId, removed ? `Deleted ${item.identifier}.` : `${item.identifier} was not saved.`)
    }

    case 'deleteall': {
      const { total } = await getCounts()
      if (total === 0) return sendMessage(chatId, 'There are no contacts to delete.')
      await setSetting(DELETE_CONFIRM_KEY, String(Date.now()))
      return sendMessage(chatId, `This will permanently delete all ${total} contacts.\nSend /confirmdelete within 5 minutes to continue, or /cancel.`)
    }

    case 'confirmdelete': {
      const requestedAt = Number(await getSetting(DELETE_CONFIRM_KEY))
      await clearSetting(DELETE_CONFIRM_KEY)
      if (!requestedAt || Date.now() - requestedAt > DELETE_CONFIRM_WINDOW_MS) {
        return sendMessage(chatId, 'No pending delete request. Send /deleteall first.')
      }
      const removed = await deleteAll()
      return sendMessage(chatId, `Deleted ${removed} contact(s).`)
    }

    case 'cancel':
      await clearSetting(DELETE_CONFIRM_KEY)
      return sendMessage(chatId, 'Cancelled.')

    default:
      return sendMessage(chatId, 'Unknown command. Send /help to see what I can do.')
  }
}

export async function handleMessage(message: TelegramMessage) {
  const chatId = message.chat.id
  if (message.chat.type !== 'private' || !isOwner(message)) return

  if (message.document) {
    const name = message.document.file_name?.toLowerCase() ?? ''
    if (!name.endsWith('.txt') && !name.endsWith('.csv')) {
      return sendMessage(chatId, 'Only .txt and .csv files are supported.')
    }
    if ((message.document.file_size ?? 0) > MAX_FILE_BYTES) {
      return sendMessage(chatId, 'That file is too large. The limit is 512 KB.')
    }
    const content = await downloadFile(message.document.file_id, MAX_FILE_BYTES)
    return importText(chatId, content, 'file')
  }

  const text = message.text?.trim()
  if (!text) return

  if (text.startsWith('/')) {
    const [head, ...rest] = text.split(/\s+/)
    const command = head.slice(1).split('@')[0].toLowerCase()
    return handleCommand(chatId, command, rest.join(' ').trim())
  }

  return importText(chatId, text, 'text')
}
