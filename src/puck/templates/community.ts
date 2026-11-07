import type { Data } from '@puckeditor/core'

/**
 * Mẫu trang Cộng đồng của Trạm (Website v2) – template: 'community'
 * Thiết kế v2 mục §5 (tr. 48–56):
 * 5.1 Hero (backdrop tối, ảnh nền [MẪU])
 * 5.2 Chọn không gian (IconCardGrid dạng trượt, vạch màu)
 * 5.3 Me Time (ImageText ảnh phải, nền soft-pink, anchorId: me-time)
 * 5.4 Lịch trình 5:00 AM (IconCardGrid 3 cột, vạch màu cycle)
 * 5.5 Tiếng nói cộng đồng Me Time (TestimonialGrid featured, nền lavender-mist)
 * 5.6 Khoảnh khắc Me Time (PhotoGallery mosaic fallback)
 * 5.7 Yoga Buddy (ImageText ảnh trái tràn mép, anchorId: yoga-buddy)
 * 5.8 Cuộc hẹn 8:30 sáng thứ 3 & 5 (Columns 2 Card có vạch màu, nền soft-pink)
 * 5.9 Góc nhỏ Yoga Buddy (PhotoGallery fallback)
 * 5.10 CTA (CTASection nền xanh thẫm)
 */
