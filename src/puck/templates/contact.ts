import type { Data } from '@puckeditor/core'

/**
 * Mẫu trang Liên hệ (Website v2) – template: 'contact'
 * Thiết kế v2 mục §6 (tr. 58–62):
 * 6.1 Hero (Columns: RichText trong thẻ + 2 Card icon + Card ảnh có nhãn Không gian kết nối)
 * 6.2 Kênh liên hệ (ContactInfo → siteSettings)
 * 6.3 Form phân luồng (ContactForms columns: Cá nhân & Doanh nghiệp)
 * 6.4 FAQ nhanh (FAQ quick PK-21 + nút "Xem toàn bộ")
 */
export const contactTemplate: Data = {
  content: [
    // 6.1 Hero: Columns (RichText trong thẻ + 2 Card icon + Card ảnh có nhãn Không gian kết nối)
    {
      type: 'Columns',
      props: {
        id: 'contact-hero-cols',
        numColumns: '2',
        gap: 'lg',
        bgColor: 'warm-ivory',
        padding: 'lg',
        col1: [
          {
            type: 'Card',
            props: {
              id: 'contact-hero-intro',
              version: 1,
              icon: 'heart',
              title: 'Lắng nghe để kiến tạo sự chuyển hóa',
              text: 'Dù bạn đang tìm kiếm một lộ trình bứt phá cho cá nhân hay một giải pháp đào tạo toàn diện để nâng tầm đội ngũ, Trạm Dừng Cảm Xúc luôn ở đây, sẵn sàng đồng hành cùng bạn.',
              titleColor: 'deep-navy',
              textColor: 'deep-navy',
              titleSize: 'lg',
              textSize: 'md',
              align: 'left',
              highlight: 'none',
              cardAccent: 'bright-magenta',
              cardFrame: 'solid',
            },
          },
          {
            type: 'Card',
            props: {
              id: 'contact-hero-card-1',
              version: 1,
              icon: 'user',
              title: 'Đồng hành 1:1',
              text: 'Lộ trình thiết kế riêng thấu hiểu từng nhu cầu.',
              titleColor: 'deep-navy',
              textColor: 'deep-navy',
              titleSize: 'md',
              textSize: 'md',
              align: 'left',
              highlight: 'none',
              cardAccent: 'accent-pink',
              cardFrame: 'solid',
            },
          },
          {
            type: 'Card',
            props: {
              id: 'contact-hero-card-2',
              version: 1,
              icon: 'target',
              title: 'Giải pháp toàn diện',
              text: 'Nâng tầm đội ngũ & phát triển bền vững.',
              titleColor: 'deep-navy',
              textColor: 'deep-navy',
              titleSize: 'md',
              textSize: 'md',
              align: 'left',
              highlight: 'none',
              cardAccent: 'deep-navy',
              cardFrame: 'solid',
            },
          },
        ],
        col2: [
          {
            type: 'Card',
            props: {
              id: 'contact-hero-image-card',
              version: 1,
              icon: 'spark',
              title: '',
              text: '',
              titleColor: 'deep-navy',
              textColor: 'deep-navy',
              titleSize: 'md',
              textSize: 'md',
              align: 'left',
              highlight: 'none',
              cardAccent: 'none',
              cardFrame: 'solid',
              mediaId: '',
              imageUrl: '',
              imageAlt: '',
              imageShape: 'arch-right',
              imageBadge: 'Không gian kết nối',
              imageCaptionTitle: '',
              imageCaptionSubtitle: '',
              captionPosition: 'bottom-left',
              imageCaptionAvatars: [],
            },
          },
        ],
        col3: [],
      },
    },

    // 6.2 Kênh liên hệ: ContactInfo → CMS (siteSettings)
    {
      type: 'ContactInfo',
      props: {
        id: 'contact-info',
        version: 1,
        seriesLabel: 'Quick contact info • Thông tin liên hệ trực tiếp',
        titleLine1: 'Kết nối nhanh chóng cùng Trạm Dừng Cảm Xúc',
        titleLine2: '',
        emotionLine:
          'Chúng tôi luôn sẵn sàng lắng nghe và đồng hành cùng bạn. Chọn kênh liên hệ thuận tiện nhất để bắt đầu cuộc trò chuyện ngay hôm nay.',
        showEmail: true,
        showHotline: true,
        showOfficeAddress: true,
        showSocial: true,
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },

    // 6.3 Form phân luồng: ContactForms columns
    {
      type: 'ContactForms',
      props: {
        id: 'contact-forms',
        version: 1,
        layout: 'columns',
        titleB2C: 'Cá nhân',
        descriptionB2C:
          'Đặt lịch Khai vấn 1:1, tư vấn khóa học hoặc hỗ trợ liên quan đến sản phẩm số/tài liệu.',
        submitLabelB2C: 'Gửi yêu cầu hỗ trợ',
        successTitleB2C: '',
        successMessageB2C: '',
        titleB2B: 'Doanh nghiệp',
        descriptionB2B:
          'Gửi brief để thiết kế chương trình đào tạo EQ & Habit Formation riêng biệt cho đội ngũ.',
        submitLabelB2B: 'Gửi yêu cầu Thiết kế chương trình',
        successTitleB2B: '',
        successMessageB2B: '',
        bgColor: 'warm-ivory',
        padding: 'lg',
      },
    },

    // 6.4 FAQ nhanh: FAQ quick (PK-21) + nút Xem toàn bộ
    // PK-21: đổi sang FAQ quick khi PK-21 merge
    {
      type: 'FAQ',
      props: {
        id: 'contact-faq',
        version: 5,
        source: 'group',
        group: 'general',
        limit: 5,
        seriesLabel: 'FAQ quick links • Hỗ trợ nhanh',
        seriesLabelStyle: 'text',
        titleLine1: 'Bạn cần giải đáp nhanh?',
        titleLine2: '',
        description:
          'Tiết kiệm thời gian tìm kiếm thông tin bằng cách xem nhanh giải đáp cho các câu hỏi phổ biến bên dưới.',
        iconStyle: 'chevron',
        numbered: false,
        aside: 'none',
        contactMediaId: '',
        contactBadge: '',
        bookingAsideTitle: '',
        bookingAsideDescription: '',
        bookingButtonText: '',
        bookingButtonLink: '',
        showEmail: false,
        seeAllLink: '/cau-hoi-thuong-gap',
        items: [],
        bgColor: 'warm-ivory',
        padding: 'lg',
      },
    },
  ],
  root: {
    props: {
      title: 'Liên hệ',
    },
  },
  zones: {},
}
