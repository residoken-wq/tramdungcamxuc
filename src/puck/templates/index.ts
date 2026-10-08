import type { Data } from '@puckeditor/core'
import { campaignTemplate } from './campaign'
import { serviceTemplate } from './service'
import { workshopTemplate } from './workshop'
import { eventTemplate } from './event'

export type PageTemplateKey = 'campaign' | 'service' | 'workshop' | 'event'

export type PageTemplateItem = {
  key: PageTemplateKey
  label: string
  description: string
  data: Data
}

export const pageTemplates: Record<PageTemplateKey, PageTemplateItem> = {
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

export { campaignTemplate, serviceTemplate, workshopTemplate, eventTemplate }
