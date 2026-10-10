import type { AuthStrategy } from 'payload'
import { parseCookies } from 'payload'
import { CUSTOMER_TOKEN_COOKIE, verifyCustomerToken } from './token'

// REVIEW-REQUIRED: Custom auth strategy cho collection `customers` trong Payload 3.
// Khách xác thực qua cookie riêng `tdcx_customer_token` ký bằng PAYLOAD_SECRET.
// Khi hợp lệ, gắn req.user với collection: 'customers', tách bạch tuyệt đối khỏi admin ('users').
export const customerAuthStrategy: AuthStrategy = {
  name: 'customer-auth',
  authenticate: async ({ headers, payload, req }) => {
    try {
      const cookies = parseCookies(headers)
      const token = cookies.get(CUSTOMER_TOKEN_COOKIE)
      if (!token) {
        return { user: null }
      }

      const secret = payload.secret || process.env.PAYLOAD_SECRET || ''
      const verified = verifyCustomerToken(token, secret)
      if (!verified) {
        return { user: null }
      }

      const customer = await payload.findByID({
        collection: 'customers',
        id: verified.id,
        depth: 0,
        overrideAccess: true,
        req,
      })

      if (!customer) {
        return { user: null }
      }

      return {
        user: {
          ...customer,
          collection: 'customers',
          _strategy: 'customer-auth',
        },
      }
    } catch {
      return { user: null }
    }
  },
}
