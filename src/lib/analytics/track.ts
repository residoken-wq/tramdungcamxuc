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
 * Ghi nhận sự kiện người dùng tối thiểu.
 * Hiện tại là no-op; task T1-15 sẽ kết nối provider GA4 / Plausible.
 */
export function track(_event: AnalyticsEvent, _props?: Record<string, unknown>): void {
  // REVIEW-REQUIRED: Analytics must never receive emotion data, reflection, or sensitive notes (AGENTS.md §11)
  if (process.env.NODE_ENV === 'development') {
    // Debug log in dev mode if needed
  }
}
