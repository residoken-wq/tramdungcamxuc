import type { Data } from '@puckeditor/core'

export const resourcesTemplate: Data = {
  content: [
    // 4.1 Hero Thư viện tri thức & công cụ
    {
      type: 'LeadMagnetCarousel',
      props: {
        id: 'resources-lead-magnet-carousel',
        display: 'list',
        version: 1,
        seriesLabel: 'Resources & knowledge hub',
        titleLine1: 'Thư viện tri thức & công cụ',
        titleLine2: '',
        emotionLine:
          'Nơi lưu giữ những bài viết chuyên sâu và các công cụ thực hành miễn phí, giúp bạn nuôi dưỡng Trí tuệ Cảm xúc (EQ), xây dựng thói quen và vững bước trên con đường sự nghiệp.',
        mode: 'auto',
        manualProducts: [],
        bgColor: 'warm-ivory',
        padding: 'lg',
      },
    },

    // 4.2 Bài viết chuyên đề
    {
      type: 'LibraryPreview',
      props: {
        id: 'resources-library-preview',
        layout: 'featured',
        version: 1,
        seriesLabel: 'SEO articles & blog • Góc nhìn chuyên gia',
        titleLine1: 'Bài viết chuyên đề',
        titleLine2: '',
        emotionLine: '',
        tab: 'bai-viet',
        limit: 6,
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'Callout',
      props: {
        id: 'resources-callout-strip',
        version: 1,
        variant: 'strip',
        title: 'TRẠM DỪNG CẢM XÚC:',
        description:
          '**Tài nguyên miễn phí** giúp bạn xây dựng thói quen tích cực và phát triển bản thân mỗi ngày.',
        titleSize: 'sm',
        textSize: 'md',
        align: 'center',
        showButton: false,
        buttonText: '',
        buttonLinkType: 'url',
        buttonPageId: '',
        buttonLink: '',
        buttonVariant: 'primary',
        bgColor: 'warm-ivory',
        padding: 'sm',
      },
    },

    // 4.3 Bản tin hàng tuần
    {
      type: 'IconCardGrid',
      props: {
        id: 'resources-newsletter-benefits',
        version: 2,
        seriesLabel: 'Weekly newsletter & insights',
        titleLine1: 'Nuôi dưỡng nội lực mỗi tuần',
        titleLine2: '',
        emotionLine: '',
        columns: 3,
        _style: { cardAccent: 'cycle' },
        cardStyle: 'white',
        cardAlign: 'inherit',
        marker: 'icon',
        cards: [
          {
            type: 'Card',
            props: {
              id: 'resources-benefit-card-0',
              icon: 'pencil',
              title: 'Bài viết Chuyên sâu',
              text: 'Góc nhìn quản trị cảm xúc, tâm lý học ứng dụng và khoa học thói quen từ các chuyên gia.',
              titleColor: 'deep-navy',
              textColor: 'deep-navy',
              titleSize: 'md',
              textSize: 'md',
              align: 'left',
              highlight: 'none',
              _style: { cardAccent: 'bright-magenta' },
            },
          },
          {
            type: 'Card',
            props: {
              id: 'resources-benefit-card-1',
              icon: 'flower',
              title: 'Podcast & Âm thanh Trầm lắng',
              text: 'Những cuộc trò chuyện chữa lành và suy ngẫm giúp bạn tĩnh lặng giữa nhịp sống hối hả.',
              titleColor: 'deep-navy',
              textColor: 'deep-navy',
              titleSize: 'md',
              textSize: 'md',
              align: 'left',
              highlight: 'none',
              _style: { cardAccent: 'accent-pink' },
            },
          },
          {
            type: 'Card',
            props: {
              id: 'resources-benefit-card-2',
              icon: 'heart',
              title: 'Công cụ Thực hành Miễn phí',
              text: 'Nhận ngay các Template, Toolkit rèn luyện EQ và theo dõi thói quen hàng tuần.',
              titleColor: 'deep-navy',
              textColor: 'deep-navy',
              titleSize: 'md',
              textSize: 'md',
              align: 'left',
              highlight: 'none',
              _style: { cardAccent: 'deep-navy' },
            },
          },
        ],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'NewsletterForm',
      props: {
        id: 'resources-newsletter-form',
        version: 1,
        title: 'Nuôi dưỡng nội lực mỗi tuần',
        description:
          'Đăng ký nhận bản tin (Newsletter) hàng tuần từ Trạm Dừng Cảm Xúc để cập nhật những bài viết, podcast và công cụ thực hành mới nhất.',
        submitLabel: '',
        consentText: '',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },

    // 4.4 CTA Cuối trang
    {
      type: 'CTASection',
      props: {
        id: 'resources-cta-final',
        version: 1,
        titleSize: 'md',
        textSize: 'md',
        seriesLabel: 'Bắt đầu hành trình',
        titleLine1: 'Đã sẵn sàng cho những bước đi sâu hơn?',
        titleLine2: '',
        emotionLine: '',
        description:
          'Chuyển hóa kiến thức thành kết quả thực tế với các lộ trình đồng hành chuyên sâu của chúng tôi.',
        buttonText: 'Khám phá Lộ trình Chuyển mình (Cá nhân)',
        buttonLinkType: 'url',
        buttonLink: '/lo-trinh-chuyen-minh',
        buttonPageId: '',
        proofText: '',
        testimonials: [],
        bgColor: 'deep-navy',
        padding: 'lg',
      },
    },
  ],
  root: {
    props: {
      title: 'Thư viện tri thức & công cụ',
    },
  },
  zones: {},
}
