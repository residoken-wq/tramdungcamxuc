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
    externalUrl: '/habit/5-phut',
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
    externalUrl: '/habit/chan-doan',
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
    includes: [
      { text: `${S} 20 video bài giảng ngắn (5–7 phút) chia theo 4 chặng Habit Loop` },
      { text: `${S} 11 kỹ thuật thực chiến can thiệp hành vi cá nhân hóa` },
      { text: `${S} Tracker 21 ngày tương tác với 10 trạng thái cảm xúc` },
      { text: `${S} Tài liệu hướng dẫn và bài tập phản chiếu tự nhận thức` },
    ],
    faq: [
      {
        question: `${S} Khóa học và công cụ này phù hợp với ai?`,
        answer: `${S} Dành cho người đi làm thường xuyên trì hoãn, muốn xây dựng thói quen kiên định nhưng không muốn tạo thêm áp lực căng thẳng cho bản thân.`,
      },
      {
        question: `${S} Sau 21 ngày dùng thử miễn phí, tôi có bị tự động trừ tiền không?`,
        answer: `${S} Không. Trạm Dừng Cảm Xúc không yêu cầu nhập thông tin thẻ ngân hàng khi dùng thử. Hết 21 ngày, bạn hoàn toàn tự quyết định có nâng cấp hay không.`,
      },
    ],
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
const cta = (label: string, href: string, variant = 'primary', size = 'md') =>
  block('CTAButton', {
    version: 2,
    label,
    href,
    variant,
    size,
    align: 'center',
    linkType: 'url',
    pageId: '',
  })

