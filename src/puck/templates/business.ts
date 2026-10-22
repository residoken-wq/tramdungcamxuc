import type { Data } from '@puckeditor/core'

/**
 * Mẫu trang Doanh nghiệp (Sitemap v2) – template: 'business'
 * Cấu trúc: HeroImage → IconCardGrid (vấn đề tổ chức) → SolutionEcosystem → LogoStrip → TestimonialGrid → B2BBriefForm
 */
export const businessTemplate: Data = {
  content: [
    {
      type: 'HeroImage',
      props: {
        id: 'business-hero',
        version: 2,
        seriesLabel: '[MẪU] DÀNH CHO DOANH NGHIỆP & TỔ CHỨC',
        titleLine1: '[MẪU] NÂNG TẦM NĂNG LỰC CẢM XÚC',
        titleLine2: '[MẪU] VÀ GẮN KẾT ĐỘI NGŨ',
        emotionLine:
          '[MẪU] Giải pháp đào tạo và khai vấn giúp doanh nghiệp phát triển bền vững từ nội lực con người.',
        mediaId: '',
        imageUrl: '',
        imageAlt: '',
        buttonText: '[MẪU] Liên hệ tư vấn',
        buttonLink: '/lien-he',
        secondaryButtonText: '',
        secondaryButtonLink: '',
        badges: [{ text: '[MẪU] An toàn tâm lý' }, { text: '[MẪU] Chuyển hóa bền vững' }],
        stats: [],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'IconCardGrid',
      props: {
        id: 'business-challenges',
        version: 2,
        seriesLabel: '[MẪU] THÁCH THỨC TỔ CHỨC',
        titleLine1: '[MẪU] NHỮNG ĐIỂM NGHẼN NỘI TÂM',
        titleLine2: '[MẪU] TRONG MÔI TRƯỜNG LÀM VIỆC',
        emotionLine:
          '[MẪU] Nhận diện để cùng nhau kiến tạo môi trường làm việc thấu cảm và vững vàng.',
        marker: 'icon',
        columns: 3,
        cardStyle: 'white',
        cards: [
          {
            type: 'Card',
            props: {
              id: 'business-challenges-card-0',
              icon: 'target',
              title: '[MẪU] Áp lực & Kiệt sức',
              text: '[MẪU] Nhân sự đối mặt với khối lượng công việc lớn và căng thẳng kéo dài nhưng thiếu cơ chế xả stress lành mạnh.',
              titleColor: 'deep-navy',
              textColor: 'deep-navy',
              titleSize: 'md',
              textSize: 'md',
              align: 'left',
            },
          },
          {
            type: 'Card',
            props: {
              id: 'business-challenges-card-1',
              icon: 'layers',
              title: '[MẪU] Thiếu kết nối thấu cảm',
              text: '[MẪU] Giao tiếp nội bộ gặp rào cản, các phòng ban làm việc theo kiểu ốc đảo và thiếu sự thấu hiểu chia sẻ.',
              titleColor: 'deep-navy',
              textColor: 'deep-navy',
              titleSize: 'md',
              textSize: 'md',
              align: 'left',
            },
          },
          {
            type: 'Card',
            props: {
              id: 'business-challenges-card-2',
              icon: 'spark',
              title: '[MẪU] Ngại thay đổi & Trì hoãn',
              text: '[MẪU] Đội ngũ chùn bước trước mục tiêu mới do tâm lý e ngại sai lầm hoặc chưa tìm thấy động lực tự thân.',
              titleColor: 'deep-navy',
              textColor: 'deep-navy',
              titleSize: 'md',
              textSize: 'md',
              align: 'left',
            },
          },
        ],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'SolutionEcosystem',
      props: {
        id: 'business-ecosystem',
        version: 1,
        seriesLabel: '[MẪU] HỆ SINH THÁI GIẢI PHÁP',
        titleLine1: '[MẪU] ĐỒNG HÀNH TOÀN DIỆN',
        titleLine2: '[MẪU] CÙNG TỔ CHỨC CỦA BẠN',
        emotionLine:
          '[MẪU] Thiết kế linh hoạt theo bối cảnh văn hóa và mục tiêu cụ thể của từng doanh nghiệp.',
        description:
          '[MẪU] Kết hợp giữa khoa học thói quen, trí tuệ cảm xúc và phương pháp khai vấn chuẩn quốc tế.',
        col1Title: '[MẪU] Đào tạo & Workshop',
        col1Description:
          '[MẪU] Các chuyên đề thực hành EQ và chuyển hóa thói quen làm việc hiệu quả.',
        col1Products: [],
        col2Title: '[MẪU] Khai vấn lãnh đạo & nhóm',
        col2Description: '[MẪU] Đồng hành nâng cao năng lực thấu cảm và phản tỉnh cho cấp quản lý.',
        col2Services: [],
        col3Title: '[MẪU] Chương trình chuyển đổi',
        col3Description:
          '[MẪU] Lộ trình dài hạn xây dựng văn hóa an toàn tâm lý và gắn kết bền chặt.',
        col3Programs: [],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'LogoStrip',
      props: {
        id: 'business-logos',
        version: 2,
        title: '[MẪU] ĐƯỢC ĐỒNG HÀNH VÀ TIN TƯỞNG BỞI',
        groups: [],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'TestimonialGrid',
      props: {
        id: 'business-testimonials',
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
    {
      type: 'B2BBriefForm',
      props: {
        id: 'business-brief',
        version: 1,
        title: '[MẪU] Gửi brief đào tạo & đồng hành doanh nghiệp',
        description:
          '[MẪU] Chia sẻ nhu cầu và bối cảnh đội ngũ của bạn để Trạm Dừng Cảm Xúc thiết kế giải pháp phù hợp nhất.',
        submitLabel: 'Gửi brief yêu cầu',
      },
    },
  ],
  root: {
    props: {
      title: '[MẪU] Trang Doanh nghiệp',
    },
  },
  zones: {},
}
