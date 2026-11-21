/**
 * CMS site map ("Sơ đồ website", /admin/so-do-website): every public page, what it is and where
 * Hana edits it. Admin help content taken from docs/HUONG_DAN_CMS.md. Pages built with the builder
 * are listed from the database at render time; this file covers the coded pages and shared parts.
 */

/** builder = drag & drop page · form = CMS form · app = application screen (texts only) · shared = whole site */
export type SiteMapKind = 'builder' | 'form' | 'app' | 'shared'

export type SiteMapEditTarget =
  | { type: 'collection'; slug: string; label: string }
  | { type: 'global'; slug: string; label: string }
  /** Builder page with this `pages.slug`; links to the builder when it exists. */
  | { type: 'builderPage'; pageSlug: string; label: string }
  /** Product with this slug; links to its form when it exists. */
  | { type: 'product'; productSlug: string; label: string }
  | { type: 'admin'; href: string; label: string }

export interface SiteMapEntry {
  id: string
  title: string
  /** Address shown to Hana, e.g. `/habit/5-phut`, `/coaching/[tên]`. */
  path: string
  /** Address opened by "Xem trang" (omitted for addresses with a variable part). */
  openPath?: string
  kind: SiteMapKind
  summary: string
  edits: SiteMapEditTarget[]
  tips?: string[]
  /** Exact headings of docs/HUONG_DAN_CMS.md. */
  guides?: string[]
  /** `pages.slug` of a builder page that replaces this coded page when published (BX-08). */
  builderOverrideSlug?: string
}

export interface SiteMapSection {
  id: string
  title: string
  description: string
  entries: SiteMapEntry[]
}

export const GUIDE_URL =
  'https://github.com/residoken-wq/tramdungcamxuc/blob/main/docs/HUONG_DAN_CMS.md'

/** GitHub heading anchor (lowercase, punctuation dropped, spaces → "-"). */
export function guideAnchor(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-')
}

export function guideHref(heading: string): string {
  return `${GUIDE_URL}#${encodeURIComponent(guideAnchor(heading))}`
}

const G = {
  builder: '5. Dựng trang trực quan bằng công cụ kéo thả (Puck Editor)',
  productBuilder: '5.48. Chỉnh bố cục trang sản phẩm bằng builder (BX-08)',
  headerFooter: '5.32. Đầu trang và chân trang dựng bằng trình soạn thảo (EB-10)',
  products: '3. Quản lý Sản phẩm, Giá bán và Tài nguyên',
  habitOffer: '3.1d. Sửa trang Habit Hack (/habit/1-percent-better)',
  comingSoon: '3.4. Cài đặt "Liên kết của nút" và trang Sắp ra mắt',
  privateFiles: '3.6. Tải tài liệu PDF vào "Tài liệu riêng tư" và gắn vào sản phẩm miễn phí',
  lessons: '3.10. Quản lý Bài học và Video khóa học (Habit Hack)',
  journey: '3.11. Habit Hack – Hành trình 28 ngày: 6 bước thiết kế & Tracker đồng hành',
  certificates: '3.12. Quản lý và Thu hồi Chứng nhận (Certificates)',
  eqCards: '3.13. Quản lý 26 thẻ EQ Buddy',
  eqIntro: '3.16. Trang giới thiệu bộ thẻ và Kích hoạt dùng thử EQ Buddy số',
  testimonials: '4. Quản lý Lời chia sẻ của khách hàng (Testimonials)',
  legal: '6. Quản lý Trang pháp lý và Thông tin người bán',
  design: '7.0. Thiết kế & thương hiệu: bảng màu, font, khoá / mở chỉnh kiểu (EB-01)',
  coffee: '7.1b. Cài đặt widget "Ly cà phê" ủng hộ qua mã QR MoMo (CF-01)',
  zalo: '7.2. Cài đặt liên kết Zalo và bật nút trò chuyện nổi (FloatingChat)',
  contact: '7.3b. Thông tin liên hệ, mạng xã hội và lựa chọn "Tình trạng hiện tại"',
  quizButton: '7.3c. Nút sau kết quả quiz chẩn đoán',
  journeyText: '7.3f. Nội dung hành trình Habit & Câu trích từng bước (HB-14 / HB-18 / HB-26)',
  menu: '7.3d. Menu con (menu "Sản phẩm", "Tài nguyên"…)',
  payments: '7.5. Xác nhận chuyển khoản đơn hàng',
  quiz: '9. Quản lý Câu hỏi Quiz chẩn đoán thói quen',
} as const

