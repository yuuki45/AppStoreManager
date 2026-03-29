import { randomBytes, createCipheriv, createDecipheriv } from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const EXPECTED_KEY_LENGTH = 32

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set")
  }
  const buf = Buffer.from(key, "hex")
  if (buf.length !== EXPECTED_KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must be ${EXPECTED_KEY_LENGTH} bytes (${EXPECTED_KEY_LENGTH * 2} hex chars), got ${buf.length} bytes`
    )
  }
  return buf
}

export function encrypt(text: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })

  let encrypted = cipher.update(text, "utf8", "base64")
  encrypted += cipher.final("base64")
  const authTag = cipher.getAuthTag()

  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  const key = getKey()
  const parts = encryptedText.split(":")

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted text format: expected iv:authTag:data")
  }

  const [ivB64, authTagB64, encrypted] = parts
  const iv = Buffer.from(ivB64, "base64")
  const authTag = Buffer.from(authTagB64, "base64")

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, "base64", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}
