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
        buttonText: 'Khám phá các không gian',
        buttonLink: '#me-time',
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
    // PK-21: đổi sang IconCardGrid dạng trượt khi PK-21 merge
    {
      type: 'IconCardGrid',
      props: {
        id: 'community-spaces',
        version: 2,
        seriesLabel: 'Không gian cộng đồng',
        titleLine1: 'Chọn không gian của bạn',
        titleLine2: '',
        emotionLine: 'Tự nguyện đến. Tôn trọng nhịp riêng.',
        marker: 'icon',
        columns: 3,
        cardAccent: 'cycle',
        cardFrame: 'solid',
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
              text: '"Thương mình theo cách riêng"\n\nKhởi đầu ngày mới lúc 5:00 AM mỗi ngày.\n\nKhám phá: #me-time',
              titleColor: 'deep-navy',
              textColor: 'deep-navy',
              titleSize: 'md',
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
              id: 'community-space-card-1',
              icon: 'flower',
              badge: 'Cộng đồng',
              title: 'Yoga Buddy',
              text: 'Chăm sóc thân tâm thông qua yoga\n\nTrải thảm 8:30 AM Thứ 3 & Thứ 5.\n\nKhám phá: #yoga-buddy',
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
              cardAccent: 'lavender-mist',
              cardFrame: 'solid',
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
        content:
          'Tôn Chỉ "Me" First: Chưa đủ sẵn sàng thì không cần bắt mình vào link. Tự do rời đi khi cần.\n\nYou Always Can Miss ONE: Cho phép mình làm biếng 1 ngày. Mai chúng mình sẽ lại ở đây.',
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
        seriesLabel: 'Khung giờ',
        titleLine1: 'Lịch trình 5:00 AM',
        titleLine2: '',
        emotionLine: 'Bắt đầu ngày mới nhẹ nhàng cùng những thói quen nuôi dưỡng tâm trí.',
        marker: 'icon',
        columns: 3,
        cardAccent: 'cycle',
        cardFrame: 'solid',
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
              cardAccent: 'bright-magenta',
              cardFrame: 'solid',
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
              cardAccent: 'accent-pink',
              cardFrame: 'solid',
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
              cardAccent: 'deep-navy',
              cardFrame: 'solid',
            },
          },
        ],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },

    // 5.5 Tiếng nói cộng đồng Me Time: TestimonialGrid featured (PK-21), nền lavender-mist
    // PK-21: đổi sang TestimonialGrid featured khi PK-21 merge
    {
      type: 'TestimonialGrid',
      props: {
        id: 'community-testimonials-me-time',
        version: 2,
        variant: 'quote',
        mode: 'manual',
        manualTestimonials: [],
        limit: 3,
        columns: 3,
        bgColor: 'lavender-mist',
        padding: 'md',
      },
    },

    // 5.6 Khoảnh khắc Me Time: PhotoGallery mosaic (PK-21)
    // PK-21: đổi sang PhotoGallery mosaic khi PK-21 merge
    {
      type: 'IconCardGrid',
      props: {
        id: 'community-me-time-moments',
        version: 2,
        seriesLabel: 'Góc nhìn thực tế',
        titleLine1: 'Khoảnh khắc Me Time',
        titleLine2: '',
        emotionLine: '[MẪU] Những khoảnh khắc kết nối và tĩnh lặng đầu ngày cùng cộng đồng.',
        marker: 'icon',
        columns: 3,
        cardAccent: 'none',
        cardFrame: 'solid',
        cardStyle: 'white',
        cardAlign: 'inherit',
        cards: [
          {
            type: 'Card',
            props: {
              id: 'community-moment-card-0',
              icon: 'camera',
              title: '[MẪU] Không gian tĩnh lặng',
              text: '[MẪU] Khoảnh khắc các thành viên cùng ngồi tĩnh tâm trước khi bắt đầu ngày mới.',
              titleColor: 'deep-navy',
              textColor: 'deep-navy',
              titleSize: 'md',
              textSize: 'md',
              align: 'left',
              highlight: 'none',
              cardAccent: 'none',
              cardFrame: 'solid',
            },
          },
          {
            type: 'Card',
            props: {
              id: 'community-moment-card-1',
              icon: 'pencil',
              title: '[MẪU] Trang viết đầu ngày',
              text: '[MẪU] Những dòng suy ngẫm chân thật và giải tỏa cảm xúc trên trang giấy.',
              titleColor: 'deep-navy',
              textColor: 'deep-navy',
              titleSize: 'md',
              textSize: 'md',
              align: 'left',
              highlight: 'none',
              cardAccent: 'none',
              cardFrame: 'solid',
            },
          },
          {
            type: 'Card',
            props: {
              id: 'community-moment-card-2',
              icon: 'heart',
              title: '[MẪU] Thông điệp thương mình',
              text: '[MẪU] Lá thẻ EQ Buddy được rút vào cuối phiên kết nối truyền cảm hứng tích cực.',
              titleColor: 'deep-navy',
              textColor: 'deep-navy',
              titleSize: 'md',
              textSize: 'md',
              align: 'left',
              highlight: 'none',
              cardAccent: 'none',
              cardFrame: 'solid',
            },
          },
        ],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },

    // 5.7 Yoga Buddy (anchorId: yoga-buddy): ImageText ảnh trái tràn mép (PK-21)
    // PK-21: đổi sang ImageText imageBleed ảnh trái khi PK-21 merge
    {
      type: 'ImageText',
      props: {
        id: 'yoga-buddy',
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
        version: 1,
        numColumns: '2',
        gap: 'md',
        bgColor: 'soft-pink',
        padding: 'md',
      },
    },

    // 5.9 Góc nhỏ Yoga Buddy: PhotoGallery, ảnh [MẪU]
    // PK-21: đổi sang PhotoGallery khi PK-21 merge
    {
      type: 'IconCardGrid',
      props: {
        id: 'community-yoga-gallery',
        version: 2,
        seriesLabel: 'Góc nhìn thực tế',
        titleLine1: 'Góc nhỏ Yoga Buddy',
        titleLine2: '',
        emotionLine: '[MẪU] Những khoảnh khắc trải thảm và chăm sóc thân tâm.',
        marker: 'icon',
        columns: 3,
        cardAccent: 'none',
        cardFrame: 'solid',
        cardStyle: 'white',
        cardAlign: 'inherit',
        cards: [
          {
            type: 'Card',
            props: {
              id: 'community-yoga-gallery-card-0',
              icon: 'sun',
              title: '[MẪU] Thảm tập sẵn sàng',
              text: '[MẪU] Không gian thực hành gọn gàng, ấm cúng của các thành viên trước giờ tập.',
              titleColor: 'deep-navy',
              textColor: 'deep-navy',
              titleSize: 'md',
              textSize: 'md',
              align: 'left',
              highlight: 'none',
              cardAccent: 'none',
              cardFrame: 'solid',
            },
          },
          {
            type: 'Card',
            props: {
              id: 'community-yoga-gallery-card-1',
              icon: 'flower',
              title: '[MẪU] Chuỗi Chào Mặt Trời',
              text: '[MẪU] Cùng chuyển động nhịp nhàng theo hơi thở và lắng nghe giới hạn cơ thể.',
              titleColor: 'deep-navy',
              textColor: 'deep-navy',
              titleSize: 'md',
              textSize: 'md',
              align: 'left',
              highlight: 'none',
              cardAccent: 'none',
              cardFrame: 'solid',
            },
          },
          {
            type: 'Card',
            props: {
              id: 'community-yoga-gallery-card-2',
              icon: 'heart',
              title: '[MẪU] Nụ cười sau buổi tập',
              text: '[MẪU] Năng lượng tươi mới và sự an yên lan tỏa sau 30 phút rèn luyện.',
              titleColor: 'deep-navy',
              textColor: 'deep-navy',
              titleSize: 'md',
              textSize: 'md',
              align: 'left',
              highlight: 'none',
              cardAccent: 'none',
              cardFrame: 'solid',
            },
          },
        ],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },

    // 5.10 CTA: CTASection nền xanh thẫm (thiết kế dùng đen, ngoài brand book)
    // PK-21: thêm nút Tham gia Yoga Buddy khi PK-21 merge
    {
      type: 'CTASection',
      props: {
        id: 'community-cta',
        version: 1,
        titleSize: 'md',
        textSize: 'md',
        seriesLabel: 'Gia nhập cộng đồng',
        titleLine1: 'Trở thành một phần của bộ lạc',
        titleLine2: '',
        emotionLine: 'Nuôi dưỡng một tâm trí vững vàng từ những thói quen nhỏ nhất.',
        description:
          'Những điểm chạm nhỏ mỗi ngày để bạn thương mình đúng cách và cùng lớn lên trong bình an.',
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
  zones: {
    'community-yoga-details-cols:column-1': [
      {
        type: 'Card',
        props: {
          id: 'community-yoga-journey-card',
          version: 1,
          icon: 'sun',
          title: 'Hành trình 30 Phút',
          text: '05 phút kết nối: Ngồi thoải mái, nghe nhạc, cảm nhận cơ thể và năng lượng sáng nay.\n\n20 phút chuyển động: Khởi động nhẹ. Tập 6 vòng Chào Mặt Trời. Thư giãn cùng sự hướng dẫn.\n\n05 phút lắng nghe: Check-in cảm xúc. Bốc một thẻ thông điệp gửi vào ngày mới.',
          titleColor: 'deep-navy',
          textColor: 'deep-navy',
          titleSize: 'md',
          textSize: 'md',
          align: 'left',
          highlight: 'none',
          cardAccent: 'bright-magenta',
          cardFrame: 'solid',
        },
      },
    ],
    'community-yoga-details-cols:column-2': [
      {
        type: 'Card',
        props: {
          id: 'community-yoga-agreements-card',
          version: 1,
          icon: 'heart',
          title: 'Vài điều giữ cho nhau',
          text: 'Tôn trọng nhịp riêng: Tập chậm hơn, giảm số vòng hoặc nghỉ giữa chừng. Tập theo trạng thái hôm ấy.\n\nLỡ một buổi, hẹn buổi sau: Không áy náy hay tập bù. Điểm đến là nuôi dưỡng cơ thể và thói quen.\n\nTrân trọng cuộc hẹn: Cố gắng đúng giờ. Chuẩn bị sẵn thảm. Tắt micro khi cùng tập.',
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
    ],
  },
}