export const BUILDER_GUIDE = G.builder

const col = (slug: string, label: string): SiteMapEditTarget => ({
  type: 'collection',
  slug,
  label,
})
const glob = (slug: string, label: string): SiteMapEditTarget => ({ type: 'global', slug, label })

export const SITE_MAP_SECTIONS: SiteMapSection[] = [
  {
    id: 'san-pham',
    title: 'Trang sản phẩm & nội dung',
    description:
      'Trang có sẵn, chữ lấy từ form CMS. Một số trang đổi được bố cục bằng builder (có nhãn "Đổi bố cục được").',
    entries: [
      {
        id: 'habit-offer',
        title: 'Habit Hack – trang giới thiệu',
        path: '/habit/1-percent-better',
        openPath: '/habit/1-percent-better',
        kind: 'form',
        summary: 'Trang bán Habit Tracker số: tiêu đề, giá, danh sách, lộ trình, câu hỏi.',
        edits: [
          {
            type: 'product',
            productSlug: 'habit-tracker-so',
            label: 'Sản phẩm "Habit Tracker số"',
          },
        ],
        tips: [
          'Chữ và giá: tab "Trang giới thiệu" và "Giá & bán" của sản phẩm.',
          'Đổi bố cục: ô tím "Bố cục trang sản phẩm" trên đầu form sản phẩm.',
        ],
        guides: [G.habitOffer, G.productBuilder],
        builderOverrideSlug: 'habit/1-percent-better',
      },
      {
        id: 'eq-intro',
        title: 'EQ Buddy – trang giới thiệu',
        path: '/eq-buddy',
        openPath: '/eq-buddy',
        kind: 'form',
        summary:
          'Trang mở đầu bộ thẻ: tiêu đề, "Bộ thẻ là gì", nút rút thẻ, hướng dẫn, nút Shopee.',
        edits: [
          glob('eqBuddyContent', 'Nội dung EQ Buddy'),
          { type: 'product', productSlug: 'eq-buddy-so', label: 'Sản phẩm "EQ Buddy số" (giá)' },
        ],
        tips: ['Đổi bố cục: ô tím "Bố cục trang EQ Buddy" trên đầu Nội dung EQ Buddy.'],
        guides: [G.eqIntro, G.productBuilder],
        builderOverrideSlug: 'eq-buddy',
      },
      {
        id: 'resources',
        title: 'Tài nguyên (thư viện)',
        path: '/tai-nguyen',
        openPath: '/tai-nguyen',
        kind: 'form',
        summary: 'Phần giới thiệu ở trên + danh sách bài viết, tài nguyên miễn phí ở dưới.',
        edits: [
          { type: 'builderPage', pageSlug: 'tai-nguyen', label: 'Phần giới thiệu (builder)' },
          col('posts', 'Bài viết và video'),
          col('products', 'Sản phẩm miễn phí (ebook, toolkit)'),
        ],
        guides: [G.builder, G.products],
      },
      {
        id: 'resource-detail',
        title: 'Một tài nguyên miễn phí',
        path: '/tai-nguyen/[tên sản phẩm]',
        kind: 'form',
        summary: 'Trang nhận ebook / toolkit qua email.',
        edits: [col('products', 'Sản phẩm (loại ebook / toolkit, trạng thái Miễn phí)')],
        tips: [
          'File PDF gắn ở tab "Tài liệu giao" của sản phẩm.',
          'Đổi bố cục: ô tím "Bố cục trang sản phẩm" trên đầu form sản phẩm.',
        ],
        guides: [G.privateFiles, G.productBuilder],
      },
      {
        id: 'coaching-detail',
        title: 'Một dịch vụ coaching',
        path: '/coaching/[tên dịch vụ]',
        kind: 'form',
        summary: 'Trang chi tiết Growth Mirror, Thinking Mirror…',
        edits: [col('services', 'Dịch vụ đồng hành')],
        tips: [
          'Có trang builder cùng đường dẫn (VD coaching/growth-mirror) thì trang builder được hiện.',
        ],
        guides: [G.products, G.builder],
      },
      {
        id: 'program-detail',
        title: 'Một chương trình doanh nghiệp',
        path: '/doanh-nghiep/[tên chương trình]',
        kind: 'form',
        summary: 'Trang chi tiết chương trình cho tổ chức.',
        edits: [col('programs', 'Chương trình doanh nghiệp')],
        tips: ['Có trang builder cùng đường dẫn thì trang builder được hiện.'],
        guides: [G.builder],
      },
      {
        id: 'blog-detail',
        title: 'Một bài viết / video',
        path: '/blog/[tên bài]',
        kind: 'form',
        summary: 'Bài "Đọc sách cùng bạn", video ngắn…',
        edits: [col('posts', 'Bài viết và video')],
      },
      {
        id: 'faq',
        title: 'Câu hỏi thường gặp',
        path: '/cau-hoi-thuong-gap',
        openPath: '/cau-hoi-thuong-gap',
        kind: 'form',
        summary: 'Danh sách câu hỏi – trả lời.',
        edits: [col('faqs', 'Câu hỏi thường gặp')],
      },
      {
        id: 'experience',
        title: 'Đặt phiên trải nghiệm',
        path: '/dat-phien-trai-nghiem',
        openPath: '/dat-phien-trai-nghiem',
        kind: 'form',
        summary: 'Đặt phiên trải nghiệm 149.000đ (đơn + VietQR + link đặt lịch).',
        edits: [
          {
            type: 'product',
            productSlug: 'growth-mirror-phien-trai-nghiem',
            label: 'Sản phẩm "Phiên trải nghiệm"',
          },
          glob('siteSettings', 'Cài đặt website (link đặt lịch)'),
        ],
        tips: ['Khung đầu form sản phẩm cho biết trang đặt lịch đang mở hay đóng.'],
        guides: [G.products],
      },
      {
        id: 'coming-soon',
        title: 'Sắp ra mắt',
        path: '/sap-ra-mat',
        kind: 'form',
        summary: 'Trang "Nhận thông báo" cho sản phẩm trạng thái Sắp ra mắt.',
        edits: [col('products', 'Sản phẩm (trạng thái Sắp ra mắt)')],
        guides: [G.comingSoon],
      },
    ],
  },
  {
    id: 'habit',
    title: 'Habit Hack – công cụ & hành trình',
    description:
      'Màn hình ứng dụng: bố cục cố định, không kéo thả. Chữ, câu hỏi, kỹ thuật, bài học sửa trong CMS.',
    entries: [
      {
        id: 'habit-quiz',
        title: 'Quiz chẩn đoán',
        path: '/habit/chan-doan',
        openPath: '/habit/chan-doan',
        kind: 'app',
        summary: 'Các câu hỏi thang 1–5, kết quả theo giai đoạn và nút sau kết quả.',
        edits: [
          col('diagnosticQuestions', 'Câu hỏi chẩn đoán'),
          glob('habitJourneyContent', 'Nội dung hành trình Habit (phần chẩn đoán)'),
          glob('siteSettings', 'Cài đặt website (nút sau kết quả)'),
        ],
        guides: [G.quiz, G.quizButton],
      },
      {
        id: 'habit-5',
        title: 'Habit Loop 5 phút (6 bước thiết kế)',
        path: '/habit/5-phut',
        openPath: '/habit/5-phut',
        kind: 'app',
        summary: 'Wizard thiết kế thói quen: 4 quy luật, kỹ thuật, ví dụ, ô "Cách tôi áp dụng".',
        edits: [
          col('techniques', 'Kỹ thuật thực hành (ví dụ, nhãn & gợi ý ô nhập)'),
          glob('habitJourneyContent', 'Nội dung hành trình Habit (4 quy luật, khung lưu ý)'),
        ],
        tips: [
          'Ví dụ dưới mỗi kỹ thuật: ô "Ví dụ" dạng danh sách ở đầu form kỹ thuật (tối đa 2 dòng).',
        ],
        guides: [G.journey, G.journeyText],
      },
      {
        id: 'habit-tracker',
        title: 'Tracker 28 ngày',
        path: '/habit/tracker',
        openPath: '/habit/tracker',
        kind: 'app',
        summary: 'Lưới check-in, cảm xúc, các trạm suy ngẫm, khung sau hành trình.',
        edits: [
          glob('habitJourneyContent', 'Nội dung hành trình Habit (trạm, câu trích)'),
          glob('siteSettings', 'Cài đặt website (số ngày, link Coach)'),
        ],
        tips: ['Cần tài khoản học viên để xem.'],
        guides: [G.journey, G.journeyText],
      },
      {
        id: 'habit-learn',
        title: 'Khu học bài (video)',
        path: '/habit/hoc',
        openPath: '/habit/hoc',
        kind: 'app',
        summary: 'Danh sách nhóm bài và video bài học.',
        edits: [col('lessons', 'Bài học'), col('courseModules', 'Nhóm bài học')],
        tips: ['Thêm bài nhanh: trình hướng dẫn "Thêm bài học".'],
        guides: [G.lessons],
      },
      {
        id: 'certificate',
        title: 'Chứng nhận công khai',
        path: '/chung-nhan/[mã]',
        kind: 'app',
        summary: 'Trang xác minh chứng nhận: tên, câu định danh, số ngày, ngày cấp.',
        edits: [col('certificates', 'Chứng nhận')],
        guides: [G.certificates],
      },
    ],
  },
  {
    id: 'eq',
    title: 'EQ Buddy – rút thẻ',
    description: 'Màn hình ứng dụng. Nội dung thẻ sửa ở "Thẻ EQ Buddy".',
    entries: [
      {
        id: 'eq-draw',
        title: 'Rút thẻ',
        path: '/eq-buddy/rut-the',
        openPath: '/eq-buddy/rut-the',
        kind: 'app',
        summary: 'Chọn cảm xúc / chủ đề, lật thẻ, suy ngẫm, lưu và chia sẻ.',
        edits: [col('eqCards', 'Thẻ EQ Buddy'), glob('eqBuddyContent', 'Nội dung EQ Buddy')],
        guides: [G.eqCards],
      },
      {
        id: 'eq-card',
        title: 'Trang thẻ mở từ QR',
        path: '/eq-buddy/the/[mã QR]',
        kind: 'app',
        summary: 'Đích của QR in trên thẻ vật lý.',
        edits: [col('eqCards', 'Thẻ EQ Buddy')],
        tips: ['Không đổi "mã QR" của thẻ đã in.'],
        guides: [G.eqCards],
      },
    ],
  },
  {
    id: 'phap-ly',
    title: 'Trang pháp lý (chân trang)',
    description:
      'Nội dung do Hana soạn trong "Trang pháp lý". Thông tin người bán ở Cài đặt website.',
    entries: [
      ['thong-tin-phap-ly', 'Thông tin pháp lý'],
      ['dieu-khoan-su-dung', 'Điều khoản sử dụng'],
      ['chinh-sach-bao-mat', 'Chính sách bảo mật'],
      ['chinh-sach-cung-cap-dich-vu', 'Chính sách cung cấp dịch vụ'],
      ['gia-thanh-toan', 'Giá & thanh toán'],
      ['phan-anh-khieu-nai', 'Phản ánh – khiếu nại'],
    ].map(([slug, title]) => ({
      id: `legal-${slug}`,
      title,
      path: `/${slug}`,
      openPath: `/${slug}`,
      kind: 'form' as const,
      summary: 'Trang chữ, hiện ở chân trang mọi trang.',
      edits:
        slug === 'thong-tin-phap-ly'
          ? [
              col('legalPages', 'Trang pháp lý'),
              glob('siteSettings', 'Cài đặt website (người bán)'),
            ]
          : [col('legalPages', 'Trang pháp lý')],
      guides: [G.legal],
    })),
  },
  {
    id: 'mua-hang',
    title: 'Mua hàng & tài khoản',
    description: 'Màn hình ứng dụng, không chỉnh bố cục. Giá lấy từ sản phẩm.',
    entries: [
      {
        id: 'checkout',
        title: 'Thanh toán',
        path: '/thanh-toan',
        kind: 'app',
        summary: 'Đơn hàng, mã chuyển khoản, VietQR.',
        edits: [
          glob('siteSettings', 'Cài đặt website (tài khoản nhận tiền)'),
          col('orders', 'Đơn hàng (xác nhận chuyển khoản)'),
        ],
        guides: [G.payments],
      },
      {
        id: 'trial',
        title: 'Đăng ký dùng thử',
        path: '/dung-thu',
        kind: 'app',
        summary: 'Đăng nhập OTP rồi mở công cụ số dùng thử.',
        edits: [col('products', 'Sản phẩm (số ngày dùng thử)')],
      },
      {
        id: 'account',
        title: 'Tài khoản khách',
        path: '/tai-khoan',
        openPath: '/tai-khoan',
        kind: 'app',
        summary: 'Khoá học, thẻ đã lưu, đơn hàng của khách.',
        edits: [],
        tips: ['Không có chữ cần sửa.'],
      },
    ],
  },
  {
    id: 'dung-chung',
    title: 'Phần dùng chung toàn website',
    description: 'Sửa một lần, mọi trang đều đổi.',
    entries: [
      {
        id: 'menu',
        title: 'Menu chính & menu chân trang',
        path: 'Mọi trang',
        kind: 'shared',
        summary: 'Các mục menu, menu con "Sản phẩm", "Tài nguyên".',
        edits: [glob('navigation', 'Menu điều hướng')],
        guides: [G.menu],
      },
      {
        id: 'header-footer',
        title: 'Đầu trang & chân trang',
        path: 'Mọi trang',
        kind: 'shared',
        summary: 'Logo, thanh trên cùng, phần chân trang.',
        edits: [glob('navigation', 'Menu điều hướng → Đầu trang / Chân trang')],
        tips: ['Chọn nguồn "Dựng bằng Builder" để kéo thả đầu / chân trang.'],
        guides: [G.headerFooter],
      },
      {
        id: 'design',
        title: 'Màu & font',
        path: 'Mọi trang',
        kind: 'shared',
        summary: 'Bảng màu, font theo Brand Book.',
        edits: [glob('designSystem', 'Thiết kế & thương hiệu')],
        guides: [G.design],
      },
      {
        id: 'settings',
        title: 'Liên hệ, Zalo, ly cà phê',
        path: 'Mọi trang',
        kind: 'shared',
        summary: 'Email, mạng xã hội, nút chat Zalo nổi, nút "Ly cà phê", chuyển khoản.',
        edits: [glob('siteSettings', 'Cài đặt website')],
        guides: [G.contact, G.zalo, G.coffee],
      },
      {
        id: 'testimonials',
        title: 'Lời chia sẻ & đội ngũ',
        path: 'Các khối trên trang builder',
        kind: 'shared',
        summary: 'Dùng lại ở nhiều trang qua khối Lời chia sẻ / Đội ngũ.',
        edits: [col('testimonials', 'Lời chia sẻ'), col('teamMembers', 'Đội ngũ')],
        tips: ['Lời chia sẻ chỉ xuất bản được khi đã tick "Đã đồng ý cho phép hiển thị".'],
        guides: [G.testimonials],
      },
    ],
  },
]

/** `pages.slug` values that replace a coded page (BX-08) – not listed as a separate page. */
export const OVERRIDE_PAGE_SLUGS: readonly string[] = SITE_MAP_SECTIONS.flatMap((s) =>
  s.entries.map((e) => e.builderOverrideSlug).filter((v): v is string => Boolean(v)),
)

/** Short notes for well-known builder pages (by slug). */
export const BUILDER_PAGE_NOTES: Record<string, string> = {
  '/': 'Trang chủ. Khối "Hero 2 lối vào" bị khoá, không xoá được.',
  'tai-nguyen':
    'Chỉ là phần giới thiệu trên đầu trang Tài nguyên; danh sách bài lấy từ "Bài viết và video".',
}
