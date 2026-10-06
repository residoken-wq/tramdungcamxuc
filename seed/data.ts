// SAMPLE DATA ONLY. Every record is created with isSample = true and visible text starts with [MẪU]
// unless it is copied verbatim from the project brief (AGENTS.md / Planning docx).
// Prices are the tentative prices from AGENTS.md and Growth_Mirror_Pricing_Calculator.xlsx.

export const S = '[MẪU]'

/** Minimal Lexical editor state with one paragraph per string. */
export function lexical(...paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        textFormat: 0,
        children: [
          { type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 },
        ],
      })),
    },
  }
}

const lines = (...items: string[]) => items.map((text) => ({ text }))

// Products keyed by slug. Package components reference other products by slug via `grants`.
export type ProductSeed = Record<string, unknown> & {
  slug: string
  components?: (Record<string, unknown> & { grants?: string })[]
}

export const products: ProductSeed[] = [
  {
    slug: 'ebook-cong-cu-eq',
    name: `${S} Ebook và bộ công cụ EQ`,
    web: 'site',
    type: 'ebook',
    journeyStep: 'pause',
    shortDescription: `${S} Journaling, emotion tools và career reflection – tải PDF qua email.`,
    saleStatus: 'free',
    ctaLabel: 'Nhận miễn phí',
    ctaType: 'download',
    order: 1,
  },
  {
    slug: 'habit-loop-5-phut',
    name: `${S} Habit Loop trong 5 phút`,
    web: 'habit',
    type: 'digital_tool',
    journeyStep: 'name',
    shortDescription: `${S} Gọi tên cue, craving, response, reward của một thói quen trong 5 phút.`,
    saleStatus: 'free',
    order: 2,
  },
  {
    slug: 'chan-doan-diem-ket-thoi-quen',
    name: `${S} Chẩn đoán điểm kẹt thói quen`,
    web: 'habit',
    type: 'digital_tool',
    journeyStep: 'name',
    shortDescription: `${S} Quiz 16 tình huống trì hoãn, kết quả hiện ngay.`,
    saleStatus: 'free',
    order: 3,
  },
  {
    slug: 'habit-tracker-so',
    name: `${S} Habit Tracker số (Habit Hack 1% Better)`,
    web: 'habit',
    type: 'digital_tool',
    journeyStep: 'practice',
    shortDescription: `${S} 20 video, 11 kỹ thuật, tracker hành động – cảm xúc 21 ngày.`,
    price: 250000,
    salePrice: 178000,
    trialDays: 21,
    saleStatus: 'coming_soon',
    order: 4,
  },
  {
    slug: 'eq-buddy-so',
    name: `${S} EQ Buddy số (26 thẻ)`,
    web: 'eq',
    type: 'digital_tool',
    journeyStep: 'feel',
    shortDescription: `${S} Rút thẻ → thông điệp → câu chuyện → reflection → hành động nhỏ.`,
    price: 250000,
    salePrice: 178000,
    trialDays: 21,
    saleStatus: 'coming_soon',
    order: 5,
  },
  {
    slug: 'bo-the-vat-ly-2-0',
    name: `${S} Bộ thẻ vật lý Trạm Dừng Cảm Xúc 2.0`,
    web: 'eq',
    type: 'physical_external',
    journeyStep: 'feel',
    shortDescription: `${S} Thẻ in, mỗi thẻ có QR mở bản số. Mua trên Shopee.`,
    saleStatus: 'on_sale',
    externalUrl: 'https://shopee.vn/',
    externalLabel: 'Mua bộ thẻ trên Shopee',
    ctaType: 'external',
    order: 6,
  },
  {
    slug: 'growth-mirror-phien-trai-nghiem',
    name: `${S} Growth Mirror – phiên trải nghiệm`,
    web: 'site',
    type: 'coaching_trial',
    journeyStep: 'choose',
    shortDescription: `${S} Một phiên trải nghiệm để thử trước khi chọn gói.`,
    price: 149000,
    saleStatus: 'on_sale',
    ctaLabel: 'Đặt phiên trải nghiệm',
    ctaType: 'book',
    order: 7,
  },
  {
    slug: 'workshop-tap-thuong-cam-xuc',
    name: `${S} Workshop "Tập thương cảm xúc"`,
    web: 'site',
    type: 'workshop',
    journeyStep: 'name',
    shortDescription: `${S} 2 buổi, nằm trong cả 3 gói Growth Mirror.`,
    price: 500000,
    saleStatus: 'hidden',
    order: 8,
  },
  {
    slug: 'cong-dong-tap-thuong-cam-xuc',
    name: `${S} Cộng đồng private "Tập thương cảm xúc" + webinar quý`,
    web: 'site',
    type: 'community',
    journeyStep: 'practice',
    shortDescription: `${S} Nhóm kín và webinar hằng quý, nằm trong gói BUILD và SHINE.`,
    price: 300000,
    saleStatus: 'hidden',
    order: 9,
  },
  ...(
    [
      ['clear', 'CLEAR', 1750000, 1, 0, false],
      ['build', 'BUILD', 2900000, 3, 1, true],
      ['shine', 'SHINE', 4320000, 6, 3, true],
    ] as const
  ).map(([key, label, price, coaching, career, community], index) => ({
    slug: `growth-mirror-${key}`,
    name: `${S} Growth Mirror – gói ${label}`,
    web: 'site',
    type: 'package',
    journeyStep: 'choose',
    shortDescription: `${S} Gói ${label}: chọn sau phiên trải nghiệm.`,
    price,
    saleStatus: 'consult',
    order: 10 + index,
    components: [
      { label: 'Habit Tracker số', quantity: 1, unitValue: 250000, grants: 'habit-tracker-so' },
      { label: 'EQ Buddy số', quantity: 1, unitValue: 250000, grants: 'eq-buddy-so' },
      { label: 'Workshop "Tập thương cảm xúc"', quantity: 2, unitValue: 500000 },
      {
        label: 'Coaching 1:1 "Vững vàng chuyển mình"',
        quantity: coaching,
        unitValue: 1000000,
        retailPrice: 2200000,
      },
      ...(career
        ? [
            {
              label: 'Tư vấn hướng nghiệp',
              quantity: career,
              unitValue: 1000000,
              retailPrice: 1500000,
            },
          ]
        : []),
      ...(community
        ? [{ label: 'Cộng đồng private + webinar quý', quantity: 1, unitValue: 300000 }]
        : []),
    ],
  })),
]

