export function toUnixEpoch(date: string): number {
  const normalizedDate = /^\d{4}-\d{2}$/.test(date) ? `${date}-01` : date
  const milliseconds = Date.parse(normalizedDate)
  if (!Number.isFinite(milliseconds)) {
    throw new Error(`Invalid publication date: ${date}`)
  }
  return Math.floor(milliseconds / 1000)
}

export function splitText(text: string, maxLength: number): string[] {
  const remainingText = text.trim()
  if (remainingText.length <= maxLength) return remainingText ? [remainingText] : []

  const chunks: string[] = []
  let remaining = remainingText
  while (remaining.length > maxLength) {
    let splitAt = remaining.lastIndexOf("\n", maxLength)
    if (splitAt < maxLength / 2) splitAt = remaining.lastIndexOf(" ", maxLength)
    if (splitAt <= 0) splitAt = maxLength

    chunks.push(remaining.slice(0, splitAt).trim())
    remaining = remaining.slice(splitAt).trim()
  }
  if (remaining) chunks.push(remaining)
  return chunks
}

export function computeHkey(text: string): string {
  return new Bun.CryptoHasher("sha256").update(text).digest("hex")
}