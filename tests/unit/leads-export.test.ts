// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import { escapeCsvCell, GET } from '../../src/app/(payload)/api/leads/export/route'

describe('Leads CSV Export & Anti-CSV Injection (T1-06 & T1-06b)', () => {
  let payload: Payload
  let ownerToken: string
  let ownerId: number
  const createdLeads: number[] = []
  const createdServices: number[] = []

  beforeAll(async () => {
    payload = await getPayload({ config })

    // Create an owner admin user for authenticated export testing
    const email = `owner-export-${randomUUID()}@example.test`
    const password = randomUUID()
    const user = await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        role: 'owner',
      },
    })
    ownerId = user.id

    const loginRes = await payload.login({
      collection: 'users',
      data: { email, password },
    })
    ownerToken = loginRes.token || ''
  }, 60000)

  afterAll(async () => {
    if (!payload) return
    try {
      if (ownerId) {
        await payload.delete({ collection: 'users', id: ownerId, overrideAccess: true })
      }
      for (const id of createdLeads) {
        await payload.delete({ collection: 'leads', id, overrideAccess: true })
      }
      for (const id of createdServices) {
        await payload.delete({ collection: 'services', id, overrideAccess: true })
      }
    } catch {
      // Ignore cleanup errors
    } finally {
      await payload.destroy()
    }
  }, 30000)

  describe('CSV Injection Neutralization (escapeCsvCell, OWASP)', () => {
    it('disables formula injection starting with =, +, -, @', () => {
      expect(escapeCsvCell('=SUM(1)')).toBe("'=SUM(1)")
      expect(escapeCsvCell('+cmd|/C calc!A0')).toBe("'+cmd|/C calc!A0")
      expect(escapeCsvCell('-2000')).toBe("'-2000")
      expect(escapeCsvCell('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)")
    })

    it('disables formula injection starting with tab (\\t) or carriage return (\\r) (T1-06b)', () => {
      expect(escapeCsvCell('\t=SUM(1)')).toBe("'\t=SUM(1)")
      expect(escapeCsvCell('\r+cmd')).toBe('"\'\r+cmd"')
    })

    it('safely escapes commas, quotes, and newlines', () => {
      expect(escapeCsvCell('Hana Lương, Coach')).toBe('"Hana Lương, Coach"')
      expect(escapeCsvCell('Nói "Xin chào"')).toBe('"Nói ""Xin chào"""')
      expect(escapeCsvCell('Dòng 1\nDòng 2')).toBe('"Dòng 1\nDòng 2"')
    })

    it('handles null, undefined, and regular strings without modification', () => {
      expect(escapeCsvCell(null)).toBe('')
      expect(escapeCsvCell(undefined)).toBe('')
      expect(escapeCsvCell('Trạm Dừng Cảm Xúc')).toBe('Trạm Dừng Cảm Xúc')
      expect(escapeCsvCell(12345)).toBe('12345')
    })
  })

  describe('Route Handler Authentication & Permissions (REVIEW-REQUIRED)', () => {
    it('returns 401 when request is unauthenticated', async () => {
      const request = new Request('http://localhost:3000/api/leads/export', {
        method: 'GET',
      })
      const response = await GET(request)
      expect(response.status).toBe(401)
      const text = await response.text()
      expect(text).toContain('Chưa đăng nhập')
    })

    it('returns 200 with UTF-8 BOM, neutralized formulas, and service.name for authenticated owner (T1-06b)', async () => {
      // Create a test service to verify service.name in CSV
      const service = await payload.create({
        collection: 'services',
        data: {
          name: 'Gói Coaching Chuyển Mình',
          slug: `service-csv-${randomUUID()}`,
          saleStatus: 'on_sale',
        },
        overrideAccess: true,
      })
      createdServices.push(service.id)

      // Seed a test lead with potential CSV injection formula in name and service relation
      const injectedFormula = '=SUM(1)'
      const testEmail = `csv-inject-${randomUUID()}@example.test`

      const lead = await payload.create({
        collection: 'leads',
        data: {
          name: injectedFormula,
          email: testEmail,
          need: 'personal',
          service: service.id,
          consent: true,
          consentAt: new Date().toISOString(),
          source: { form: 'coaching', page: '/coaching' },
          followUpStatus: 'new',
        },
        overrideAccess: true,
      })
      createdLeads.push(lead.id)

      const request = new Request('http://localhost:3000/api/leads/export', {
        method: 'GET',
        headers: {
          Authorization: `JWT ${ownerToken}`,
        },
      })

      const response = await GET(request)
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('text/csv; charset=utf-8')
      expect(response.headers.get('Content-Disposition')).toContain('attachment; filename=')

      const buffer = await response.arrayBuffer()
      const bytes = new Uint8Array(buffer)

      // Must start with UTF-8 BOM bytes: 0xEF, 0xBB, 0xBF (\uFEFF)
      expect(bytes[0]).toBe(0xef)
      expect(bytes[1]).toBe(0xbb)
      expect(bytes[2]).toBe(0xbf)

      const csv = new TextDecoder('utf-8', { ignoreBOM: true }).decode(buffer)
      expect(csv.startsWith('\uFEFF')).toBe(true)

      // Must contain Vietnamese column headers
      expect(csv).toContain('Họ và tên')
      expect(csv).toContain('Email')
      expect(csv).toContain('Nhu cầu')
      expect(csv).toContain('Dịch vụ quan tâm')

      // Must contain lead data with neutralized formula
      expect(csv).toContain(testEmail)
      expect(csv).toContain("'=SUM(1)")
      expect(csv).not.toContain(',=SUM(1),')

      // Must contain the actual service name (service.name) in CSV
      expect(csv).toContain('Gói Coaching Chuyển Mình')
    })

    it('supports query filtering by need', async () => {
      // Seed a lead with need = business
      const b2bEmail = `csv-b2b-${randomUUID()}@corp.test`
      const lead = await payload.create({
        collection: 'leads',
        data: {
          name: 'Doanh Nghiệp Beta',
          email: b2bEmail,
          need: 'business',
          brief: {
            company: 'Công ty Lọc Query',
          },
          consent: true,
          consentAt: new Date().toISOString(),
          source: { form: 'b2b', page: '/doanh-nghiep' },
          followUpStatus: 'new',
        },
        overrideAccess: true,
      })
      createdLeads.push(lead.id)

      const request = new Request('http://localhost:3000/api/leads/export?need=personal', {
        method: 'GET',
        headers: {
          Authorization: `JWT ${ownerToken}`,
        },
      })

      const response = await GET(request)
      expect(response.status).toBe(200)
      const csv = await response.text()

      // The business test lead created above should NOT be included when filtering for need=personal
      expect(csv).not.toContain('Công ty Lọc Query')
    })
  })
})