export const services = [
  {
    slug: 'growth-mirror',
    name: `${S} Growth Mirror`,
    audience: `${S} Người đang ở một bước chuyển trong sự nghiệp`,
    situations: lines(`${S} Muốn hiểu rõ thế mạnh trước khi chuyển hướng`),
    outcomes: lines(`${S} Một kế hoạch hành động rõ ràng`),
    process: lines(`${S} Phiên trải nghiệm`, `${S} Chọn gói CLEAR / BUILD / SHINE`),
    priceMode: 'fixed',
    price: 149000,
    ctaLabel: 'Đặt phiên trải nghiệm',
  },
  {
    slug: 'thinking-mirror',
    name: `${S} Thinking Mirror`,
    audience: `${S} Người muốn trao đổi 1:1 về một vấn đề cụ thể`,
    priceMode: 'quote',
    ctaLabel: 'Đăng ký tư vấn',
  },
]

export const programs = [
  {
    slug: 'eq-development-for-clarity',
    name: `${S} EQ Development for Clarity`,
    targetBehaviors: lines(`${S} Gọi tên cảm xúc trước khi phản hồi`),
    learnerGroup: `${S} Quản lý cấp trung`,
    ctaLabel: 'Trao đổi về chương trình',
  },
  {
    slug: 'habit-formation-for-resilience',
    name: `${S} Habit Formation for Resilience`,
    targetBehaviors: lines(`${S} Duy trì một thói quen nhỏ mỗi ngày trong 21 ngày`),
    learnerGroup: `${S} Đội ngũ nhân viên`,
    ctaLabel: 'Trao đổi về chương trình',
  },
]

export const posts = [1, 2].map((n) => ({
  slug: `doc-sach-cung-ban-${n}`,
  title: `${S} Đọc sách cùng bạn – kỳ ${n}`,
  series: 'Đọc sách cùng bạn',
  topic: n === 1 ? 'habit' : 'career',
  format: 'article',
  content: lexical(`${S} Nội dung bài viết kỳ ${n}.`),
}))

