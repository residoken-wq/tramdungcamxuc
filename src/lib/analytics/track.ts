/**
 * Danh sách toàn bộ các sự kiện đo lường từ mục 11 AGENTS.md.
 */
export type AnalyticsEvent =
  | 'lead_submitted'
  | 'resource_downloaded'
  | 'diagnostic_completed'
  | 'habit_loop_completed'
  | 'checkout_started'
  | 'order_paid'
  | 'certificate_issued'
  | 'certificate_shared'
  | 'zalo_chat_clicked'
  | 'library_filtered'
  | 'trial_started'
  | 'trial_expired'
  | 'trial_converted'
  | 'lesson_completed'
  | 'tracker_day_checked'
  | 'card_drawn'
  | 'card_shared'
  | 'qr_opened'
  | 'external_clicked'
  | 'package_viewed'
  | 'experience_session_booked'
  | 'booking_clicked'
  | 'b2b_brief_submitted'

/**
 * Danh sách trắng (whitelist) các trường thuộc tính (props) được phép gửi cho từng sự kiện.
 * Mọi trường ngoài danh sách này sẽ bị loại bỏ hoàn toàn.
 * TUYỆT ĐỐI KHÔNG cho phép email, tên, số điện thoại, ghi chú, nội dung form, cảm xúc, reflection (AGENTS.md §11).
 */
export const EVENT_ALLOWED_PROPS: Record<AnalyticsEvent, readonly string[]> = {
  lead_submitted: ['need', 'resource', 'productName', 'pageSlug'],
  resource_downloaded: ['resource', 'productSlug', 'format', 'pageSlug'],
  diagnostic_completed: ['stage', 'result', 'totalQuestions'],
  habit_loop_completed: ['step', 'duration'],
  checkout_started: ['productSlug', 'productId', 'price', 'kind'],
  order_paid: ['productSlug', 'productId', 'amount'],
  certificate_issued: ['courseSlug', 'module'],
  certificate_shared: ['courseSlug', 'platform'],
  zalo_chat_clicked: ['target', 'context', 'pageSlug'],
  library_filtered: ['tab', 'topic', 'format', 'page'],
  trial_started: ['productSlug', 'productId', 'days'],
  trial_expired: ['productSlug', 'productId'],
  trial_converted: ['productSlug', 'productId'],
  lesson_completed: ['courseSlug', 'moduleId', 'lessonId', 'lessonOrder'],
  tracker_day_checked: ['day', 'habitId'],
  card_drawn: ['cardCode', 'topic', 'mode'],
  card_shared: ['cardCode', 'format', 'platform'],
  qr_opened: ['cardCode', 'qrSlug'],
  external_clicked: ['url', 'type', 'platform', 'productSlug', 'targetUrl'],
  package_viewed: ['packageIds', 'packages', 'pageSlug'],
  experience_session_booked: ['productSlug', 'productId', 'pageSlug'],
  booking_clicked: ['productId', 'slug', 'pageSlug'],
  b2b_brief_submitted: ['pageSlug'],
}

/**
 * Danh sách các từ khóa nhạy cảm / PII / dữ liệu cảm xúc bị cấm tuyệt đối.
 */
export const SENSITIVE_FORBIDDEN_KEYS = new Set([
  'email',
  'name',
  'fullname',
  'firstname',
  'lastname',
  'phone',
  'phonenumber',
  'tel',
  'password',
  'address',
  'note',
  'notes',
  'message',
  'content',
  'text',
  'feeling',
  'feelings',
  'emotion',
  'emotions',
  'reflection',
  'reflections',
  'journal',
  'mood',
  'state',
  'ip',
  'ipaddress',
])

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number | boolean> },
    ) => void
  }
}

/**
 * Lọc thuộc tính theo danh sách trắng từng sự kiện và loại trừ dữ liệu nhạy cảm.
 */
export function sanitizeAnalyticsProps(
  event: AnalyticsEvent,
  rawProps?: Record<string, unknown>,
): Record<string, string | number | boolean> | undefined {
  if (!rawProps || typeof rawProps !== 'object') {
    return undefined
  }

  const allowedKeys = EVENT_ALLOWED_PROPS[event]
  if (!allowedKeys || allowedKeys.length === 0) {
    return undefined
  }

  const sanitized: Record<string, string | number | boolean> = {}

  for (const [key, value] of Object.entries(rawProps)) {
    // 1. Phải thuộc danh sách trắng cho sự kiện này
    if (!allowedKeys.includes(key)) {
      continue
    }

    // 2. Chặn từ khóa nhạy cảm
    if (SENSITIVE_FORBIDDEN_KEYS.has(key.toLowerCase())) {
      continue
    }

    // 3. Chuẩn hóa giá trị: chỉ chấp nhận string, number, boolean hoặc mảng chuỗi/số
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) sanitized[key] = trimmed
    } else if (typeof value === 'number' && !isNaN(value)) {
      sanitized[key] = value
    } else if (typeof value === 'boolean') {
      sanitized[key] = value
    } else if (Array.isArray(value)) {
      const cleanArray = value
        .filter((item) => typeof item === 'string' || typeof item === 'number')
        .map(String)
      if (cleanArray.length > 0) {
        sanitized[key] = cleanArray.join(', ')
      }
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined
}

/**
 * Ghi nhận sự kiện người dùng qua Plausible Analytics (không cookie, tôn trọng quyền riêng tư).
 * Nếu Plausible chưa nạp (hoặc chạy phía server) -> không làm gì, không ném lỗi.
 */
export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  // REVIEW-REQUIRED: Analytics must never receive emotion data, reflection, or sensitive notes (AGENTS.md §11)
  const sanitizedProps = sanitizeAnalyticsProps(event, props)

  if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
    try {
      if (sanitizedProps) {
        window.plausible(event, { props: sanitizedProps })
      } else {
        window.plausible(event)
      }
    } catch {
      // Gracefully swallow errors from third-party analytics script
    }
  }

  if (process.env.NODE_ENV === 'development') {
    // Debug log in dev mode if needed
  }
}
