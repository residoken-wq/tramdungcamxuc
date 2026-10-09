import { detailLivePreview } from '@/lib/live-preview'
import { contentCollection, lines, saleStatus, slug, text, textarea } from '../fields/content'

export const Programs = contentCollection(
  'programs',
  'Chương trình doanh nghiệp',
  'Bán hàng',
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

Programs.admin = { ...Programs.admin, livePreview: detailLivePreview('programs') }
