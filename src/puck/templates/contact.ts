import type { Data } from '@puckeditor/core'

export const contactTemplate: Data = {
  root: {
    props: {
      title: 'Trang Liên hệ',
    },
  },
  zones: {},
  content: [
    {
      type: 'HeroImage',
      props: {
        id: 'contact-hero',
        version: 2,
        seriesLabel: '[MẪU] Kết nối cùng Trạm',
        titleLine1: '[MẪU] CHÚNG TÔI LUÔN Ở ĐÂY',
        titleLine2: '[MẪU] ĐỂ LẮNG NGHE BẠN',
        emotionLine:
          '[MẪU] Dù bạn có bất kỳ câu hỏi nào hay cần một không gian trò chuyện, Trạm luôn sẵn sàng hồi đáp.',
        mediaId: '',
        imageUrl: '',
        imageAlt: '',
        buttonText: '',
        buttonLink: '',
        secondaryButtonText: '',
        secondaryButtonLink: '',
        badges: [{ text: '[MẪU] Phản hồi trong 24h' }, { text: '[MẪU] Tư vấn tận tâm' }],
        stats: [],
        bgColor: 'warm-ivory',
        padding: 'lg',
      },
    },
    {
      type: 'IconCardGrid',
      props: {
        id: 'contact-highlights',
        version: 1,
        seriesLabel: '[MẪU] Cam kết từ Trạm',
        titleLine1: '[MẪU] SỰ ĐỒNG HÀNH',
        titleLine2: '[MẪU] CHU ĐÁO & BẢO MẬT',
        emotionLine: '[MẪU] Những giá trị mang lại sự an tâm tuyệt đối khi bạn kết nối.',
        marker: 'icon',
        columns: 2,
        cardStyle: 'white',
        items: [
          {
            icon: 'heart',
            title: '[MẪU] Bảo mật tuyệt đối',
            text: '[MẪU] Mọi thông tin chia sẻ và câu chuyện cá nhân đều được giữ kín theo quy chuẩn đạo đức nghề nghiệp.',
          },
          {
            icon: 'spark',
            title: '[MẪU] Phản hồi nhanh chóng',
            text: '[MẪU] Đội ngũ Trạm sẽ liên hệ lại qua email hoặc số điện thoại trong vòng 24 giờ làm việc.',
          },
        ],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'ContactInfo',
      props: {
        id: 'contact-info',
        version: 1,
        seriesLabel: '[MẪU] THÔNG TIN LIÊN HỆ',
        titleLine1: '[MẪU] CÁC KÊNH KẾT NỐI',
        titleLine2: '[MẪU] TRỰC TIẾP CÙNG TRẠM',
        emotionLine:
          '[MẪU] Mọi chia sẻ của bạn đều được đón nhận bằng sự thấu cảm, tôn trọng và trọn vẹn yêu thương.',
        showEmail: true,
        showHotline: true,
        showOfficeAddress: true,
        showSocial: true,
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'ContactForms',
      props: {
        id: 'contact-forms',
        version: 1,
        layout: 'columns',
        titleB2C: '[MẪU] Dành cho Cá nhân',
        descriptionB2C:
          '[MẪU] Đăng ký tư vấn 1:1 hoặc gửi những trăn trở của bạn về hành trình cảm xúc và thói quen.',
        submitLabelB2C: 'Gửi yêu cầu cá nhân',
        successTitleB2C: '[MẪU] Cảm ơn bạn đã kết nối!',
        successMessageB2C:
          '[MẪU] Trạm đã nhận được thông tin và sẽ phản hồi qua email hoặc số điện thoại trong vòng 24 giờ làm việc.',
        titleB2B: '[MẪU] Dành cho Doanh nghiệp',
        descriptionB2B:
          '[MẪU] Cùng Trạm kiến tạo chương trình đào tạo và giải pháp chăm sóc sức khỏe tinh thần cho đội ngũ.',
        submitLabelB2B: 'Gửi yêu cầu doanh nghiệp',
        successTitleB2B: '[MẪU] Cảm ơn bạn đã kết nối!',
        successMessageB2B:
          '[MẪU] Cảm ơn quý doanh nghiệp đã gửi yêu cầu. Đội ngũ Trạm Dừng Cảm Xúc sẽ liên hệ lại trong thời gian sớm nhất.',
        bgColor: 'warm-ivory',
        padding: 'lg',
      },
    },
    {
      type: 'FAQ',
      props: {
        id: 'contact-faq',
        version: 3,
        source: 'group',
        group: 'general',
        limit: 5,
        seriesLabel: '[MẪU] Câu hỏi thường gặp',
        titleLine1: '[MẪU] GIẢI ĐÁP NHANH',
        titleLine2: '[MẪU] THẮC MẮC PHỔ BIẾN',
        numbered: false,
        aside: 'booking',
        bookingAsideTitle: '[MẪU] Cần hỗ trợ trực tiếp?',
        bookingAsideDescription:
          '[MẪU] Bạn có thể gửi email hoặc nhắn tin trực tiếp qua các kênh liên hệ của Trạm.',
        bookingButtonText: 'Đặt lịch tư vấn',
        bookingButtonLink: '/lien-he',
        showEmail: false,
        seeAllLink: '/cau-hoi-thuong-gap',
        items: [],
        bgColor: 'warm-ivory',
        padding: 'lg',
      },
    },
  ],
}
