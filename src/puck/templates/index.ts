import type { Data } from '@puckeditor/core'
import { homeV2Template } from './home-v2'
import { journeyTemplate } from './journey'
import { aboutTemplate } from './about'
import { coachTemplate } from './coach'
import { contactTemplate } from './contact'
import { communityTemplate } from './community'
import { resourcesTemplate } from './resources'
import { businessTemplate } from './business'
import { campaignTemplate } from './campaign'
import { serviceTemplate } from './service'
import { workshopTemplate } from './workshop'
import { eventTemplate } from './event'
import { headerDefaultTemplate } from './header-default'
import { footerDefaultTemplate } from './footer-default'
import { vi } from '@/lib/i18n/vi'

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

export type PuckPageTemplateKey = PageTemplateKey | 'resources'

export type ThemeTemplateKey = 'header-default' | 'footer-default'
export type AnyTemplateKey = PuckPageTemplateKey | ThemeTemplateKey

export type PageTemplateItem = {
  key: AnyTemplateKey
  label: string
  description: string
  data: Data
}

export const pageTemplates: Record<PuckPageTemplateKey, PageTemplateItem> = {
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
      'Lộ trình "Chuyển mình không chênh vênh" 20 trang: 3 năng lực cốt lõi (Hành động – Cảm xúc – Giao tiếp), bản đồ 28 ngày thực hành, 4 mốc Reflection và Phase 2 Career Clarity.',
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
      'Không gian thuộc về & chăm sóc Thân - Tâm: Hero cộng đồng, chọn không gian Me Time & Yoga Buddy, lịch trình 5:00 AM, tiếng nói cộng đồng, khoảnh khắc mosaic và lời mời tham gia bộ lạc.',
    data: communityTemplate,
  },
  resources: {
    key: 'resources',
    label: 'Trang Tài nguyên',
    description:
      'Thư viện tri thức & công cụ: Hero tài nguyên, bài viết chuyên đề, bản tin tuần và giải pháp B2B.',
    data: resourcesTemplate,
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

export const themeTemplates: Record<ThemeTemplateKey, PageTemplateItem> = {
  'header-default': {
    key: 'header-default',
    label: vi.eb10.headerDefaultTemplate,
    description: vi.eb10.headerDefaultDesc,
    data: headerDefaultTemplate,
  },
  'footer-default': {
    key: 'footer-default',
    label: vi.eb10.footerDefaultTemplate,
    description: vi.eb10.footerDefaultDesc,
    data: footerDefaultTemplate,
  },
}

export const pageTemplateList = Object.values(pageTemplates)
export const themeTemplateList = Object.values(themeTemplates)
export const allTemplates: Record<AnyTemplateKey, PageTemplateItem> = {
  ...pageTemplates,
  ...themeTemplates,
}

export function getTemplatesForKind(kind?: 'page' | 'header' | 'footer'): PageTemplateItem[] {
  if (kind === 'header') {
    return [themeTemplates['header-default']]
  }
  if (kind === 'footer') {
    return [themeTemplates['footer-default']]
  }
  return pageTemplateList
}

/**
 * Lấy bản sao dữ liệu mẫu theo mã mẫu (key), có thể tùy chỉnh tiêu đề trang root.
 */
export function getTemplateData(key: string, pageTitle?: string): Data | null {
  const template = allTemplates[key as AnyTemplateKey]
  if (!template) return null
  const clone: Data = JSON.parse(JSON.stringify(template.data))
  if (pageTitle && pageTitle.trim().length > 0) {
    clone.root = {
      props: {
        ...(clone.root?.props || {}),
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
  resourcesTemplate,
  businessTemplate,
  campaignTemplate,
  serviceTemplate,
  workshopTemplate,
  eventTemplate,
  headerDefaultTemplate,
  footerDefaultTemplate,
}
