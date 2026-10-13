// REVIEW-REQUIRED: Chặn chạy seed/clean/otp dữ liệu demo trên môi trường production.
// Chỉ cho phép chạy khi thỏa mãn đồng thời cả 3 điều kiện an toàn:
// 1. DEMO_SEED_ALLOW=true (biến riêng biệt, không dùng chung SEED_ALLOW_PROD).
// 2. SITE_URL / NEXT_PUBLIC_SITE_URL không trỏ về tên miền production thật (tramdungcamxuc.com hoặc www.tramdungcamxuc.com).
// 3. Cơ sở dữ liệu không có đơn hàng đã thanh toán (paid) của người dùng thật (email không kết thúc bằng @example.test).

export interface DemoSeedFacts {
  hasPaidOrderFromNonExampleEmail: boolean
}

export type DemoSeedCheckResult = { ok: true } | { ok: false; reason: string }

const PRODUCTION_HOSTNAMES = new Set(['tramdungcamxuc.com', 'www.tramdungcamxuc.com'])

function extractHostname(urlStr?: string): string | null {
  if (!urlStr || !urlStr.trim()) return null
  const trimmed = urlStr.trim()
  try {
    const parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
    return parsed.hostname.toLowerCase()
  } catch {
    return trimmed.toLowerCase().split('/')[0].split(':')[0]
  }
}

/**
 * Hàm thuần kiểm tra tính hợp lệ của việc chạy seed dữ liệu demo.
 * Không thực hiện truy vấn cơ sở dữ liệu hay đọc trực tiếp biến môi trường toàn cục.
 */
export function checkDemoSeedAllowed(
  env: Record<string, string | undefined>,
  facts: DemoSeedFacts,
): DemoSeedCheckResult {
  // Điều kiện 1: Phải có DEMO_SEED_ALLOW=true
  if (env.DEMO_SEED_ALLOW !== 'true') {
    return {
      ok: false,
      reason:
        'Từ chối chạy demo seed: Biến môi trường DEMO_SEED_ALLOW chưa được bật (yêu cầu DEMO_SEED_ALLOW=true).',
    }
  }

  // Điều kiện 2: Tên miền không được là domain production thật
  const siteUrlHost = extractHostname(env.SITE_URL)
  const nextPublicSiteUrlHost = extractHostname(env.NEXT_PUBLIC_SITE_URL)

  if (
    (siteUrlHost && PRODUCTION_HOSTNAMES.has(siteUrlHost)) ||
    (nextPublicSiteUrlHost && PRODUCTION_HOSTNAMES.has(nextPublicSiteUrlHost))
  ) {
    return {
      ok: false,
      reason:
        'Từ chối chạy demo seed: Tên miền cấu hình (SITE_URL/NEXT_PUBLIC_SITE_URL) đang trỏ tới tên miền production thật (tramdungcamxuc.com / www.tramdungcamxuc.com).',
    }
  }

  // Điều kiện 3: Không có đơn hàng đã thanh toán của người dùng thật
  if (facts.hasPaidOrderFromNonExampleEmail) {
    return {
      ok: false,
      reason:
        'Từ chối chạy demo seed: Phát hiện cơ sở dữ liệu chứa đơn hàng đã thanh toán (paid) của người dùng thật (email không kết thúc bằng @example.test).',
    }
  }

  return { ok: true }
}
