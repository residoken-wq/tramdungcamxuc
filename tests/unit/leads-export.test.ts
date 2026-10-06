// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import { escapeCsvCell, GET } from '../../src/app/(payload)/api/leads/export/route'

describe('Leads CSV Export & Anti-CSV Injection (T1-06)', () => {
  let payload: Payload
  let ownerToken: string
  let ownerId: number
  const createdLeads: number[] = []

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
    } catch {
      // Ignore cleanup errors
    } finally {
      await payload.destroy()
    }
  }, 30000)

  describe('CSV Injection Neutralization (escapeCsvCell)', () => {
    it('disables formula injection starting with =, +, -, @', () => {
      expect(escapeCsvCell('=SUM(1)')).toBe("'=SUM(1)")
      expect(escapeCsvCell('+cmd|/C calc!A0')).toBe("'+cmd|/C calc!A0")
      expect(escapeCsvCell('-2000')).toBe("'-2000")
      expect(escapeCsvCell('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)")
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

    it('returns 200 with UTF-8 BOM and neutralized formulas for authenticated owner', async () => {
      // Seed a test lead with potential CSV injection formula in name
      const injectedFormula = '=SUM(1)'
      const testEmail = `csv-inject-${randomUUID()}@example.test`

      const lead = await payload.create({
        collection: 'leads',
        data: {
          name: injectedFormula,
          email: testEmail,
          need: 'business',
          brief: {
            company: 'Công ty Thử Nghiệm CSV',
          },
          consent: true,
          consentAt: new Date().toISOString(),
          source: { form: 'b2b', page: '/doanh-nghiep' },
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
      expect(csv).toContain('Công ty')

      // Must contain lead data with neutralized formula
      expect(csv).toContain(testEmail)
      expect(csv).toContain("'=SUM(1)")
      // Must NOT contain unescaped raw formula starting cell
      expect(csv).not.toContain(',=SUM(1),')
    })

    it('supports query filtering by need', async () => {
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
      expect(csv).not.toContain('Công ty Thử Nghiệm CSV')
    })
  })
})