export const testimonials = [1, 2, 3].map((n) => ({
  name: `${S} Người chia sẻ ${n}`,
  role: `${S} Vai trò ${n}`,
  quote: `${S} Lời chia sẻ ${n} – chờ nội dung thật có đồng ý của khách.`,
  language: 'vi',
  consent: false,
}))

export const eqCards = [1, 2, 3].map((n) => ({
  code: `MAU-${String(n).padStart(2, '0')}`,
  qrSlug: `mau-${String(n).padStart(2, '0')}`,
  message: `${S} Thông điệp thẻ ${n}`,
  story: lexical(`${S} Câu chuyện của thẻ ${n}.`),
  reflectionPrompt: `${S} Câu hỏi suy ngẫm ${n}?`,
  smallAction: `${S} Một hành động nhỏ ${n}`,
  topic: 'eq',
  emotionTags: lines(`${S} cảm xúc ${n}`),
  order: n,
}))

const stages = ['cue', 'craving', 'response', 'reward'] as const

export const diagnosticQuestions = Array.from({ length: 16 }, (_, i) => ({
  statement: `${S} Tình huống trì hoãn ${i + 1}`,
  stage: stages[i % 4],
  suggestion: lexical(`${S} Gợi ý cho tình huống ${i + 1}.`),
  order: i + 1,
}))

export const techniques = Array.from({ length: 11 }, (_, i) => ({
  name: `${S} Kỹ thuật ${i + 1}`,
  stage: stages[i % 4],
  howTo: lexical(`${S} Cách thực hiện kỹ thuật ${i + 1}.`),
  example: lexical(`${S} Ví dụ kỹ thuật ${i + 1}.`),
}))

// 4 modules as in AGENTS.md 8.2 (Insight → Habit Loop → Nguyên tắc → Kỹ thuật), 20 lessons in total.
export const courseModules = [
  { title: `${S} Insight`, group: 'insight', order: 1, lessons: 4 },
  { title: `${S} Habit Loop`, group: 'insight', order: 2, lessons: 4 },
  { title: `${S} Nguyên tắc`, group: 'principle', order: 3, lessons: 4 },
  { title: `${S} Kỹ thuật`, group: 'technique', order: 4, lessons: 8 },
]

export const legalPages = [
  ['thong-tin-phap-ly', 'Thông tin pháp lý'],
  ['dieu-khoan-su-dung', 'Điều khoản sử dụng'],
  ['chinh-sach-bao-mat', 'Chính sách bảo mật'],
  ['chinh-sach-cung-cap-dich-vu', 'Chính sách cung cấp dịch vụ'],
  ['gia-thanh-toan', 'Giá và thanh toán'],
  ['phan-anh-khieu-nai', 'Phản ánh và khiếu nại'],
].map(([slug, title], i) => ({
  slug,
  title,
  order: i + 1,
}))

type Block = { type: string; props: Record<string, unknown> }
let blockId = 0
const block = (type: string, props: Record<string, unknown>): Block => ({
  type,
  props: { id: `seed-${type}-${++blockId}`, version: 1, ...props },
})
const header = (line1: string, line2: string, emotion: string, as = 'h2') =>
  block('SectionHeader', {
    seriesLabel: `${S} Trạm Dừng Cảm Xúc`,
    titleLine1: line1,
    titleLine2: line2,
    emotionLine: emotion,
    align: 'center',
    as,
  })
const text = (content: string, bgColor = 'warm-ivory') =>
  block('RichText', { content, bgColor, padding: 'md' })
const cta = (label: string, href: string, variant = 'primary') =>
  block('CTAButton', { label, href, variant, size: 'md', align: 'center' })

