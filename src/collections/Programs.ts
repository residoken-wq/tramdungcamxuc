import { detailLivePreview } from '@/lib/live-preview'
import { contentCollection, lines, saleStatus, slug, text, textarea } from '../fields/content'
import { vi } from '../lib/i18n/vi'

export const Programs = contentCollection(
  'programs',
  'Chương trình doanh nghiệp',
  vi.cms.nav.commerce,
  'name',
  [
    text('name', 'Tên chương trình', true),
    slug(),
    lines('targetBehaviors', 'Hành vi mục tiêu'),
    text('learnerGroup', 'Nhóm người học'),
    text('format', 'Hình thức'),
    text('duration', 'Thời lượng'),
    lines('deliverables', 'Kết quả bàn giao'),
    textarea('followUp', 'Đồng hành sau chương trình'),
    textarea('measurement', 'Cách đo lường'),
    lines('caseStudies', 'Câu chuyện thực tế'),
    text('ctaLabel', 'Nhãn nút'),
    saleStatus(),
  ],
)

Programs.admin = {
  ...Programs.admin,
  description: 'Chương trình đào tạo và giải pháp trí tuệ cảm xúc cho doanh nghiệp.',
  defaultColumns: ['name', 'format', 'duration', 'saleStatus', 'updatedAt'],
  listSearchableFields: ['name', 'slug'],
  livePreview: detailLivePreview('programs'),
}
