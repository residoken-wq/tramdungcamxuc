import type { Field, GlobalConfig } from 'payload'
import {
  checkbox,
  image,
  internalOrExternalUrl,
  number,
  select,
  text,
  url,
} from '../fields/content'
import { authenticated, isOwner } from '../lib/auth/access'
import { vi } from '../lib/i18n/vi'
import { globalLivePreview } from '../lib/live-preview'

export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: 'Cài đặt website',
  admin: {
    group: vi.cms.nav.website,
    description: 'Cấu hình thông tin thương hiệu, thanh toán VietQR và liên hệ toàn trang.',
    livePreview: globalLivePreview('siteSettings'),
  },
  access: { read: () => true, update: authenticated },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Chung',
          fields: [
            image('logo', 'Logo thương hiệu'),
            text('tagline', 'Thông điệp thương hiệu'),
            image('founderSignature', 'Ảnh chữ ký nhà sáng lập', {
              admin: { description: 'PNG nền trong, dùng ở khối "Lời chào từ nhà sáng lập".' },
            }),
            {
              ...text('brandAscii', 'Tên không dấu'),
              defaultValue: 'TRAM DUNG CAM XUC',
              admin: { description: 'Dùng trong chuyển khoản, email và mã đơn.' },
            },
            { ...text('domain', 'Tên miền'), defaultValue: 'tramdungcamxuc.com' },
            {
              name: 'analytics',
              label: 'Đo lường truy cập',
              type: 'group',
              fields: [
                select(
                  'provider',
                  'Dịch vụ',
                  [
                    ['none', 'Chưa bật'],
                    ['ga4', 'Google Analytics 4'],
                    ['plausible', 'Plausible'],
                  ],
                  { defaultValue: 'none' },
                ),
                text('measurementId', 'Mã đo lường GA4'),
                text('plausibleDomain', 'Tên miền Plausible'),
              ],
            },
          ],
        },
        {
          label: 'Thanh toán',
          // REVIEW-REQUIRED: Payment settings are owner-only (read and update). Public payment
          // pages read them through server code with overrideAccess.
          fields: [
            text('bankBin', 'Mã ngân hàng VietQR'),
            text('bankName', 'Tên ngân hàng'),
            text('accountNumber', 'Số tài khoản'),
            text('accountName', 'Tên chủ tài khoản'),
            { ...text('transferPrefix', 'Đầu mã chuyển khoản'), defaultValue: 'TDCX' },
            {
              ...url('experienceBookingUrl', 'Liên kết đặt lịch phiên trải nghiệm'),
              admin: {
                description:
                  'Liên kết đặt lịch (Cal.com, Google Calendar...) gửi qua email cho khách sau khi xác nhận thanh toán.',
              },
            },
            checkbox('trialCreditApplies', 'Trừ phí trải nghiệm vào giá gói'),
          ].map((field) => ({ ...field, access: { read: isOwner, update: isOwner } }) as Field),
        },
        {
          label: 'Liên hệ & Zalo',
          fields: [
            {
              name: 'email',
              label: 'Email liên hệ',
              type: 'email',
              admin: { description: 'Email nhận liên hệ từ khách hàng.' },
            },
            {
              ...text('hotline', 'Hotline / Zalo'),
              admin: { description: 'Số điện thoại hiện ở trang Liên hệ. VD: 0930 000 000.' },
              validate: (value: string | null | undefined) =>
                !value ||
                /^\+?[0-9 .]{8,20}$/.test(value.trim()) ||
                'Chỉ dùng số, khoảng trắng, dấu chấm và dấu + ở đầu.',
            },
            {
              ...text('officeAddress', 'Địa điểm văn phòng'),
              admin: { description: 'Có thể chỉ ghi thành phố. VD: TP. Hồ Chí Minh, Việt Nam.' },
            },
            url('linkedInUrl', 'LinkedIn'),
            url('facebookUrl', 'Facebook / Fanpage'),
            url('youtubeUrl', 'YouTube'),
            url('zaloGroupUrl', 'Nhóm Zalo'),
            url('zaloChatUrl', 'Liên kết trò chuyện Zalo'),
            checkbox('showFloatingChat', 'Hiện nút trò chuyện Zalo'),
            url('shopeeStoreUrl', 'Gian hàng Shopee'),
            {
              name: 'leadStatusOptions',
              label: 'Lựa chọn "Tình trạng hiện tại" trên form liên hệ',
              type: 'array',
              maxRows: 10,
              admin: {
                description:
                  'Các lựa chọn khách thấy ở ô "Tình trạng hiện tại" của form liên hệ. Kéo để đổi thứ tự.',
              },
              fields: [text('label', 'Lựa chọn', true)],
            },
          ],
        },
        {
          label: 'Người bán',
          fields: [
            {
              name: 'sellerInfo',
              label: 'Thông tin người bán',
              type: 'group',
              fields: [
                text('name', 'Tên người bán hoặc hộ kinh doanh'),
                text('taxCode', 'Mã số thuế'),
                text('address', 'Địa chỉ'),
                text('phone', 'Điện thoại'),
                {
                  name: 'email',
                  label: 'Email người bán',
                  type: 'email',
                  admin: { description: 'Email dùng cho thông tin pháp lý.' },
                },
              ],
            },
          ],
        },
        {
          label: 'Công cụ số',
          fields: [
            {
              ...number('habitJourneyDays', 'Số ngày hành trình Habit', 28),
              min: 7,
              max: 60,
              admin: {
                description:
                  'Số ngày của một hành trình thói quen (mặc định 28 ngày). Lưu cố định vào kế hoạch lúc tạo.',
              },
            },
            {
              ...number(
                'certificateMinPercent',
                'Tỷ lệ hoàn thành tối thiểu để nhận chứng nhận (%)',
                90,
              ),
              min: 50,
              max: 100,
              admin: {
                description:
                  'Tỷ lệ % số ngày bỏ phiếu cần check-in để được cấp chứng nhận (mặc định 90%).',
              },
            },
            {
              // Cũ: thay bằng tỷ lệ % (certificateMinPercent). Giữ cột để không làm hỏng dữ liệu cũ.
              ...number('certificateMinDays', 'Số ngày tối thiểu để nhận chứng nhận', 15),
              max: 21,
              admin: {
                hidden: true,
                description: 'Số ngày hoàn thành trong hành trình 21 ngày (thay bằng tỷ lệ %).',
              },
            },
            internalOrExternalUrl('quizCtaPath', 'Nút sau kết quả quiz dẫn tới đâu', {
              admin: {
                description:
                  'Để trống thì dẫn tới trang lộ trình. Khi Habit Tracker số đang mở dùng thử, nút luôn dẫn tới dùng thử.',
              },
            }),
          ],
        },
      ],
    },
  ],
}
