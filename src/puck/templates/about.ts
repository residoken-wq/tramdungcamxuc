import type { Data } from '@puckeditor/core'

export const aboutTemplate: Data = {
  root: {
    props: {
      title: 'Trang Về Trạm',
    },
  },
  content: [
    {
      type: 'HeroImage',
      props: {
        id: 'about-hero',
        version: 2,
        seriesLabel: '[MẪU] Về Trạm Dừng Cảm Xúc',
        titleLine1: '[MẪU] NƠI DỪNG LẠI ĐỂ',
        titleLine2: '[MẪU] LẮNG NGHE & TÁI TẠO',
        emotionLine:
          '[MẪU] Điểm tựa thấu cảm kết hợp phương pháp khoa học giúp bạn vững vàng từ nội tâm.',
        mediaId: '',
        imageUrl: '',
        imageAlt: '',
        buttonText: 'Khám phá hành trình',
        buttonLink: '#about-story',
        secondaryButtonText: 'Xem các dịch vụ',
        secondaryButtonLink: '/coaching',
        badges: [{ text: '[MẪU] ICF ACC Standards' }, { text: '[MẪU] Phương pháp EQ' }],
        stats: [
          { value: '[MẪU] 10+', label: '[MẪU] Năm kinh nghiệm' },
          { value: '[MẪU] 500+', label: '[MẪU] Giờ khai vấn' },
        ],
        bgColor: 'warm-ivory',
        padding: 'lg',
      },
    },
    {
      type: 'ImageText',
      props: {
        id: 'about-story',
        version: 2,
        layout: 'image-left',
        seriesLabel: '[MẪU] Ý nghĩa thương hiệu',
        titleLine1: '[MẪU] TẠI SAO LẠI LÀ',
        titleLine2: '[MẪU] "TRẠM DỪNG CẢM XÚC"?',
        content:
          '[MẪU] Giữa nhịp sống hối hả, chúng ta thường mải miết chạy theo những mục tiêu bên ngoài mà quên mất việc kết nối với thế giới nội tâm.\n\n[MẪU] "Trạm Dừng" không phải là điểm kết thúc, mà là khoảng nghỉ cần thiết để bạn hồi phục năng lượng, nhìn nhận lại bản thân và bước tiếp vững chãi hơn.',
        quote: '[MẪU] Dừng lại một nhịp là cách nhanh nhất để bạn đi xa hơn.',
        mediaId: '',
        imageUrl: '',
        imageAlt: '',
        imageLabel: '[MẪU] Không gian an toàn',
        buttonText: 'Tìm hiểu phương pháp',
        buttonLink: '#about-journey',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'VisionMission',
      props: {
        id: 'about-vision-mission',
        version: 1,
        seriesLabel: '[MẪU] ĐỊNH HƯỚNG TƯƠNG LAI',
        titleLine1: '[MẪU] TẦM NHÌN &',
        titleLine2: '[MẪU] SỨ MỆNH',
        quote: '[MẪU] Dừng lại để lắng nghe, thấu cảm để vững vàng bước tiếp.',
        visionTitle: '[MẪU] TẦM NHÌN',
        visionContent:
          '[MẪU] Trở thành điểm tựa tinh thần và người bạn đồng hành tin cậy cho hàng triệu người trẻ và tổ chức trên hành trình phát triển trí tuệ cảm xúc.',
        visionIcon: 'compass',
        missionTitle: '[MẪU] SỨ MỆNH',
        missionContent:
          '[MẪU] Giúp mỗi cá nhân nhận diện, gọi tên và chuyển hóa cảm xúc thành sức mạnh nội tại, kiến tạo cuộc sống an yên và sự nghiệp thăng hoa.',
        missionIcon: 'heart',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'IconCardGrid',
      props: {
        id: 'about-values',
        version: 1,
        seriesLabel: '[MẪU] Giá trị cốt lõi',
        titleLine1: '[MẪU] BỐN TRỤ CỘT',
        titleLine2: '[MẪU] ĐỊNH HÌNH HÀNH ĐỘNG',
        emotionLine:
          '[MẪU] Những nguyên tắc soi đường cho mọi sản phẩm và phiên đồng hành tại Trạm.',
        marker: 'icon',
        columns: 4,
        cardStyle: 'white',
        items: [
          {
            icon: 'heart',
            title: '[MẪU] Thấu cảm',
            text: '[MẪU] Lắng nghe sâu sắc không phán xét, đón nhận mọi cung bậc cảm xúc với sự chân thành.',
          },
          {
            icon: 'compass',
            title: '[MẪU] Khoa học',
            text: '[MẪU] Ứng dụng các khung lý thuyết EQ và khoa học thói quen đã được kiểm chứng quốc tế.',
          },
          {
            icon: 'spark',
            title: '[MẪU] Chân thành',
            text: '[MẪU] Đồng hành với sự ấm áp, trung thực và đặt đạo đức nghề nghiệp lên hàng đầu.',
          },
          {
            icon: 'layers',
            title: '[MẪU] Bền vững',
            text: '[MẪU] Chú trọng chuyển hóa nội tại để tạo ra kết quả lâu dài và tự chủ cho người học.',
          },
        ],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'JourneySteps',
      props: {
        id: 'about-journey',
        version: 2,
        variant: 'cards',
        highlightStep: 1,
        seriesLabel: '[MẪU] Khung chuyển hóa',
        titleLine1: '[MẪU] KHUNG CHUYỂN HÓA 5 BƯỚC',
        titleLine2: '[MẪU] PHƯƠNG PHÁP ĐỘC BẢN',
        emotionLine: '[MẪU] Lộ trình bài bản giúp chuyển đổi cảm xúc thành hành động cụ thể.',
        step1Subtitle: '[MẪU] Bước 1: Pause',
        step1Description:
          '[MẪU] Dừng lại quan sát và tạo khoảng lặng cần thiết giữa kích thích và phản hồi.',
        step2Subtitle: '[MẪU] Bước 2: Feel',
        step2Description:
          '[MẪU] Cảm nhận và đón nhận trọn vẹn những rung động bên trong cơ thể mà không né tránh.',
        step3Subtitle: '[MẪU] Bước 3: Name',
        step3Description:
          '[MẪU] Gọi tên chính xác trạng thái cảm xúc và nhu cầu cốt lõi ẩn sau phản ứng.',
        step4Subtitle: '[MẪU] Bước 4: Choose',
        step4Description:
          '[MẪU] Lựa chọn phản hồi mang tính xây dựng, phù hợp với mục tiêu lâu dài.',
        step5Subtitle: '[MẪU] Bước 5: Practice',
        step5Description:
          '[MẪU] Thực hành kiên trì từng bước nhỏ mỗi ngày để biến nhận thức thành thói quen.',
        bgColor: 'warm-ivory',
        padding: 'lg',
      },
    },
    {
      type: 'HanaStory',
      props: {
        id: 'about-letter',
        version: 3,
        tone: 'light',
        layout: 'letter',
        imagePosition: 'left',
        seriesLabel: '[MẪU] Lời chào từ nhà sáng lập',
        titleLine1: '[MẪU] LỜI TÂM TÌNH GỬI BẠN',
        titleLine2: '[MẪU] NGƯỜI ĐANG TÌM LẠI CHÍNH MÌNH',
        jobTitle: '',
        greeting: '[MẪU] Thân gửi bạn,',
        signatureName: '[MẪU] Người sáng lập Trạm Dừng Cảm Xúc',
        chips: [],
        storyContent:
          '[MẪU] Tôi tin rằng mỗi người chúng ta đều mang trong mình những tiềm năng to lớn, nhưng đôi khi những áp lực và xáo trộn cảm xúc che mờ tầm nhìn của ta.\n\n[MẪU] Trạm Dừng Cảm Xúc được thành lập với mong muốn trở thành nơi bạn có thể trút bỏ những gánh nặng, lắng nghe tiếng nói bên trong và tìm lại sự bình an thực sự.',
        quoteLine:
          '[MẪU] Hãy kiên nhẫn với chính mình, bởi mọi hành trình chuyển hóa đều cần thời gian và sự dịu dàng.',
        mediaId: '',
        imageUrl: '',
        imageAlt: '',
        buttonText: '',
        buttonLink: '',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'TeamGrid',
      props: {
        id: 'about-team',
        version: 1,
        seriesLabel: '[MẪU] Đội ngũ chuyên gia',
        titleLine1: '[MẪU] NHỮNG NGƯỜI ĐỒNG HÀNH',
        titleLine2: '[MẪU] TẬN TÂM & CHUYÊN NGHIỆP',
        emotionLine:
          '[MẪU] Đội ngũ chuyên gia đạt chuẩn quốc tế luôn sẵn sàng sát cánh cùng bạn trên hành trình phát triển.',
        bgColor: 'warm-ivory',
        padding: 'lg',
      },
    },
    {
      type: 'RichText',
      props: {
        id: 'about-standards-text',
        version: 1,
        content:
          '[MẪU] Mọi phiên khai vấn và chương trình đào tạo tại Trạm đều tuân thủ các chuẩn mực đạo đức và năng lực cốt lõi của Liên đoàn Khai vấn Quốc tế (ICF).\n\n[MẪU] Chúng tôi kết hợp các công cụ đo lường EQ chuẩn hóa toàn cầu nhằm đem lại những giải pháp vừa thấu cảm vừa chuẩn xác.',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'IconCardGrid',
      props: {
        id: 'about-standards-grid',
        version: 1,
        seriesLabel: '[MẪU] Chứng thực chuyên môn',
        titleLine1: '[MẪU] NỀN TẢNG CHUYÊN SÂU',
        titleLine2: '[MẪU] BẢO CHỨNG CHẤT LƯỢNG',
        emotionLine: '[MẪU] Các chuẩn mực chuyên môn được tích hợp trong từng chương trình.',
        marker: 'icon',
        columns: 3,
        cardStyle: 'white',
        items: [
          {
            icon: 'target',
            title: '[MẪU] Chuẩn mực ICF',
            text: '[MẪU] Tuân thủ 8 năng lực cốt lõi và quy tắc đạo đức quốc tế trong mọi phiên khai vấn.',
          },
          {
            icon: 'compass',
            title: '[MẪU] Phương pháp EQ',
            text: '[MẪU] Đo lường và phát triển năng lực cảm xúc có hệ thống dựa trên mô hình khoa học.',
          },
          {
            icon: 'spark',
            title: '[MẪU] Khoa học thói quen',
            text: '[MẪU] Ứng dụng quy luật 4 bước hình thành thói quen bền bỉ và dễ áp dụng.',
          },
        ],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'StatsBar',
      props: {
        id: 'about-stats',
        version: 2,
        stats: [
          {
            value: '[MẪU] 10+',
            label: '[MẪU] Năm kinh nghiệm',
            description: '[MẪU] Khai vấn & phát triển con người',
            icon: '',
          },
          {
            value: '[MẪU] 500+',
            label: '[MẪU] Giờ khai vấn',
            description: '[MẪU] Thực hành chuyên nghiệp',
            icon: '',
          },
          {
            value: '[MẪU] 98%',
            label: '[MẪU] Đánh giá tích cực',
            description: '[MẪU] Từ các khách hàng tham gia',
            icon: '',
          },
        ],
        bgColor: 'lavender-mist',
        padding: 'md',
      },
    },
    {
      type: 'LogoStrip',
      props: {
        id: 'about-logos',
        version: 2,
        title: '[MẪU] ĐƯỢC ĐỒNG HÀNH VÀ TIN TƯỞNG BỞI',
        groups: [],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'TwoPathCards',
      props: {
        id: 'about-paths',
        version: 1,
        seriesLabel: '[MẪU] Sẵn sàng bắt đầu',
        titleLine1: '[MẪU] CHỌN LỘ TRÌNH',
        titleLine2: '[MẪU] PHÙ HỢP VỚI BẠN',
        path1GroupLabel: '[MẪU] CHO CÁ NHÂN',
        path1Title: '[MẪU] COACHING 1:1 & PHÁT TRIỂN EQ',
        path1Description:
          '[MẪU] Dành cho cá nhân muốn thấu hiểu cảm xúc, gỡ bỏ rào cản tâm lý và kiến tạo sự nghiệp thăng hoa.',
        path1ButtonLabel: 'Khám phá lộ trình cá nhân',
        path1LinkType: 'url',
        path1PageId: '',
        path1Href: '/lo-trinh-chuyen-minh',
        path1ButtonStyle: 'solid',
        path2GroupLabel: '[MẪU] CHO DOANH NGHIỆP',
        path2Title: '[MẪU] ĐÀO TẠO & WORKSHOP EQ',
        path2Description:
          '[MẪU] Đồng hành cùng tổ chức xây dựng văn hóa thấu cảm, gắn kết đội ngũ và gia tăng hiệu suất bền vững.',
        path2ButtonLabel: 'Giải pháp doanh nghiệp',
        path2LinkType: 'url',
        path2PageId: '',
        path2Href: '/doanh-nghiep',
        path2ButtonStyle: 'outline',
        bgColor: 'warm-ivory',
        padding: 'lg',
      },
    },
  ],
}
