import type { Data } from '@puckeditor/core'

export const workshopTemplate: Data = {
  root: {
    props: {
      title: 'Trang workshop',
    },
  },
  content: [
    {
      type: 'HeroImage',
      props: {
        id: 'workshop-hero',
        version: 1,
        seriesLabel: '[MẪU] Workshop chuyên đề',
        titleLine1: '[MẪU] TẬP THƯƠNG CẢM XÚC',
        titleLine2: '[MẪU] HÀNH TRÌNH CHỮA LÀNH',
        emotionLine: '[MẪU] Một buổi gặp gỡ ấm áp để học cách bao dung và thấu hiểu bản thân.',
        mediaId: '',
        imageUrl: '',
        imageAlt: '',
        buttonText: '[MẪU] Đăng ký tham gia',
        buttonLink: '#register',
        bgColor: 'warm-ivory',
        padding: 'lg',
      },
    },
    {
      type: 'SectionHeader',
      props: {
        id: 'workshop-content-header',
        version: 1,
        seriesLabel: '[MẪU] Nội dung buổi học',
        titleLine1: '[MẪU] ĐIỂM CHẠM SÂU SẮC',
        titleLine2: '[MẪU] THỰC HÀNH CÙNG NHAU',
        emotionLine:
          '[MẪU] Kết hợp giữa lý thuyết tâm lý thực hành và các bài tập chánh niệm ứng dụng.',
        align: 'center',
        as: 'h2',
      },
    },
    {
      type: 'RichText',
      props: {
        id: 'workshop-rich-text',
        version: 1,
        content:
          '[MẪU] Workshop là không gian nhóm nhỏ ấm cúng, nơi bạn được chia sẻ mà không sợ bị phán xét.\n\n[MẪU] Bạn sẽ được trang bị những công cụ cụ thể để tự điều hòa cảm xúc trong những tình huống áp lực cao.',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'StatsBar',
      props: {
        id: 'workshop-stats',
        version: 1,
        stats: [
          { value: '[MẪU] 2,5 giờ', label: '[MẪU] Thời lượng chuyên sâu' },
          { value: '[MẪU] 12 người', label: '[MẪU] Giới hạn nhóm nhỏ' },
          { value: '[MẪU] 100%', label: '[MẪU] Thực hành trải nghiệm' },
        ],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'TestimonialSlider',
      props: {
        id: 'workshop-testimonials',
        version: 1,
        mode: 'manual',
        manualTestimonials: [
          {
            id: 'ws-test-1',
            name: '[MẪU] Học viên workshop 1',
            role: '[MẪU] Người tham dự',
            content:
              '[MẪU] Buổi workshop mang lại cho tôi cảm giác nhẹ nhõm và sự nâng đỡ tinh thần rất lớn.',
          },
        ],
        limit: 4,
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'FAQ',
      props: {
        id: 'workshop-faq',
        version: 1,
        seriesLabel: '[MẪU] Thắc mắc',
        titleLine1: '[MẪU] THÔNG TIN',
        titleLine2: '[MẪU] BUỔI WORKSHOP',
        items: [
          {
            question: '[MẪU] Hình thức tham gia như thế nào?',
            answer:
              '[MẪU] Workshop diễn ra trực tuyến qua Zoom hoặc trực tiếp tùy theo thông báo của từng đợt.',
          },
        ],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'LeadForm',
      props: {
        id: 'workshop-lead-form',
        version: 1,
        title: '[MẪU] Đăng ký giữ chỗ workshop',
        description: '[MẪU] Vui lòng để lại thông tin để ban tổ chức gửi thông tin tham dự.',
        resourceProductId: '',
        need: 'resource',
        interestTags: 'workshop',
        submitLabel: 'Gửi đăng ký',
      },
    },
  ],
}
