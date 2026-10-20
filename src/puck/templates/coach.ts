import type { Data } from '@puckeditor/core'

export const coachTemplate: Data = {
  root: {
    props: {
      title: 'Trang Coach 1:1',
    },
  },
  zones: {},
  content: [
    {
      type: 'HeroImage',
      props: {
        id: 'coach-hero',
        version: 2,
        seriesLabel: '[MẪU] Khai vấn chuyên sâu 1:1',
        titleLine1: '[MẪU] TẤM GƯƠNG PHẢN CHIẾU',
        titleLine2: '[MẪU] NỘI LỰC VÀ BẢN LĨNH',
        emotionLine:
          '[MẪU] Không gian an toàn tuyệt đối để bạn soi tỏ tâm trí và tìm ra lời giải cho chính mình.',
        mediaId: '',
        imageUrl: '',
        imageAlt: '',
        buttonText: 'Đặt phiên trải nghiệm',
        buttonLink: '/dat-phien-trai-nghiem',
        secondaryButtonText: '',
        secondaryButtonLink: '',
        badges: [{ text: '[MẪU] Huy hiệu 1' }, { text: '[MẪU] Huy hiệu 2' }],
        stats: [
          { value: '[MẪU] Số liệu 1', label: '[MẪU] Giờ khai vấn' },
          { value: '[MẪU] 1:1', label: '[MẪU] Cá nhân hóa' },
        ],
        bgColor: 'warm-ivory',
        padding: 'lg',
      },
    },
    {
      type: 'IconCardGrid',
      props: {
        id: 'coach-situations',
        version: 1,
        seriesLabel: '[MẪU] Khi nào bạn cần khai vấn?',
        titleLine1: '[MẪU] BỐN TÌNH HUỐNG',
        titleLine2: '[MẪU] CẦN MỘT TẤM GƯƠNG SOI CHIẾU',
        emotionLine:
          '[MẪU] Khai vấn 1:1 là giải pháp lý tưởng khi bạn đứng trước những nút thắt quan trọng trong sự nghiệp.',
        marker: 'icon',
        columns: 4,
        cardStyle: 'white',
        items: [
          {
            icon: 'compass',
            title: '[MẪU] Bước chuyển sự nghiệp',
            text: '[MẪU] Đứng trước cơ hội thăng tiến hoặc muốn chuyển đổi lĩnh vực mà chưa rõ định hướng.',
          },
          {
            icon: 'spark',
            title: '[MẪU] Mất cân bằng nội tại',
            text: '[MẪU] Căng thẳng kéo dài giữa áp lực công việc và nhu cầu được sống bình an.',
          },
          {
            icon: 'layers',
            title: '[MẪU] Thách thức lãnh đạo',
            text: '[MẪU] Cần nâng cao năng lực thấu cảm, gắn kết và truyền cảm hứng cho đội ngũ.',
          },
          {
            icon: 'target',
            title: '[MẪU] Hoài nghi thế mạnh',
            text: '[MẪU] Thiếu sự tự tin vào năng lực bản thân để đưa ra những quyết định đột phá.',
          },
        ],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'ServiceCards',
      props: {
        id: 'coach-services',
        version: 1,
        seriesLabel: '[MẪU] DỊCH VỤ ĐỒNG HÀNH',
        titleLine1: '[MẪU] CÁC LỘ TRÌNH',
        titleLine2: '[MẪU] COACHING 1:1',
        emotionLine: '[MẪU] Lắng nghe chính mình, kiến tạo chuyển hóa bền vững từ bên trong.',
        services: [],
        highlightServiceId: '',
        bgColor: 'warm-ivory',
        padding: 'lg',
      },
    },
    {
      type: 'IconCardGrid',
      props: {
        id: 'coach-process-details',
        version: 1,
        seriesLabel: '[MẪU] Bên trong một phiên 1:1',
        titleLine1: '[MẪU] ĐIỀU GÌ DIỄN RA',
        titleLine2: '[MẪU] TRONG PHIÊN KHAI VẤN?',
        emotionLine: '[MẪU] Một không gian tôn trọng, không phán xét và hoàn toàn bảo mật.',
        marker: 'number',
        columns: 3,
        cardStyle: 'white',
        items: [
          {
            icon: 'target',
            title: '[MẪU] Lắng nghe & Khơi mở',
            text: '[MẪU] Đặt những câu hỏi sắc bén kích hoạt tư duy, giúp bạn nhìn nhận đa chiều bức tranh hiện tại.',
          },
          {
            icon: 'layers',
            title: '[MẪU] Tháo gỡ nút thắt',
            text: '[MẪU] Soi chiếu các rào cản cảm xúc, nhận diện niềm tin giới hạn và tìm lại sự thông suốt.',
          },
          {
            icon: 'spark',
            title: '[MẪU] Thiết kế hành động',
            text: '[MẪU] Cùng nhau xây dựng kế hoạch hành động cụ thể, đo lường được và cam kết thực hiện bền bỉ.',
          },
        ],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'ImageText',
      props: {
        id: 'coach-experience-story',
        version: 2,
        layout: 'image-right',
        seriesLabel: '[MẪU] Không gian khai vấn',
        titleLine1: '[MẪU] MỘT ĐIỂM TỰA VỮNG CHÃI',
        titleLine2: '[MẪU] ĐỂ BẠN DÁM THỬ NGHIỆM',
        content:
          '[MẪU] Khai vấn không phải là việc người khác cho bạn lời khuyên, mà là tiến trình đồng hành giúp bạn tự tìm ra câu trả lời từ chính bên trong mình.\n\n[MẪU] Với sự lắng nghe thuần khiết và những câu hỏi sắc bén, bạn sẽ nhìn thấy những góc nhìn mà trước đây mình chưa từng chạm tới.',
        quote:
          '[MẪU] Khi tâm trí được tỏ tường, mọi hành động tiếp theo đều trở nên nhẹ nhàng và chính xác.',
        mediaId: '',
        imageUrl: '',
        imageAlt: '',
        imageLabel: '[MẪU] Không gian an toàn',
        buttonText: 'Đặt phiên trải nghiệm',
        buttonLink: '/dat-phien-trai-nghiem',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'TestimonialGrid',
      props: {
        id: 'coach-testimonials',
        version: 2,
        variant: 'three-stage',
        mode: 'manual',
        manualTestimonials: [],
        limit: 3,
        columns: 3,
        bgColor: 'warm-ivory',
        padding: 'lg',
      },
    },
    {
      type: 'IconCardGrid',
      props: {
        id: 'coach-steps',
        version: 1,
        seriesLabel: '[MẪU] Quy trình đồng hành',
        titleLine1: '[MẪU] TIẾN TRÌNH KHAI VẤN',
        titleLine2: '[MẪU] QUA TỪNG PHIÊN ĐỒNG HÀNH',
        emotionLine:
          '[MẪU] Tiến trình rõ ràng giúp bạn chủ động đo lường sự tiến bộ và chuyển hóa của bản thân.',
        marker: 'number',
        columns: 1,
        cardStyle: 'white',
        items: [
          {
            icon: 'target',
            title: '[MẪU] Phiên trải nghiệm & Xác lập mục tiêu',
            text: '[MẪU] Làm quen với phong cách khai vấn, làm rõ mong muốn và thống nhất kỳ vọng đồng hành.',
          },
          {
            icon: 'compass',
            title: '[MẪU] Đánh giá hiện trạng & Gọi tên cảm xúc',
            text: '[MẪU] Soi chiếu các mô thức tư duy, thói quen và những điểm nghẽn cảm xúc đang chi phối hành động.',
          },
          {
            icon: 'spark',
            title: '[MẪU] Khơi mở giải pháp & Mở rộng góc nhìn',
            text: '[MẪU] Vượt qua các vùng an toàn cũ, khám phá các lựa chọn tiềm năng và kích hoạt nội lực mạnh mẽ.',
          },
          {
            icon: 'layers',
            title: '[MẪU] Kế hoạch hành động & Thử nghiệm thực tế',
            text: '[MẪU] Đưa giải pháp vào đời sống thực tế thông qua các thói quen nhỏ và cam kết thực thi hàng ngày.',
          },
          {
            icon: 'heart',
            title: '[MẪU] Đúc kết chuyển hóa & Tự chủ bước tiếp',
            text: '[MẪU] Nhìn lại chặng đường chuyển mình, củng cố sự tự tin và tiếp tục hành trình với nội lực vững vàng.',
          },
        ],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'BookingCTA',
      props: {
        id: 'coach-booking',
        version: 1,
        productId: '',
        title: '[MẪU] Bắt đầu bằng một phiên trải nghiệm',
        description:
          '[MẪU] Trải nghiệm 45 phút khai vấn 1:1 để cùng người đồng hành nhìn rõ bức tranh cảm xúc và thế mạnh của bạn.',
        buttonLabel: 'Đặt phiên trải nghiệm',
        bgColor: 'soft-pink',
        padding: 'lg',
      },
    },
  ],
}
