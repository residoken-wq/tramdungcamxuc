import type { AuthStrategy } from 'payload'
import { extractJWT, JWTAuthentication, parseCookies } from 'payload'
import { CUSTOMER_TOKEN_COOKIE, getAuthSecret, verifyCustomerToken } from './token'

// REVIEW-REQUIRED: Custom auth strategy cho collection `customers` trong Payload 3.
// Khách xác thực qua cookie riêng `tdcx_customer_token` ký bằng PAYLOAD_SECRET (qua getAuthSecret).
// Khi hợp lệ, gắn req.user với collection: 'customers', tách bạch tuyệt đối khỏi admin ('users').
//
// REVIEW-REQUIRED (T2-20): Tránh phiên khách đè phiên admin:
// Nếu request có cả cookie khách và admin JWT hợp lệ (collection: 'users'), strategy này
// trả về chính kết quả xác thực admin (JWTAuthentication của Payload). Nhờ đó, admin vào /admin hoặc gọi REST API vẫn giữ nguyên quyền admin.
// Trang dành cho khách (sử dụng getCurrentCustomer đọc cookie riêng) vẫn nhận diện đúng khách hàng.
export const customerAuthStrategy: AuthStrategy = {
  name: 'customer-auth',
  authenticate: async ({ headers, payload, req, isGraphQL }) => {
    try {
      // Không có cookie khách → không làm gì (local-jwt của Payload xử lý admin như bình thường).
      const cookies = parseCookies(headers)
      const token = cookies.get(CUSTOMER_TOKEN_COOKIE)
      if (!token) {
        return { user: null }
      }

      // REVIEW-REQUIRED (T2-20c): có cookie khách mà request cũng mang admin JWT hợp lệ → trả luôn
      // kết quả xác thực admin (Payload dừng ở strategy đầu tiên có user, nên local-jwt không phải
      // chạy lại). Chỉ tốn thêm khi có cả hai cookie.
      if (extractJWT({ headers, payload })) {
        const adminAuth = await JWTAuthentication({
          headers,
          isGraphQL: Boolean(isGraphQL),
          payload,
          req,
          strategyName: 'local-jwt',
        })
        if (adminAuth?.user) {
          return adminAuth
        }
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
