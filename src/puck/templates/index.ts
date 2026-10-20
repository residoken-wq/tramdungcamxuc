import type { Data } from '@puckeditor/core'
import { homeV2Template } from './home-v2'
import { journeyTemplate } from './journey'
import { aboutTemplate } from './about'
import { coachTemplate } from './coach'
import { contactTemplate } from './contact'
import { communityTemplate } from './community'
import { businessTemplate } from './business'
import { campaignTemplate } from './campaign'
import { serviceTemplate } from './service'
import { workshopTemplate } from './workshop'
import { eventTemplate } from './event'

export type PageTemplateKey =
  | 'home-v2'
  | 'journey'
  | 'about'
  | 'coach'
  | 'contact'
  | 'community'
  | 'business'
  | 'campaign'
  | 'service'
  | 'workshop'
  | 'event'

export type PageTemplateItem = {
  key: PageTemplateKey
  label: string
  description: string
  data: Data
}

export const pageTemplates: Record<PageTemplateKey, PageTemplateItem> = {
  'home-v2': {
    key: 'home-v2',
    label: 'Trang chủ v2',
    description:
      'Bố cục trang chủ toàn diện: Hero 2 lối vào, 3 gói giải pháp, chẩn đoán, 5 bước chuyển hóa, câu chuyện nhà sáng lập, bảo chứng và form kết nối.',
    data: homeV2Template,
  },
  journey: {
    key: 'journey',
    label: 'Trang lộ trình',
    description:
      'Lộ trình "Chuyển mình không chênh vênh": 4 nỗi đau, 3 cột mốc CLEAR/BUILD/SHINE, bảng so sánh quyền lợi, câu chuyện khách hàng và đăng ký trải nghiệm.',
    data: journeyTemplate,
  },
  about: {
    key: 'about',
    label: 'Trang Về Trạm',
    description:
      'Câu chuyện thương hiệu "Trạm Dừng", tầm nhìn sứ mệnh, giá trị cốt lõi, khung 5 bước, thư người sáng lập, đội ngũ chuyên gia và chuẩn mực quốc tế.',
    data: aboutTemplate,
  },
  coach: {
    key: 'coach',
    label: 'Trang Coach 1:1',
    description:
      'Dịch vụ khai vấn chuyên sâu 1:1: 4 tình huống cần tấm gương soi chiếu, thẻ dịch vụ Growth & Thinking Mirror, bên trong một phiên khai vấn, tiến trình 5 bước và đặt lịch.',
    data: coachTemplate,
  },
  contact: {
    key: 'contact',
    label: 'Trang Liên hệ',
    description:
      'Kênh kết nối chính thức: cam kết bảo mật & phản hồi nhanh, thông tin liên hệ đa kênh, biểu mẫu 2 cột Cá nhân & Doanh nghiệp và câu hỏi thường gặp.',
    data: contactTemplate,
  },
  community: {
    key: 'community',
    label: 'Trang Cộng đồng',
    description:
      'Không gian kết nối & thấu cảm: Hero cộng đồng, 3 lợi ích tham gia, tinh thần nâng niu cảm xúc, lời chia sẻ, nút Zalo nhóm và giải đáp thắc mắc.',
    data: communityTemplate,
  },
  business: {
    key: 'business',
    label: 'Trang Doanh nghiệp',
    description:
      'Giải pháp cho tổ chức & doanh nghiệp: Hero đồng hành, 3 điểm nghẽn nội tâm, hệ sinh thái giải pháp B2B, dải logo bảo chứng, lời chia sẻ và form gửi brief.',
    data: businessTemplate,
  },
  campaign: {
    key: 'campaign',
    label: 'Landing chiến dịch',
    description:
      'Bố cục cho chiến dịch mới: Hero ảnh, câu chuyện, cảm nhận, giải đáp và form thu lead.',
    data: campaignTemplate,
  },
  service: {
    key: 'service',
    label: 'Trang dịch vụ',
    description: 'Giới thiệu dịch vụ đồng hành, lộ trình 5 bước, cảm nhận và đặt lịch hẹn.',
    data: serviceTemplate,
  },
  workshop: {
    key: 'workshop',
    label: 'Trang workshop',
    description: 'Trang giới thiệu buổi workshop chuyên đề, điểm chạm, số liệu và form giữ chỗ.',
    data: workshopTemplate,
  },
  event: {
    key: 'event',
    label: 'Trang sự kiện',
    description: 'Trang sự kiện kết nối cộng đồng, lịch trình chi tiết, giải đáp và đăng ký.',
    data: eventTemplate,
  },
}

export const pageTemplateList = Object.values(pageTemplates)

/**
 * Lấy bản sao dữ liệu mẫu theo mã mẫu (key), có thể tùy chỉnh tiêu đề trang root.
 */
export function getTemplateData(key: string, pageTitle?: string): Data | null {
  const template = pageTemplates[key as PageTemplateKey]
  if (!template) return null
  const clone: Data = JSON.parse(JSON.stringify(template.data))
  if (pageTitle && pageTitle.trim().length > 0) {
    clone.root = {
      props: {
        title: pageTitle.trim(),
      },
    }
  }
  return clone
}

export {
  homeV2Template,
  journeyTemplate,
  aboutTemplate,
  coachTemplate,
  contactTemplate,
  communityTemplate,
  businessTemplate,
  campaignTemplate,
  serviceTemplate,
  workshopTemplate,
  eventTemplate,
}
