import type { Field, GlobalConfig } from 'payload'
import { checkbox, image, number, select, text, url } from '../fields/content'
import { authenticated, isOwner } from '../lib/auth/access'

export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: 'Cài đặt website',
  admin: { group: 'Hệ thống' },
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
            url('linkedInUrl', 'LinkedIn'),
            url('zaloGroupUrl', 'Nhóm Zalo'),
            url('zaloChatUrl', 'Liên kết trò chuyện Zalo'),
            checkbox('showFloatingChat', 'Hiện nút trò chuyện Zalo'),
            url('shopeeStoreUrl', 'Gian hàng Shopee'),
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
              ...number('certificateMinDays', 'Số ngày tối thiểu để nhận chứng nhận', 15),
              max: 21,
              admin: { description: 'Số ngày hoàn thành trong hành trình 21 ngày.' },
            },
          ],
        },
      ],
    },
  ],
}
