import type { CollectionBeforeOperationHook } from 'payload'
import { fileTypeFromBuffer } from 'file-type'
import sharp from 'sharp'

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

/**
 * guide.md 10.2: 파일당 최대 10MB, MIME type과 실제 파일 시그니처를 모두
 * 검사, 업로드 즉시 EXIF/GPS 메타데이터를 제거한다.
 * Payload's declared mimetype comes from the client and is not trustworthy on
 * its own, so the actual file bytes are re-sniffed here before anything is
 * written to storage.
 */
export const validateAndStripImage: CollectionBeforeOperationHook = async ({ req, operation }) => {
  if (operation !== 'create' && operation !== 'update') return
  const file = req.file
  if (!file) return

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('파일 용량은 10MB를 초과할 수 없습니다.')
  }

  const detected = await fileTypeFromBuffer(file.data)

  if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
    throw new Error('허용되지 않은 파일 형식입니다. JPG, PNG, WebP 파일만 업로드할 수 있습니다.')
  }

  if (detected.mime !== file.mimetype) {
    throw new Error('파일 내용과 파일 형식이 일치하지 않습니다.')
  }

  // sharp omits all metadata (EXIF/ICC/IPTC/XMP, including GPS) from the
  // output by default unless .withMetadata() is called, so simply not
  // calling it is what strips it. .rotate() bakes in the EXIF orientation
  // before that metadata is dropped, so the image doesn't appear rotated.
  const stripped = await sharp(file.data).rotate().toBuffer()

  file.data = stripped
  file.size = stripped.length
}
