import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import { getPayload } from 'payload'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import config from '@/payload.config'
import { verifyDownloadToken } from '@/lib/downloads/token'
import { vi } from '@/lib/i18n/vi'
import type { Product, PrivateFile } from '@/payload-types'

export const dynamic = 'force-dynamic'

const { S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION } = process.env
const storageEnabled = Boolean(S3_BUCKET && S3_ENDPOINT && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY)

let s3ClientInstance: S3Client | null = null
function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION || 'auto',
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID || '',
        secretAccessKey: S3_SECRET_ACCESS_KEY || '',
      },
    })
  }
  return s3ClientInstance
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await params

  // REVIEW-REQUIRED: Download token verification (HMAC-SHA256, 7-day expiration, file-product association check)
  const result = verifyDownloadToken(token)
  if (!result.valid) {
    if (result.reason === 'expired') {
      return new Response(vi.resource.downloadExpired, {
        status: 410,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }
    return new Response(vi.resource.downloadInvalid, {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const { productId, fileId } = result.payload
  const payload = await getPayload({ config })

  // 1. Verify that product exists
  let product: Product | null = null
  try {
    product = await payload.findByID({
      collection: 'products',
      id: productId,
      depth: 1,
      overrideAccess: true,
    })
  } catch {
    return new Response(vi.resource.downloadNotFound, {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  if (!product) {
    return new Response(vi.resource.downloadNotFound, {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  // Check product is published, saleStatus = free, and type in ['ebook', 'toolkit']
  const isEligibleFreeResource =
    product._status === 'published' &&
    product.saleStatus === 'free' &&
    (product.type === 'ebook' || product.type === 'toolkit')

  if (!isEligibleFreeResource) {
    return new Response(vi.resource.noLongerFree, {
      status: 410,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  // 2. Verify that file belongs to product.files
  const productFiles = Array.isArray(product.files) ? product.files : []
  const belongsToProduct = productFiles.some((f) => {
    const currentFileId = typeof f.file === 'object' && f.file !== null ? f.file.id : f.file
    return String(currentFileId) === String(fileId)
  })

  if (!belongsToProduct) {
    return new Response('Tài liệu không còn thuộc sản phẩm này.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  // 3. Retrieve privateFiles document
  let fileDoc: PrivateFile | null = null
  try {
    fileDoc = await payload.findByID({
      collection: 'privateFiles',
      id: fileId,
      depth: 0,
      overrideAccess: true,
    })
  } catch {
    return new Response('Tập tin không tồn tại.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  if (!fileDoc || !fileDoc.filename) {
    return new Response('Tập tin không tồn tại.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  // 4. Stream file without redirection to public URL
  const filename = fileDoc.filename
  const encodedFilename = encodeURIComponent(filename)
  const mimeType = fileDoc.mimeType || 'application/octet-stream'

  const headers = new Headers()
  headers.set('Content-Type', mimeType)
  headers.set(
    'Content-Disposition',
    `attachment; filename="${filename.replace(/"/g, '')}"; filename*=UTF-8''${encodedFilename}`,
  )
  if (fileDoc.filesize) {
    headers.set('Content-Length', String(fileDoc.filesize))
  }
  headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')

  if (storageEnabled) {
    const s3 = getS3Client()
    const key = fileDoc.prefix ? `${fileDoc.prefix}/${filename}` : filename
    try {
      const s3Res = await s3.send(
        new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
        }),
      )
      if (!s3Res.Body) {
        return new Response('Không thể đọc dữ liệu tập tin từ lưu trữ đám mây.', { status: 500 })
      }
      const webStream = s3Res.Body.transformToWebStream()
      return new Response(webStream, { headers })
    } catch (err) {
      console.error('[Download] Failed to fetch object from S3:', err)
      return new Response('Không thể tải tập tin từ lưu trữ.', { status: 500 })
    }
  } else {
    const filePath = path.resolve(process.cwd(), 'private', filename)
    if (!fs.existsSync(filePath)) {
      return new Response('Tập tin không tìm thấy trên máy chủ lưu trữ.', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    const nodeStream = fs.createReadStream(filePath)
    const webStream = Readable.toWeb(nodeStream) as ReadableStream
    return new Response(webStream, { headers })
  }
}
