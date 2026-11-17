const API = 'https://api.telegram.org'

function token() {
  const value = process.env.TELEGRAM_BOT_TOKEN
  if (!value) throw new Error('TELEGRAM_BOT_TOKEN is not set')
  return value
}

export async function callTelegram<T = unknown>(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${API}/bot${token()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as { ok: boolean; result?: T; description?: string }
  if (!data.ok) throw new Error(`Telegram ${method} failed: ${data.description ?? res.status}`)
  return data.result as T
}

export function sendMessage(chatId: number, text: string) {
  return callTelegram('sendMessage', { chat_id: chatId, text: text.slice(0, 4000) })
}

export async function sendDocument(chatId: number, filename: string, content: string, mime: string) {
  const form = new FormData()
  form.append('chat_id', String(chatId))
  form.append('document', new Blob([content], { type: mime }), filename)
  const res = await fetch(`${API}/bot${token()}/sendDocument`, { method: 'POST', body: form })
  const data = (await res.json()) as { ok: boolean; description?: string }
  if (!data.ok) throw new Error(`Telegram sendDocument failed: ${data.description ?? res.status}`)
}

export async function downloadFile(fileId: string, maxBytes: number) {
  const file = await callTelegram<{ file_path?: string; file_size?: number }>('getFile', { file_id: fileId })
  if (!file.file_path) throw new Error('File is not available for download')
  if (file.file_size && file.file_size > maxBytes) throw new Error('File is too large')
  const res = await fetch(`${API}/file/bot${token()}/${file.file_path}`)
  if (!res.ok) throw new Error('Could not download file')
  const text = await res.text()
  if (text.length > maxBytes) throw new Error('File is too large')
  return text
}

export type TelegramMessage = {
  message_id: number
  chat: { id: number; type: string }
  from?: { id: number }
  text?: string
  document?: { file_id: string; file_name?: string; file_size?: number; mime_type?: string }
}

export type TelegramUpdate = { update_id: number; message?: TelegramMessage }