// Puck pages. Hero copy is verbatim from AGENTS.md 8.1; everything else is [MẪU].
export const pages = [
  {
    slug: '/',
    title: `${S} Trang chủ`,
    blocks: [
      block('HeroTwoEntries', {
        version: 1,
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
        `${S} CHỌN NHU CẦU`,
        `${S} CỦA BẠN`,
        `${S} Tài nguyên miễn phí · Khóa học · Đồng hành`,
        'h2',
      ),
      block('LibraryPreview', {
        version: 1,
        seriesLabel: `${S} Khám phá tri thức`,
        titleLine1: `${S} TÀI NGUYÊN & KHÓA HỌC`,
        titleLine2: `${S} DÀNH CHO BẠN`,
        emotionLine: `${S} Những tài nguyên, bài học và công cụ được đúc kết từ thực tiễn.`,
        tab: 'khoa-hoc',
        limit: 3,
        bgColor: 'warm-ivory',
        padding: 'md',
      }),
      block('ProductGrid', {
        version: 1,
        mode: 'filter',
        filterWeb: 'site',
        filterType: 'package',
        limit: 3,
        columns: 3,
        bgColor: 'warm-ivory',
        padding: 'md',
      }),
      block('HanaStory', {
        version: 1,
        seriesLabel: `${S} Về người đồng hành`,
        titleLine1: `${S} HÀNH TRÌNH ĐỒNG HÀNH`,
        titleLine2: `${S} THẤU CẢM & CHUYỂN HÓA`,
        storyContent: `${S} Đoạn văn bản kể về hành trình và chiêm nghiệm – chờ nội dung thật từ người đồng hành.\n\n${S} Nội dung chi tiết về triết lý đồng hành sẽ do người đồng hành cung cấp.`,
        quoteLine: `${S} Lắng nghe cảm xúc để thấu hiểu chính mình.`,
        mediaId: '',
        imageUrl: '',
        imageAlt: '',
        buttonText: 'Tìm hiểu thêm về người đồng hành',
        buttonLink: '/ve-hana',
        bgColor: 'warm-ivory',
        padding: 'lg',
      }),
      block('StatsBar', {
        version: 1,
        stats: [
          { value: `${S} Số liệu 1`, label: `${S} Nhãn mô tả 1` },
          { value: `${S} Số liệu 2`, label: `${S} Nhãn mô tả 2` },
          { value: `${S} Số liệu 3`, label: `${S} Nhãn mô tả 3` },
        ],
        bgColor: 'lavender-mist',
        padding: 'md',
      }),
      block('TestimonialGrid', {
        version: 1,
        mode: 'recent',
        manualTestimonials: [],
        limit: 3,
        columns: 3,
        bgColor: 'warm-ivory',
        padding: 'lg',
      }),
      block('LeadForm', {
        version: 1,
        title: `${S} Nhận tài nguyên cảm xúc & thói quen`,
        description: `${S} Để lại email để nhận Ebook và bộ công cụ EQ chuyển hóa cảm xúc từ Trạm Dừng Cảm Xúc.`,
        resourceProductId: 'ebook-cong-cu-eq',
        need: 'resource',
        interestTags: 'ebook, eq',
        submitLabel: 'Nhận tài nguyên miễn phí',
      }),
      block('QuizCTA', {
        version: 1,
        seriesLabel: `${S} Thấu hiểu bản thân`,
        titleLine1: `${S} 5 PHÚT CHẨN ĐOÁN`,
        titleLine2: `${S} ĐIỂM NGHẼN THÓI QUEN`,
        emotionLine: `${S} Nhận diện nguyên nhân gốc rễ và bức tranh cảm xúc đang chi phối hành động của bạn.`,
        buttonText: 'Bắt đầu chẩn đoán 5 phút',
        bgColor: 'mint-haze',
        padding: 'lg',
      }),
      block('BookingCTA', {
        version: 1,
        productId: 'growth-mirror-phien-trai-nghiem',
        title: `${S} Bắt đầu bằng một phiên trải nghiệm`,
        // Price is rendered from the product by the block; never write it into sample copy.
        description: `${S} Phiên trải nghiệm giúp bạn hiểu cách thức đồng hành trước khi chọn gói.`,
        buttonLabel: 'Đặt phiên trải nghiệm',
        bgColor: 'soft-pink',
        padding: 'lg',
      }),
    ],
  },
  {
    slug: 've-hana',
    title: `${S} Về Hana`,
    blocks: [
      block('HeroImage', {
        version: 1,
        seriesLabel: `${S} Người đồng hành`,
        titleLine1: `${S} ĐỒNG HÀNH CHUYỂN HÓA`,
        titleLine2: `${S} CÙNG TRẠM DỪNG CẢM XÚC`,
        emotionLine: `${S} Lắng nghe và thấu hiểu để bước tiếp với sự vững vàng.`,
        mediaId: '',
        imageUrl: '',
        imageAlt: '',
        buttonText: 'Khám phá các dịch vụ đồng hành',
        buttonLink: '/coaching',
        bgColor: 'warm-ivory',
        padding: 'lg',
      }),
      block('HanaStory', {
        version: 1,
        seriesLabel: `${S} Câu chuyện người đồng hành`,
        titleLine1: `${S} HÀNH TRÌNH TỰ THÂN`,
        titleLine2: `${S} VÀ KHÁT VỌNG ĐỒNG HÀNH`,
        storyContent: `${S} Đoạn giới thiệu về người đồng hành – chờ nội dung thật.\n\n${S} Nội dung chuyên môn và trải nghiệm thực tế sẽ do người đồng hành cung cấp.`,
        quoteLine: `${S} Khi ta dám dừng lại và nhìn sâu vào cảm xúc, mọi chuyển hóa đều trở nên tự nhiên.`,
        mediaId: '',
        imageUrl: '',
        imageAlt: '',
        buttonText: '',
        buttonLink: '',
        bgColor: 'warm-ivory',
        padding: 'lg',
      }),
      block('JourneySteps', {
        version: 1,
        seriesLabel: `${S} Phương pháp tiếp cận`,
        titleLine1: `${S} HÀNH TRÌNH 5 BƯỚC`,
        titleLine2: `${S} CHUYỂN HÓA CẢM XÚC`,
        emotionLine: `${S} Từng bước chân giúp bạn đi từ nhận biết đến làm chủ hành vi.`,
        step1Description: `${S} Dừng lại: Nhận diện khoảnh khắc cảm xúc dâng trào và tạo khoảng lặng cần thiết.`,
        step2Description: `${S} Cảm nhận: Cho phép bản thân trải nghiệm cảm giác trong cơ thể mà không phán xét.`,
        step3Description: `${S} Gọi tên: Xác định chính xác cảm xúc đang hiện diện với sự thấu cảm.`,
        step4Description: `${S} Lựa chọn: Tìm kiếm phản hồi mang tính xây dựng thay vì phản ứng theo thói quen.`,
        step5Description: `${S} Thực hành: Rèn luyện hành vi mới mỗi ngày qua từng bước nhỏ bền bỉ.`,
        bgColor: 'warm-ivory',
        padding: 'lg',
      }),
      block('QuoteBlock', {
        version: 1,
        quote: `${S} Cảm xúc không phải là kẻ thù cần chế ngự, mà là người dẫn đường cần được lắng nghe và thấu hiểu.`,
        cite: `${S} Người đồng hành`,
        roleOrContext: `${S} Trạm Dừng Cảm Xúc`,
        bgColor: 'lavender-mist',
        padding: 'lg',
      }),
      cta('Đặt phiên trải nghiệm', '/coaching/growth-mirror', 'primary', 'lg'),
    ],
  },
  {
    slug: 'coaching',
    title: `${S} Coaching`,
    blocks: [
      header(
        `${S} ĐỒNG HÀNH 1:1`,
        `${S} CÙNG NGƯỜI ĐỒNG HÀNH`,
        `${S} Growth Mirror · Thinking Mirror · Không gian an toàn để bạn nhìn rõ chính mình.`,
        'h1',
      ),
      block('ProductGrid', {
        version: 1,
        mode: 'filter',
        filterWeb: 'site',
        filterType: 'package',
        limit: 3,
        columns: 3,
        bgColor: 'warm-ivory',
        padding: 'lg',
      }),
      block('FAQ', {
        version: 1,
        seriesLabel: `${S} Giải đáp thắc mắc`,
        titleLine1: `${S} CÂU HỎI THƯỜNG GẶP`,
        titleLine2: `${S} VỀ COACHING 1:1`,
        items: [
          {
            question: `${S} Phiên coaching 1:1 diễn ra như thế nào?`,
            answer: `${S} Một không gian lắng nghe sâu, không phán xét, giúp bạn nhận diện điểm nghẽn và tháo gỡ từng nút thắt cảm xúc.`,
          },
          {
            question: `${S} Tôi cần chuẩn bị gì trước mỗi phiên làm việc?`,
            answer: `${S} Bạn chỉ cần chuẩn bị sự cởi mở và một không gian riêng tư, yên tĩnh để hoàn toàn kết nối với chính mình.`,
          },
          {
            question: `${S} Sau phiên trải nghiệm tôi có bắt buộc phải đăng ký gói không?`,
            answer: `${S} Không, phiên trải nghiệm giúp bạn thử nghiệm sự phù hợp trước khi quyết định có đồng hành dài hạn hay không.`,
          },
        ],
        bgColor: 'warm-ivory',
        padding: 'lg',
      }),
      block('BookingCTA', {
        version: 1,
        productId: 'growth-mirror-phien-trai-nghiem',
        title: `${S} Bắt đầu bằng một phiên trải nghiệm`,
        description: `${S} Một phiên làm việc 1:1 giúp bạn làm rõ bức tranh hiện tại và định hình hướng đi tiếp theo.`,
        buttonLabel: 'Đặt phiên trải nghiệm',
        bgColor: 'soft-pink',
        padding: 'lg',
      }),
    ],
  },
  {
    slug: 'coaching/growth-mirror',
    title: `${S} Growth Mirror`,
    blocks: [
      header(
        `${S} GROWTH MIRROR`,
        `${S} CLEAR · BUILD · SHINE`,
        `${S} Ba lộ trình đồng hành được thiết kế riêng cho từng bước chuyển của bạn.`,
        'h1',
      ),
      block('PackageComparison', {
        version: 2,
        packages: [
          { packageSlug: 'growth-mirror-clear' },
          { packageSlug: 'growth-mirror-build' },
          { packageSlug: 'growth-mirror-shine' },
        ],
        showTotalValue: true,
        showDiscountPercent: true,
        note: `${S} Chi tiết chính sách thanh toán và quyền lợi xem bên dưới.`,
        showPaymentPolicyLink: true,
        bgColor: 'warm-ivory',
        padding: 'lg',
      }),
      block('BookingCTA', {
        version: 1,
        productId: 'growth-mirror-phien-trai-nghiem',
        title: `${S} Bắt đầu bằng một phiên trải nghiệm`,
        // Price is rendered from the product by the block; never write it into sample copy.
        description: `${S} Phiên trải nghiệm giúp bạn hiểu cách thức đồng hành trước khi chọn gói.`,
        buttonLabel: 'Đặt phiên trải nghiệm',
        bgColor: 'soft-pink',
        padding: 'lg',
      }),
      block('FAQ', {
        version: 1,
        seriesLabel: `${S} Thắc mắc về các gói`,
        titleLine1: `${S} CÂU HỎI THƯỜNG GẶP`,
        titleLine2: `${S} VỀ GROWTH MIRROR`,
        items: [
          {
            question: `${S} Sự khác biệt giữa 3 gói CLEAR, BUILD và SHINE là gì?`,
            answer: `${S} Mỗi gói được thiết kế theo mức độ đồng hành và số lượng phiên làm việc phù hợp với nhu cầu và mục tiêu của bạn.`,
          },
          {
            question: `${S} Làm thế nào để biết tôi phù hợp với gói nào nhất?`,
            answer: `${S} Sau phiên trải nghiệm đầu tiên, người đồng hành sẽ cùng bạn phân tích và tư vấn lộ trình phù hợp nhất.`,
          },
          {
            question: `${S} Các hợp phần công cụ số đi kèm được kích hoạt khi nào?`,
            answer: `${S} Toàn bộ công cụ số và quyền lợi cộng đồng sẽ được kích hoạt ngay khi bạn bắt đầu gói đồng hành.`,
          },
        ],
        bgColor: 'warm-ivory',
        padding: 'lg',
      }),
      block('TestimonialSlider', {
        version: 1,
        manualTestimonials: [],
        bgColor: 'warm-ivory',
        padding: 'lg',
      }),
    ],
  },
  {
    slug: 'doanh-nghiep',
    title: `${S} Doanh nghiệp`,
    blocks: [
      header(
        `${S} CHƯƠNG TRÌNH`,
        `${S} CHO ĐỘI NGŨ`,
        `${S} Việc học tạo ra hành vi thực tế và nuôi dưỡng văn hóa thấu cảm trong tổ chức.`,
        'h1',
      ),
      block('ImageText', {
        version: 1,
        layout: 'image-left',
        seriesLabel: `${S} Triết lý đào tạo`,
        titleLine1: `${S} TỪ NHẬN THỨC`,
        titleLine2: `${S} ĐẾN HÀNH VI BỀN VỮNG`,
        content: `${S} Chương trình được thiết kế may đo dựa trên bối cảnh cụ thể của từng tổ chức và đội ngũ.\n\n${S} Chúng tôi kết hợp giữa khai vấn, thực hành thói quen và kỹ năng quản trị cảm xúc để mang lại sự chuyển hóa thực chất.`,
        mediaId: '',
        buttonText: 'Gửi brief yêu cầu',
        buttonLink: '#gui-brief',
        bgColor: 'warm-ivory',
        padding: 'lg',
      }),
      block('ProductGrid', {
        version: 1,
        mode: 'filter',
        filterWeb: 'all',
        filterType: 'b2b',
        limit: 3,
        columns: 3,
        bgColor: 'warm-ivory',
        padding: 'lg',
      }),
      block('LogoStrip', {
        version: 1,
        title: `${S} ĐƯỢC ĐỒNG HÀNH VÀ TIN TƯỞNG BỞI`,
        logos: [],
        bgColor: 'warm-ivory',
        padding: 'md',
      }),
      block('B2BBriefForm', {
        version: 1,
        title: `${S} Gửi brief đào tạo & đồng hành doanh nghiệp`,
        description: `${S} Chia sẻ bối cảnh và mục tiêu của tổ chức để Trạm Dừng Cảm Xúc đồng hành thiết kế giải pháp phù hợp nhất.`,
        submitLabel: 'Gửi brief yêu cầu',
      }),
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
