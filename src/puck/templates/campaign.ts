import type { Data } from '@puckeditor/core'

export const campaignTemplate: Data = {
  root: {
    props: {
      title: 'Landing chiến dịch',
    },
  },
  content: [
    {
      type: 'HeroImage',
      props: {
        id: 'campaign-hero',
        version: 2,
        seriesLabel: '[MẪU] Chiến dịch đồng hành',
        titleLine1: '[MẪU] KHỞI ĐẦU HÀNH TRÌNH',
        titleLine2: '[MẪU] CHUYỂN HÓA CẢM XÚC',
        emotionLine: '[MẪU] Dừng lại một nhịp để lắng nghe và kết nối sâu sắc hơn với chính mình.',
        mediaId: '',
        imageUrl: '',
        imageAlt: '',
        buttonText: '[MẪU] Tham gia ngay',
        buttonLink: '#lead-form',
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
        id: 'campaign-header',
        version: 1,
        seriesLabel: '[MẪU] Ý nghĩa hành trình',
        titleLine1: '[MẪU] ĐỒNG HÀNH CHUYỂN HÓA',
        titleLine2: '[MẪU] NUÔI DƯỠNG SỰ BÌNH AN',
        emotionLine: '[MẪU] Mỗi bước đi là một cơ hội để bạn quay về với bình an bên trong.',
        align: 'center',
        as: 'h2',
      },
    },
    {
      type: 'ImageText',
      props: {
        id: 'campaign-story',
        version: 2,
        layout: 'image-left',
        seriesLabel: '[MẪU] Câu chuyện',
        titleLine1: '[MẪU] BƯỚC ĐẦU TIÊN',
        titleLine2: '[MẪU] NHẬN BIẾT CẢM XÚC',
        content:
          '[MẪU] Khi đối diện với những áp lực thường nhật, chúng ta thường quên mất việc dừng lại để thở và cảm nhận.\n\n[MẪU] Hành trình này giúp bạn nhận diện những lớp cảm xúc đang diễn ra mà không phán xét.',
        quote: '',
        mediaId: '',
        imageUrl: '',
        imageAlt: '',
        imageLabel: '',
        buttonText: '[MẪU] Khám phá chi tiết',
        buttonLink: '#',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'TestimonialGrid',
      props: {
        id: 'campaign-testimonials',
        version: 2,
        variant: 'quote',
        mode: 'manual',
        manualTestimonials: [
          {
            id: 'test-1',
            name: '[MẪU] Người tham gia 1',
            role: '[MẪU] Học viên',
            content:
              '[MẪU] Trải nghiệm đã giúp tôi có góc nhìn nhẹ nhàng và tích cực hơn về những xáo trộn bên trong.',
          },
          {
            id: 'test-2',
            name: '[MẪU] Người tham gia 2',
            role: '[MẪU] Học viên',
            content: '[MẪU] Một không gian an toàn để được là chính mình và thấu hiểu cảm xúc.',
          },
          {
            id: 'test-3',
            name: '[MẪU] Người tham gia 3',
            role: '[MẪU] Học viên',
            content: '[MẪU] Những bài thực hành đơn giản nhưng mang lại sự chuyển hóa bất ngờ.',
          },
        ],
        limit: 6,
        columns: 3,
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'FAQ',
      props: {
        id: 'campaign-faq',
        version: 2,
        seriesLabel: '[MẪU] Giải đáp',
        titleLine1: '[MẪU] CÂU HỎI',
        titleLine2: '[MẪU] THƯỜNG GẶP',
        source: 'manual',
        items: [
          {
            question: '[MẪU] Hành trình này phù hợp với ai?',
            answer:
              '[MẪU] Chương trình dành cho bất kỳ ai đang muốn tìm lại sự cân bằng và làm chủ cảm xúc của mình.',
          },
          {
            question: '[MẪU] Tôi cần chuẩn bị những gì?',
            answer:
              '[MẪU] Bạn chỉ cần chuẩn bị một tâm thế cởi mở và sẵn sàng dành 10-15 phút mỗi ngày.',
          },
        ],
        numbered: false,
        aside: 'none',
        bookingAsideTitle: '',
        bookingAsideDescription: '',
        bookingButtonText: '',
        bookingButtonLink: '',
        showEmail: false,
        seeAllLink: '',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'LeadForm',
      props: {
        id: 'campaign-lead-form',
        version: 1,
        title: '[MẪU] Đăng ký nhận thông tin chiến dịch',
        description: '[MẪU] Để lại email để nhận tài nguyên và cập nhật mới nhất từ chương trình.',
        resourceProductId: '',
        need: 'resource',
        interestTags: 'campaign',
        submitLabel: 'Đăng ký ngay',
      },
    },
  ],
}
