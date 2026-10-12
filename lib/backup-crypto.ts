import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

/**
 * 백업 JSON 암호화(AES-256-GCM). Blob 플러그인이 access:'public'만 지원해 업로드된
 * 파일 URL을 아는 사람은 누구나 내려받을 수 있으므로, 파일 자체를 암호화해
 * URL이 새도 내용이 보이지 않게 한다.
 *
 * 키: BACKUP_ENCRYPTION_KEY — 32바이트를 base64로 인코딩한 값
 *   (생성: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))").
 * 키를 잃으면 백업을 복구할 수 없으므로 Vercel 환경변수 외에 별도 장소에도 보관할 것.
 */

type Envelope = { v: 1; alg: 'aes-256-gcm'; iv: string; tag: string; data: string }

function parseKey(keyB64: string | undefined): Buffer {
  if (!keyB64) throw new Error('BACKUP_ENCRYPTION_KEY가 설정되지 않았습니다.')
  const key = Buffer.from(keyB64, 'base64')
  if (key.length !== 32) {
    throw new Error('BACKUP_ENCRYPTION_KEY는 32바이트를 base64로 인코딩한 값이어야 합니다.')
  }
  return key
}

export function encryptBackup(plaintext: string, keyB64: string | undefined): string {
  const key = parseKey(keyB64)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const data = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const envelope: Envelope = {
    v: 1,
    alg: 'aes-256-gcm',
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: data.toString('base64'),
  }
  return JSON.stringify(envelope)
}

/** 암호화된 백업 봉투인지 확인한다(기존 평문 백업과 구분). */
export function isEncryptedBackup(parsed: unknown): parsed is Envelope {
  return (
    !!parsed &&
    typeof parsed === 'object' &&
    (parsed as Envelope).v === 1 &&
    (parsed as Envelope).alg === 'aes-256-gcm' &&
    typeof (parsed as Envelope).data === 'string'
  )
}

export function decryptBackup(envelope: Envelope, keyB64: string | undefined): string {
  const key = parseKey(keyB64)
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'))
  try {
    return Buffer.concat([
      decipher.update(Buffer.from(envelope.data, 'base64')),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    throw new Error('백업 복호화에 실패했습니다. 키가 틀렸거나 파일이 손상됐습니다.')
  }
}
