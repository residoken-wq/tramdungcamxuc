import type { Data } from '@puckeditor/core'

export const serviceTemplate: Data = {
  root: {
    props: {
      title: 'Trang dịch vụ',
    },
  },
  zones: {},
  content: [
    {
      type: 'HeroImage',
      props: {
        id: 'service-hero',
        version: 2,
        seriesLabel: '[MẪU] Dịch vụ đồng hành',
        titleLine1: '[MẪU] KHAI VẤN CẢM XÚC',
        titleLine2: '[MẪU] VỮNG VÀNG CHUYỂN MÌNH',
        emotionLine:
          '[MẪU] Đồng hành cùng bạn khám phá tiềm năng và tháo gỡ những nút thắt nội tâm.',
        mediaId: '',
        imageUrl: '',
        imageAlt: '',
        buttonText: '[MẪU] Đặt lịch tư vấn',
        buttonLink: '#booking',
        secondaryButtonText: '',
        secondaryButtonLink: '',
        badges: [],
        stats: [],
        bgColor: 'warm-ivory',
        padding: 'lg',
      },
    },
    {
      type: 'SectionHeader',
      props: {
        id: 'service-intro-header',
        version: 1,
        seriesLabel: '[MẪU] Giới thiệu dịch vụ',
        titleLine1: '[MẪU] KHÔNG GIAN AN TOÀN',
        titleLine2: '[MẪU] ĐỂ LẮNG NGHE CHÍNH MÌNH',
        emotionLine: '[MẪU] Một tiến trình cá nhân hóa dựa trên sự tôn trọng và đồng cảm sâu sắc.',
        align: 'center',
        as: 'h2',
      },
    },
    {
      type: 'RichText',
      props: {
        id: 'service-desc',
        version: 1,
        content:
          '[MẪU] Dịch vụ đồng hành được thiết kế dành cho những ai đang trải qua giai đoạn chuyển giao sự nghiệp hoặc cuộc sống.\n\n[MẪU] Thông qua các phiên trò chuyện chuyên sâu, bạn sẽ nhìn nhận rõ ràng hơn các mô thức cảm xúc và tìm ra hướng đi vững chắc.',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'JourneySteps',
      props: {
        id: 'service-journey',
        version: 2,
        variant: 'circles',
        highlightStep: 0,
        seriesLabel: '[MẪU] Tiến trình đồng hành',
        titleLine1: '[MẪU] 5 BƯỚC',
        titleLine2: '[MẪU] CHUYỂN HÓA NỘI TÂM',
        emotionLine: '[MẪU] Từng bước đi qua sự thấu cảm để tái tạo năng lượng sống.',
        step1Subtitle: '',
        step2Subtitle: '',
        step3Subtitle: '',
        step4Subtitle: '',
        step5Subtitle: '',
        step1Description:
          '[MẪU] Dừng lại quan sát và nhận diện trạng thái cảm xúc hiện tại mà không vội phán xét.',
        step2Description:
          '[MẪU] Cảm nhận trọn vẹn những rung động bên trong cơ thể và lắng nghe thông điệp cảm xúc mang lại.',
        step3Description:
          '[MẪU] Gọi tên chính xác cảm xúc và nhu cầu cốt lõi ẩn sau những phản ứng tự nhiên.',
        step4Description: '[MẪU] Lựa chọn phản hồi tích cực và xây dựng góc nhìn mới đa chiều hơn.',
        step5Description: '[MẪU] Thực hành chuyển hóa bền bỉ qua từng hành động nhỏ mỗi ngày.',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'TestimonialSlider',
      props: {
        id: 'service-testimonials',
        version: 1,
        mode: 'manual',
        manualTestimonials: [
          {
            id: 'srv-test-1',
            name: '[MẪU] Khách hàng đồng hành 1',
            role: '[MẪU] Khách hàng cá nhân',
            content:
              '[MẪU] Sau các phiên đồng hành, tôi nhận diện được những nỗi sợ vô hình và tự tin hơn.',
          },
          {
            id: 'srv-test-2',
            name: '[MẪU] Khách hàng đồng hành 2',
            role: '[MẪU] Quản lý',
            content:
              '[MẪU] Không gian lắng nghe trung tính và thấu hiểu giúp tôi tìm thấy câu trả lời của chính mình.',
          },
        ],
        limit: 4,
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'BookingCTA',
      props: {
        id: 'service-booking',
        version: 1,
        productId: '',
        title: '[MẪU] Đăng ký phiên trải nghiệm đồng hành',
        description:
          '[MẪU] Một buổi gặp gỡ để cùng nhìn lại bức tranh hiện tại và xác định mục tiêu phát triển.',
        buttonLabel: 'Đặt lịch ngay',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
  ],
}