export const communityTemplate: Data = {
  content: [
    // 5.1 Hero: HeroImage backdrop tối, ảnh nền [MẪU]
    {
      type: 'HeroImage',
      props: {
        id: 'community-hero',
        version: 3,
        layout: 'backdrop',
        overlayTone: 'dark',
        overlayStrength: 'lg',
        imageBlur: 'none',
        imagePosition: 'center',
        contentAlign: 'center',
        minHeight: 'lg',
        seriesLabel: 'Không gian an toàn để thuộc về',
        titleLine1: 'Cộng đồng của Trạm',
        titleLine2: '',
        emotionLine:
          'Những điểm chạm nhỏ giúp bạn chăm sóc Thân - Tâm và bắt đầu ngày mới nhất quán.',
        mediaId: '',
        imageUrl: '',
        imageAlt: '',
        buttonText: '',
        buttonLink: '',
        secondaryButtonText: '',
        secondaryButtonLink: '',
        badges: [],
        stats: [],
        titleSize: 'md',
        statValueColor: 'deep-navy',
        statLabelColor: 'deep-navy',
        statValueSize: 'md',
        statLabelSize: 'md',
        bgColor: 'deep-navy',
        padding: 'lg',
        imageShape: 'rounded',
        imageBadge: '',
        imageCaptionTitle: '',
        imageCaptionSubtitle: '',
        captionPosition: 'bottom-left',
        imageCaptionAvatars: [],
      },
    },

    // 5.2 Chọn không gian: IconCardGrid dạng trượt (PK-21), vạch màu (PK-20)
    {
      type: 'IconCardGrid',
      props: {
        id: 'community-spaces',
        version: 2,
        seriesLabel: '',
        titleLine1: 'Chọn không gian của bạn',
        titleLine2: '',
        emotionLine: 'Tự nguyện đến. Tôn trọng nhịp riêng.',
        marker: 'icon',
        columns: 'carousel',
        _style: { cardAccent: 'cycle' },
        cardStyle: 'white',
        cardAlign: 'inherit',
        cards: [
          {
            type: 'Card',
            props: {
              id: 'community-space-card-0',
              icon: 'sun',
              badge: 'Cộng đồng',
              title: 'Me Time',
              text: '',
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
              id: 'community-space-card-1',
              icon: 'flower',
              badge: 'Cộng đồng',
              title: 'Yoga Buddy',
              text: '',
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
              id: 'community-space-card-2',
              icon: 'heart',
              badge: 'Coming soon',
              title: 'Không gian mới',
              text: 'Những trạm dừng mới đang được ấp ủ để đồng hành cùng bạn.',
              titleColor: 'deep-navy',
              textColor: 'deep-navy',
              titleSize: 'md',
              textSize: 'md',
              align: 'left',
              highlight: 'none',
              _style: { cardAccent: 'lavender-mist' },
            },
          },
        ],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },

    // 5.3 Me Time (anchorId: me-time): ImageText ảnh phải, nền soft-pink
    {
      type: 'ImageText',
      props: {
        id: 'me-time',
        version: 2,
        layout: 'image-right',
        seriesLabel: 'Cộng đồng',
        titleLine1: 'Me Time',
        titleLine2: '',
        quote: '"Thương mình theo cách riêng."',
        content: '',
        mediaId: '',
        imageUrl: '',
        imageAlt: '',
        imageLabel: '',
        buttonText: '',
        buttonLink: '',
        bgColor: 'soft-pink',
        padding: 'lg',
        imageShape: 'arch-right',
        imageBadge: '',
        imageCaptionTitle: '',
        imageCaptionSubtitle: '',
        captionPosition: 'bottom-left',
        imageCaptionAvatars: [],
      },
    },

    // 5.4 Lịch trình 5:00 AM: IconCardGrid 3 cột, vạch màu cycle
    {
      type: 'IconCardGrid',
      props: {
        id: 'community-me-time-schedule',
        version: 2,
        seriesLabel: '',
        titleLine1: 'Lịch trình 5:00 AM',
        titleLine2: '',
        emotionLine: '',
        marker: 'icon',
        columns: 3,
        _style: { cardAccent: 'cycle' },
        cardStyle: 'white',
        cardAlign: 'inherit',
        cards: [
          {
            type: 'Card',
            props: {
              id: 'community-schedule-card-0',
              icon: 'sun',
              title: '5:00 - 5:10 · We Time',
              text: 'Check-in đầu ngày. Cùng nghe một đoạn nhạc tĩnh tâm.',
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
              id: 'community-schedule-card-1',
              icon: 'heart',
              title: '5:10 - 5:50 · Me Time của tui',
              text: 'Làm điều mình thích. Cho mình, vì mình. Viết lách hoặc thiền định.',
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
              id: 'community-schedule-card-2',
              icon: 'spark',
              title: '5:50 - 6:00 · You & Me',
              text: 'Check-out. Cùng bốc thẻ và chọn thông điệp thương mình.',
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

    // 5.5 Tiếng nói cộng đồng Me Time: TestimonialGrid featured (PK-21), nền lavender-mist
    {
      type: 'TestimonialGrid',
      props: {
        id: 'community-testimonials-me-time',
        version: 2,
        variant: 'featured',
        mode: 'manual',
        manualTestimonials: [],
        limit: 3,
        columns: 3,
        bgColor: 'lavender-mist',
        padding: 'md',
      },
    },

    // 5.6 Khoảnh khắc Me Time: PhotoGallery mosaic (PK-21)
    {
      type: 'PhotoGallery',
      props: {
        id: 'community-me-time-moments',
        version: 1,
        seriesLabel: '',
        titleLine1: 'Khoảnh khắc Me Time',
        titleLine2: '',
        emotionLine: '',
        layout: 'mosaic',
        items: [],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },

    // 5.7 Yoga Buddy (anchorId: yoga-buddy): ImageText ảnh trái tràn mép (PK-21)
    {
      type: 'ImageText',
      props: {
        id: 'yoga-buddy',
        imageBleed: true,
        version: 2,
        layout: 'image-left',
        seriesLabel: 'Cộng đồng',
        titleLine1: 'Yoga Buddy',
        titleLine2: '',
        quote: 'Mỗi lần trải thảm là một lần chăm sóc Thân - Tâm.',
        content:
          'Duyên đã hội tụ đủ để tụi mình có mặt ở đây. Một cuộc hẹn nhỏ để trải thảm, có người cùng tập, cùng nhắc nhau dành thời gian cho bản thân giữa những bận rộn.\n\nNếu bạn từng tập rồi bỏ dở, Yoga Buddy sẽ giúp bạn dễ quay lại hơn.',
        mediaId: '',
        imageUrl: '',
        imageAlt: '',
        imageLabel: '',
        buttonText: '',
        buttonLink: '',
        bgColor: 'warm-ivory',
        padding: 'lg',
        imageShape: 'arch-left',
        imageBadge: '',
        imageCaptionTitle: '',
        imageCaptionSubtitle: '',
        captionPosition: 'bottom-left',
        imageCaptionAvatars: [],
      },
    },

    // 5.8 Cuộc hẹn 8:30 sáng thứ 3 & 5: Columns 2 Card có vạch màu, nền soft-pink
    {
      type: 'Columns',
      props: {
        id: 'community-yoga-details-cols',
        numColumns: '2',
        gap: 'md',
        bgColor: 'soft-pink',
        padding: 'md',
        col1: [
          {
            type: 'Card',
            props: {
              id: 'community-yoga-journey-card',
              version: 1,
              icon: 'sun',
              title: 'Hành trình 30 Phút',
              text: '',
              titleColor: 'deep-navy',
              textColor: 'deep-navy',
              titleSize: 'md',
              textSize: 'md',
              align: 'left',
              highlight: 'none',
              _style: { cardAccent: 'bright-magenta' },
            },
          },
        ],
        col2: [
          {
            type: 'Card',
            props: {
              id: 'community-yoga-agreements-card',
              version: 1,
              icon: 'heart',
              title: 'Vài điều giữ cho nhau',
              text: '',
              titleColor: 'deep-navy',
              textColor: 'deep-navy',
              titleSize: 'md',
              textSize: 'md',
              align: 'left',
              highlight: 'none',
              _style: { cardAccent: 'accent-pink' },
            },
          },
        ],
        col3: [],
      },
    },

    // 5.9 Góc nhỏ Yoga Buddy: PhotoGallery, ảnh [MẪU]
    {
      type: 'PhotoGallery',
      props: {
        id: 'community-yoga-gallery',
        version: 1,
        seriesLabel: '',
        titleLine1: 'Góc nhỏ Yoga Buddy',
        titleLine2: '',
        emotionLine: '',
        layout: 'grid',
        items: [],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },

    // 5.10 CTA: CTASection nền xanh thẫm (thiết kế dùng đen, ngoài brand book)
    {
      type: 'CTASection',
      props: {
        id: 'community-cta',
        version: 1,
        titleSize: 'md',
        textSize: 'md',
        seriesLabel: '',
        titleLine1: 'Trở thành một phần của bộ lạc',
        titleLine2: '',
        emotionLine: 'Nuôi dưỡng một tâm trí vững vàng từ những thói quen nhỏ nhất.',
        description: '',
        buttonText: 'Tham gia Me Time',
        buttonLinkType: 'url',
        buttonLink: '#',
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
      title: 'Cộng đồng của Trạm',
    },
  },
  zones: {},
}
