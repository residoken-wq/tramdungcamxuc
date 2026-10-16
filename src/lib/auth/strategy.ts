import type { AuthStrategy } from 'payload'
import { extractJWT, JWTAuthentication, parseCookies } from 'payload'
import { CUSTOMER_TOKEN_COOKIE, getAuthSecret, verifyCustomerToken } from './token'

// REVIEW-REQUIRED: Custom auth strategy cho collection `customers` trong Payload 3.
// Khách xác thực qua cookie riêng `tdcx_customer_token` ký bằng PAYLOAD_SECRET (qua getAuthSecret).
// Khi hợp lệ, gắn req.user với collection: 'customers', tách bạch tuyệt đối khỏi admin ('users').
//
// REVIEW-REQUIRED (T2-20): Tránh phiên khách đè phiên admin:
// Nếu request có cookie / header xác thực admin JWT hợp lệ (collection: 'users'), strategy này
// chủ động nhường quyền bằng cách trả về { user: null } để strategy 'local-jwt' tiếp theo
// của Payload xác thực admin. Nhờ đó, admin vào /admin hoặc gọi REST API vẫn giữ nguyên quyền admin.
// Trang dành cho khách (sử dụng getCurrentCustomer đọc cookie riêng) vẫn nhận diện đúng khách hàng.
export const customerAuthStrategy: AuthStrategy = {
  name: 'customer-auth',
  authenticate: async ({ headers, payload, req, isGraphQL }) => {
    try {
      // 1. Kiểm tra nhanh xem request có mang admin JWT (cookie 'payload-token' hoặc Authorization header).
      // Chỉ khi extractJWT tìm thấy token mới gọi JWTAuthentication để tránh chạy JWT hai lần tốn kém.
      const adminToken = extractJWT({ headers, payload })
      if (adminToken) {
        const adminAuth = await JWTAuthentication({
          headers,
          isGraphQL: Boolean(isGraphQL),
          payload,
          req,
          strategyName: 'local-jwt',
        })
        if (adminAuth?.user) {
          // Admin hợp lệ -> nhường quyền, local-jwt sẽ chạy tiếp và gán req.user = admin
          return { user: null }
        }
      }

      const cookies = parseCookies(headers)
      const token = cookies.get(CUSTOMER_TOKEN_COOKIE)
      if (!token) {
        return { user: null }
      }

      const secret = getAuthSecret()
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

      // REVIEW-REQUIRED: Compare sessionVersion to reject revoked tokens
      const customerSv = typeof customer.sessionVersion === 'number' ? customer.sessionVersion : 0
      const tokenSv = typeof verified.sv === 'number' ? verified.sv : 0
      if (tokenSv !== customerSv) {
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