// Puck pages. Hero copy is verbatim from AGENTS.md 8.1; everything else is [MẪU].
export const pages = [
  {
    slug: '/',
    title: `${S} Trang chủ`,
    blocks: [
      block('HeroTwoEntries', {
        seriesLabel: 'Trạm Dừng Cảm Xúc',
        titleLine1: 'Hiểu mình rõ. Hành động bền bỉ.',
        titleLine2: 'Tỏa sáng bằng thế mạnh riêng.',
        emotionLine: `${S} Dòng cảm xúc chờ Hana viết`,
        bgColor: 'warm-ivory',
        padding: 'lg',
        entry1: {
          label: 'Cá nhân',
          description: 'Tôi đang ở một bước chuyển trong sự nghiệp',
          buttonText: 'Khám phá cách Hana đồng hành',
          buttonLink: '/coaching',
        },
        entry2: {
          label: 'Doanh nghiệp',
          description: 'Tôi muốn việc học tạo ra hành vi thực tế',
          buttonText: 'Trao đổi về chương trình cho đội ngũ',
          buttonLink: '/doanh-nghiep',
        },
      }),
      header(
        `${S} Chọn`,
        `${S} nhu cầu của bạn`,
        `${S} Tài nguyên miễn phí · Khóa học · Đồng hành`,
      ),
      text(
        `${S} Đoạn giới thiệu ngắn về các lựa chọn.\n\n${S} Nội dung thật sẽ do Hana kéo thả và chỉnh sửa.`,
        'lavender-mist',
      ),
      cta('Đặt phiên trải nghiệm', '/coaching/growth-mirror'),
    ],
  },
  {
    slug: 've-hana',
    title: `${S} Về Hana`,
    blocks: [
      header(`${S} Về`, `${S} Hana Lương`, `${S} Câu chuyện chờ Hana cung cấp`, 'h1'),
      text(`${S} Đoạn giới thiệu về Hana – chờ nội dung thật.`),
      cta('Đặt phiên trải nghiệm', '/coaching/growth-mirror'),
    ],
  },
  {
    slug: 'coaching',
    title: `${S} Coaching`,
    blocks: [
      header(`${S} Đồng hành`, `${S} 1:1 cùng Hana`, `${S} Growth Mirror · Thinking Mirror`, 'h1'),
      text(`${S} Mô tả dịch vụ coaching – chờ nội dung thật.`),
      cta('Xem Growth Mirror', '/coaching/growth-mirror', 'secondary'),
    ],
  },
  {
    slug: 'coaching/growth-mirror',
    title: `${S} Growth Mirror`,
    blocks: [
      header(
        `${S} Growth Mirror`,
        `${S} CLEAR · BUILD · SHINE`,
        `${S} Thử trước bằng một phiên trải nghiệm`,
        'h1',
      ),
      text(
        `${S} Bảng so sánh 3 gói sẽ có ở T1-11 (khối PackageComparison). Giá lấy từ CMS.`,
        'soft-pink',
      ),
      cta('Đặt phiên trải nghiệm', '/coaching/growth-mirror'),
    ],
  },
  {
    slug: 'doanh-nghiep',
    title: `${S} Doanh nghiệp`,
    blocks: [
      header(`${S} Chương trình`, `${S} cho đội ngũ`, `${S} Việc học tạo ra hành vi thực tế`, 'h1'),
      text(`${S} Mô tả chương trình doanh nghiệp – chờ nội dung thật.`, 'deep-navy'),
      cta('Trao đổi về chương trình', '/doanh-nghiep', 'secondary'),
    ],
  },
]

export type NavItemSeed = {
  label: string
  linkType: 'page' | 'url'
  page?: string
  url?: string
  highlight?: boolean
}

// Main menu order from AGENTS.md 8.1. `page` refers to a seeded page slug.
export const mainMenu: NavItemSeed[] = [
  { label: 'Về Hana', linkType: 'page', page: 've-hana' },
  { label: 'Thư viện', linkType: 'url', url: '/thu-vien' },
  { label: 'Test thói quen 5 phút', linkType: 'url', url: '/habit/chan-doan' },
  { label: 'Growth Mirror', linkType: 'page', page: 'coaching/growth-mirror' },
  { label: 'Doanh nghiệp', linkType: 'page', page: 'doanh-nghiep' },
  {
    label: 'Đặt phiên trải nghiệm',
    linkType: 'page',
    page: 'coaching/growth-mirror',
    highlight: true,
  },
]

export const footerMenu: NavItemSeed[] = legalPages.map((p) => ({
  label: p.title,
  linkType: 'url' as const,
  url: `/${p.slug}`,
}))
