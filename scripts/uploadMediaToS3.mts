/**
 * One-time migration: copy everything in `public/media` into the S3/MinIO
 * bucket, keyed by filename so existing `media` rows keep resolving.
 *
 * Run once after configuring S3_* in .env:
 *   npx tsx scripts/uploadMediaToS3.mts
 *
 * Safe to re-run — it overwrites by key rather than duplicating.
 */
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { config as loadEnv } from 'dotenv'
import fs from 'fs/promises'
import path from 'path'

loadEnv()

const { S3_ACCESS_KEY_ID, S3_BUCKET, S3_ENDPOINT, S3_REGION, S3_SECRET_ACCESS_KEY } = process.env

if (!S3_BUCKET || !S3_ENDPOINT || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
  console.error('Missing S3_BUCKET / S3_ENDPOINT / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY in .env')
  process.exit(1)
}

const MIME: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

const client = new S3Client({
  credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
  endpoint: S3_ENDPOINT,
  forcePathStyle: true, // MinIO uses path-style bucket addressing
  region: S3_REGION || 'us-east-1',
})

const dir = path.resolve(process.cwd(), 'public/media')
const files = await fs.readdir(dir).catch(() => [] as string[])

if (!files.length) {
  console.log('Nothing to upload — public/media is empty.')
  process.exit(0)
}

let ok = 0
let failed = 0

for (const name of files) {
  const full = path.join(dir, name)
  if (!(await fs.stat(full)).isFile()) continue

  try {
    await client.send(
      new PutObjectCommand({
        Body: await fs.readFile(full),
        Bucket: S3_BUCKET,
        ContentType: MIME[path.extname(name).toLowerCase()] || 'application/octet-stream',
        Key: name,
      }),
    )
    console.log(`  uploaded  ${name}`)
    ok++
  } catch (err) {
    console.error(`  FAILED    ${name}: ${err instanceof Error ? err.message : err}`)
    failed++
  }
}

console.log(`\n${ok} uploaded, ${failed} failed`)
process.exit(failed ? 1 : 0)
