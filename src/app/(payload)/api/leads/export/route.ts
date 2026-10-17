import { headers } from 'next/headers'
import { getPayload, type Where } from 'payload'
import config from '@/payload.config'

/**
 * Escapes a single CSV cell value and guards against CSV Formula Injection.
 * Prefixes formulas starting with =, +, -, @ with a single quote (').
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let str = String(value)
  // Anti-CSV injection: disable dynamic formulas in spreadsheet apps (Excel, Sheets)
  if (str.length > 0 && ['=', '+', '-', '@', '\t', '\r'].includes(str.charAt(0))) {
    str = `'${str}`
  }
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(request: Request): Promise<Response> {
  const payload = await getPayload({ config })
  let requestHeaders: Headers
  try {
    requestHeaders = await headers()
    if (Array.from(requestHeaders.keys()).length === 0) {
      requestHeaders = new Headers(request.headers)
    }
  } catch {
    requestHeaders = new Headers(request.headers)
  }

  // REVIEW-REQUIRED: Personal data (NĐ 13/2023). Only owner and editor are permitted to export leads.
  const { user } = await payload.auth({ headers: requestHeaders })
  if (!user || user.collection !== 'users') {
    return new Response('Chưa đăng nhập', { status: 401 })
  }

  if (user.role !== 'owner' && user.role !== 'editor') {
    return new Response('Không có quyền truy cập', { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const andConditions: Where[] = []

  const need = searchParams.get('need')
  if (need) {
    andConditions.push({ need: { equals: need } })
  }

  const followUpStatus = searchParams.get('followUpStatus')
  if (followUpStatus) {
    andConditions.push({ followUpStatus: { equals: followUpStatus } })
  }

  const form = searchParams.get('form')
  if (form) {
    andConditions.push({ 'source.form': { equals: form } })
  }

  const where = andConditions.length > 0 ? { and: andConditions } : undefined

  const result = await payload.find({
    collection: 'leads',
    where,
    limit: 10000,
    sort: '-createdAt',
    overrideAccess: true,
  })

  const headerRow = [
    'ID',
    'Họ và tên',
    'Email',
    'Số điện thoại',
    'Nhu cầu',
    'Dịch vụ quan tâm',
    'Gói quan tâm',
    'Chương trình quan tâm',
    'Tình trạng hiện tại',
    'Công ty',
    'Vai trò người liên hệ',
    'Quy mô đội ngũ',
    'Hành vi mục tiêu',
    'Thời gian dự kiến',
    'Lời nhắn',
    'Thẻ quan tâm',
    'Tình trạng chăm sóc',
    'Nguồn form',
    'Nguồn trang',
    'UTM',
    'Đồng ý bảo mật',
    'Thời điểm đồng ý',
    'Ngày tạo',
  ]

  const needMap: Record<string, string> = {
    personal: 'Cá nhân',
    business: 'Doanh nghiệp',
    resource: 'Tài nguyên',
  }

  const statusMap: Record<string, string> = {
    new: 'Mới',
    contacted: 'Đã liên hệ',
    converted: 'Đã chuyển đổi',
    closed: 'Đóng',
  }

  const dataRows = result.docs.map((lead) => {
    let serviceTitle = ''
    if (typeof lead.service === 'object' && lead.service !== null) {
      if ('name' in lead.service && lead.service.name) {
        serviceTitle = String(lead.service.name)
      } else if ('title' in lead.service && lead.service.title) {
        serviceTitle = String(lead.service.title)
      }
    } else if (lead.service) {
      serviceTitle = String(lead.service)
    }

    const relationName = (value: unknown): string => {
      if (typeof value === 'object' && value !== null && 'name' in value) {
        return String((value as { name?: unknown }).name ?? '')
      }
      return value ? String(value) : ''
    }

    const tags = Array.isArray(lead.interestTags)
      ? lead.interestTags
          .map((item) =>
            typeof item === 'object' && item && 'text' in item
              ? (item as { text?: string }).text
              : String(item),
          )
          .filter(Boolean)
          .join('; ')
      : ''

    return [
      lead.id,
      lead.name || '',
      lead.email || '',
      lead.phone || '',
      lead.need ? needMap[lead.need] || lead.need : '',
      serviceTitle,
      relationName(lead.interestedPackage),
      relationName(lead.interestedProgram),
      lead.currentStatus || '',
      lead.brief?.company || '',
      lead.brief?.contactRole || '',
      lead.brief?.teamSize || '',
      lead.brief?.targetBehaviors || '',
      lead.brief?.timeline || '',
      lead.message || '',
      tags,
      lead.followUpStatus ? statusMap[lead.followUpStatus] || lead.followUpStatus : '',
      lead.source?.form || '',
      lead.source?.page || '',
      lead.source?.utm || '',
      lead.consent ? 'Có' : 'Không',
      lead.consentAt || '',
      lead.createdAt || '',
    ]
  })

  const csvRows = [
    headerRow.map(escapeCsvCell).join(','),
    ...dataRows.map((row) => row.map(escapeCsvCell).join(',')),
  ]

  // Prepend UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
  const csvContent = '\uFEFF' + csvRows.join('\r\n')

  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
