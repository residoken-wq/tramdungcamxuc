import type { Data } from '@puckeditor/core'

export const journeyTemplate: Data = {
  root: {
    props: {
      title: 'Trang lộ trình',
    },
  },
  zones: {},
  content: [
    // §1. Hero (tr. 1), nền deep-navy
    {
      type: 'HeroImage',
      props: {
        id: 'journey-hero',
        version: 3,
        layout: 'side',
        imageSide: 'right',
        imageShape: 'arch-right',
        mediaId: '',
        imageUrl: '',
        imageAlt: '',
        seriesLabel: 'TRẠM DỪNG CẢM XÚC · MÔ HÌNH CHƯƠNG TRÌNH TRỌNG TÂM',
        titleLine1: 'Chuyển mình',
        titleLine2: 'không chênh vênh',
        titleCase: 'none',
        titleLine1Color: 'white',
        titleLine2Color: 'white',
        showAccentBar: true,
        showArchGraphic: true,
        emotionLine:
          'Lộ trình cho phụ nữ đi qua bước chuyển mình trong sự nghiệp với 3 năng lực lõi: bền bỉ trong hành động, vững chãi từ bên trong, hài hòa trong các mối quan hệ.',
        listTitle: 'PHASE 1',
        listItems: [
          { text: '01 · Xây thói quen – Dựng thương hiệu' },
          { text: '02 · Tập thương cảm xúc' },
          { text: '03 · Giao tiếp hài hòa nam tính – nữ tính' },
          { text: 'Phase 2 · Career Clarity – Thông suốt sự nghiệp', muted: true },
        ],
        buttonText: '',
        buttonLink: '',
        badges: [],
        stats: [],
        bgColor: 'deep-navy',
        padding: 'lg',
      },
    },

    // §2. Câu chuyện (tr. 2), nền lavender-mist
    {
      type: 'StoryLead',
      props: {
        id: 'journey-story',
        version: 1,
        seriesLabel: '01 · CÂU CHUYỆN KHÔNG CỦA RIÊNG AI',
        titleLine1: 'Chuyển mình là hành trình khó khăn bạn luôn cần đi qua để trưởng thành.',
        titleLine2: '',
        emotionLine: 'Nhưng bạn hoàn toàn có thể đi qua nó mà KHÔNG CHÊNH VÊNH.',
        content:
          'Chương trình đồng hành cùng phụ nữ công sở xây ba nền tảng — hành động bền bỉ, cảm xúc vững vàng, giao tiếp hài hòa — để mỗi bước chuyển trong sự nghiệp được đi trên một nền đủ vững và bình an hơn trong nội tâm.',
        bgColor: 'lavender-mist',
        padding: 'lg',
      },
    },

    // §3. Bối cảnh & chân dung (tr. 3), nền warm-ivory
    {
      type: 'ContextProfile',
      props: {
        id: 'journey-context',
        version: 1,
        seriesLabel: '02 · BỐI CẢNH & CHÂN DUNG',
        title: 'Phụ nữ thời đại AI đứng trước một bước chuyển mình lớn',
        showAccentBar: true,
        statCards: [
          {
            stat: '39%',
            text: 'kỹ năng cốt lõi của người lao động được dự báo sẽ **thay đổi đến năm 2030**.',
          },
          {
            stat: '3X',
            text: 'Ở các nước thu nhập cao, việc làm của nữ có nguy cơ bị AI tự động hóa cao nhất chiếm **9,6% — gần gấp ba nam giới**.',
          },
        ],
        italicQuoteLeft: 'Luật chơi đang đổi — và phụ nữ công sở chịu sức ép thích nghi lớn hơn.',
        profileCard: {
          eyebrow: 'CÔ ẤY LÀ AI',
          quote:
            '“Mình có năng lực, có kinh nghiệm — nhưng chưa đủ tự tin để thể hiện mình và luôn sợ bị đào thải.”',
          items: [
            'Giỏi chuyên môn, nhưng nhiều việc quen tay giờ AI làm nhanh hơn',
            'Biết mình cần đổi, chưa rõ đổi theo hướng nào',
            'Vừa giữ việc, vừa lo gia đình, vừa phải học lại',
            'Luôn trong trạng thái "overthinking"',
          ],
        },
        sourceNote:
          'Nguồn: WEF, Future of Jobs Report 2025 · ILO–NASK, chỉ số tác động của GenAI tới việc làm, 2025',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },

    // §4. Nỗi đau (tr. 4), nền warm-ivory
    {
      type: 'PillarCardGrid',
      props: {
        id: 'journey-painpoints',
        version: 1,
        seriesLabel: '03 · NỖI ĐAU',
        title: 'Ba kiểu chênh vênh khi AI đổi luật chơi',
        showAccentBar: true,
        cards: [
          {
            tone: 'butter-cream',
            label: 'TRONG HÀNH ĐỘNG',
            hasAccentBar: true,
            items: [
              {
                title: 'Học lại mà không duy trì nổi',
                text: 'Khóa học mua rồi để đó; việc và nhà cuốn đi hết.',
              },
              {
                title: 'Giá trị của mình mờ đi',
                text: 'Việc mình giỏi, AI làm nhanh hơn — mình còn khác biệt ở đâu?',
              },
              {
                title: 'Thấy người khác bứt tốc',
                text: 'Đồng nghiệp đã dùng AI, đã có tiếng nói riêng; mình đứng yên.',
              },
            ],
          },
          {
            tone: 'soft-pink',
            label: 'TRONG CẢM XÚC',
            hasAccentBar: true,
            items: [
              {
                title: 'Lo bị đào thải',
                text: 'Mỗi tin cắt giảm, mỗi công cụ mới lại một lần chao đảo.',
              },
              {
                title: 'So sánh, tự nghi ngờ',
                text: '“Mình có đang tụt lại không?” vang lên mỗi lần lướt mạng.',
              },
              {
                title: 'Mệt mà không dám dừng',
                text: 'Sợ dừng lại là bị bỏ lại, nên cứ gồng.',
              },
            ],
          },
          {
            tone: 'mint-haze',
            label: 'TRONG GIAO TIẾP',
            hasAccentBar: true,
            items: [
              {
                title: 'Khó nói ra giá trị mình',
                text: 'Khi AI viết thay báo cáo, cách mình nói và kết nối mới là khác biệt.',
              },
              {
                title: 'Lúc quá cứng, lúc quá mềm',
                text: 'Chưa tìm được giọng vừa rõ vừa ấm.',
              },
              {
                title: 'Ngại lên tiếng, đề xuất',
                text: 'Không dám hỏi, đàm phán hay xin một vai trò mới.',
              },
            ],
          },
        ],
        bottomQuote: 'Gốc chung: luật chơi đổi nhanh hơn NỘI LỰC bên trong mỗi chúng ta.',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },

    // §5. Mong muốn thật sự (tr. 5), nền warm-ivory
    {
      type: 'ProgramWishes',
      props: {
        id: 'journey-wishes',
        version: 1,
        seriesLabel: '04 · MONG MUỐN THẬT SỰ',
        title: 'Bước tiếp cùng AI, mà vẫn là chính mình',
        showAccentBar: true,
        topQuote: '“Mình muốn thay đổi — nhưng không muốn đánh mất sự bình an và chính mình.”',
        cards: [
          {
            tone: 'butter-cream',
            label: 'Chương trình 01',
            title: 'Bền bỉ với mình',
            text: 'Học và thích nghi đều đặn bằng những hành động nhỏ, bền bỉ.',
          },
          {
            tone: 'soft-pink',
            label: 'Chương trình 02',
            title: 'Vững chãi từ bên trong',
            text: 'Bình an trước thay đổi, không bị nỗi lo đào thải dẫn dắt.',
          },
          {
            tone: 'mint-haze',
            label: 'Chương trình 03',
            title: 'Hài hòa với người',
            text: 'Lắng nghe, thuyết phục, kết nối — điều AI khó làm thay.',
          },
          {
            tone: 'deep-navy',
            label: 'Phase 2',
            title: 'Vững vàng với nghề',
            text: 'Rõ thế mạnh, giá trị và hướng đi tiếp theo trong sự nghiệp.',
          },
        ],
        calloutTitle: 'XU HƯỚNG ĐẾN 2030',
        calloutText:
          'Bên cạnh AI, sự bền bỉ, linh hoạt, tò mò và học suốt đời là những kỹ năng đang tăng tầm quan trọng. — WEF, Future of Jobs 2025',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },

    // §6. Kiến trúc chương trình (tr. 6), nền warm-ivory
    {
      type: 'PhaseArchitecture',
      props: {
        id: 'journey-phase-arch',
        version: 1,
        seriesLabel: '05 · KIẾN TRÚC CHƯƠNG TRÌNH',
        title: 'Hai phase: xây nền trước, định hướng sau',
        showAccentBar: true,
        phase1Label: 'PHASE 1 · HÔM NAY',
        phase1Title: 'Nền tảng chuyển mình',
        phase1Items: [
          {
            tone: 'butter-cream',
            title: '01 · Xây thói quen – Dựng thương hiệu',
            text: 'Bền bỉ trong hành động · Tự tin với mình',
          },
          {
            tone: 'soft-pink',
            title: '02 · Tập thương cảm xúc',
            text: 'Vững chãi từ bên trong',
          },
          {
            tone: 'mint-haze',
            title: '03 · Giao tiếp hài hòa nam tính – nữ tính',
            text: 'Hài hòa với người',
          },
        ],
        phase2Label: 'PHASE 2 · TIẾP THEO',
        phase2Title: 'Career Clarity',
        phase2Subtitle: 'Thông suốt sự nghiệp · Vững vàng với nghề',
        phase2Text:
          'Hiểu mình rõ hơn, nhận ra thế mạnh và định hướng rõ bước tiếp theo trong sự nghiệp.',
        phase2Chip: 'Thông qua lộ trình Hướng nghiệp và Khai vấn 1:1',
        noteBoxLabel: 'VÌ SAO CAREER CLARITY ĐI SAU',
        noteBoxText:
          'Khi đã có nhịp hành động, nền cảm xúc vững và cách giao tiếp hài hòa, lựa chọn nghề nghiệp mới đủ rõ để bước và đủ bền để đi tiếp.',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },

    // §7. Nguyên lý thiết kế (tr. 7), nền warm-ivory
    {
      type: 'LoopDiagram',
      props: {
        id: 'journey-loop',
        version: 1,
        seriesLabel: '06 · NGUYÊN LÝ THIẾT KẾ',
        titleLine1: 'Một vòng lặp cho mọi kỹ năng',
        titleLine2: '',
        titleCase: 'none',
        showAccentBar: true,
        centerText: 'Hiểu mình và tự tin hơn qua từng trải nghiệm.',
        nodes: [
          { label: '01 · Nhận diện vấn đề' },
          { label: '02 · Hiểu rõ phương pháp' },
          { label: '03 · Hướng dẫn' },
          { label: '04 · Thử nghiệm' },
          { label: '05 · Nhìn lại' },
          { label: '06 · Đúc kết' },
        ],
        rightTitle: 'VÒNG LẶP TRONG CÁCH TRIỂN KHAI',
        rightItems: [
          {
            pill: 'Workshop',
            pillStyle: 'solid',
            text: 'Nhận diện vấn đề của mình, hiểu rõ phương pháp và được hướng dẫn cách làm.',
          },
          {
            pill: '28 ngày',
            pillStyle: 'outline',
            text: 'Thử nghiệm trong đời sống thật, theo nhịp của riêng mình.',
          },
          {
            pill: 'Reflection',
            pillStyle: 'outline',
            text: 'Nhìn lại và đúc kết điều thật sự hợp với mình.',
          },
        ],
        bottomQuote:
          'Mỗi vòng quay là một lần kỹ năng bám rễ sâu hơn, cho đến khi nó trở thành thói quen.',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },

    // §8. Nền tảng phương pháp (tr. 8), nền warm-ivory
    {
      type: 'IconCardGrid',
      props: {
        id: 'journey-method-grid',
        version: 2,
        seriesLabel: '07 · NỀN TẢNG PHƯƠNG PHÁP',
        titleLine1: 'Bốn nền tảng phương pháp của chương trình',
        titleLine2: '',
        titleCase: 'none',
        showAccentBar: true,
        columns: 4,
        bgColor: 'warm-ivory',
        padding: 'md',
        cards: [
          {
            id: 'method-card-1',
            type: 'Card',
            props: {
              id: 'method-c1',
              version: 1,
              cardBg: 'butter-cream',
              icon: 'book',
              eyebrow: 'SỰ BỀN BỈ',
              eyebrowBar: true,
              title: 'Xây thói quen dựng thương hiệu',
              text: 'Hiểu vòng lặp thói quen, rồi thiết kế cách làm hợp nhịp sống của mình.',
            },
          },
          {
            id: 'method-card-2',
            type: 'Card',
            props: {
              id: 'method-c2',
              version: 1,
              cardBg: 'soft-pink',
              icon: 'calendar',
              eyebrow: 'SỰ CÂN BẰNG',
              eyebrowBar: true,
              title: 'Đi qua cơn giông cảm xúc',
              text: 'Tách tình huống, suy nghĩ, cơ thể, cảm xúc; gọi tên bằng màu, hình và từ khóa.',
            },
          },
          {
            id: 'method-card-3',
            type: 'Card',
            props: {
              id: 'method-c3',
              version: 1,
              cardBg: 'mint-haze',
              icon: 'user',
              eyebrow: 'SỰ LINH HOẠT',
              eyebrowBar: true,
              title: 'Hài hòa tính nam – tính nữ trong giao tiếp',
              text: 'Cân bằng sự rõ ràng, quyết đoán với lắng nghe, thấu cảm, tùy ngữ cảnh.',
            },
          },
          {
            id: 'method-card-4',
            type: 'Card',
            props: {
              id: 'method-c4',
              version: 1,
              cardBg: 'lavender-mist',
              icon: 'mirror',
              eyebrow: 'SỢI CHỈ XUYÊN SUỐT',
              eyebrowBar: true,
              title: 'Trưởng thành từ nhìn lại',
              text: 'Bốn lần nhìn lại trên dữ liệu thật trong 28 ngày: điều gì diễn ra, điều gì giúp, điều gì cần đổi.',
            },
          },
        ],
        bottomQuote: 'Mỗi lần nhìn lại là một lần thấy mình rõ hơn — và bớt chênh vênh hơn.',
      },
    },

    // §9. Mô hình tổng thể (tr. 9), nền warm-ivory
    {
      type: 'ProgramOverview',
      props: {
        id: 'journey-overview',
        version: 1,
        seriesLabel: '08 · MÔ HÌNH TỔNG THỂ',
        title: 'Một nền tảng chung, ba trụ cột chuyển mình',
        showAccentBar: true,
        topStripLabel: 'NỀN TẢNG CHUNG',
        topStripText:
          'Dành cho phụ nữ công sở · Học qua trải nghiệm thật · Cam kết vừa sức · Tôn trọng mức chia sẻ',
        pillars: [
          {
            tone: 'butter-cream',
            pillarNumber: 'TRỤ CỘT 01',
            title: 'Xây thói quen – Dựng thương hiệu',
            subtitleItalic: 'Bền bỉ trong hành động',
            stepsText: 'HIỂU → THỬ → SỐNG',
          },
          {
            tone: 'soft-pink',
            pillarNumber: 'TRỤ CỘT 02',
            title: 'Tập thương cảm xúc',
            subtitleItalic: 'Vững chãi từ bên trong',
            stepsText: 'HIỂU → GỌI TÊN → ĐÓN NHẬN & ĐIỀU HÒA',
          },
          {
            tone: 'mint-haze',
            pillarNumber: 'TRỤ CỘT 03',
            title: 'Giao tiếp hài hòa nam tính – nữ tính',
            subtitleItalic: 'Hài hòa với người',
            stepsText: 'HIỂU → CÂN BẰNG → THỂ HIỆN',
          },
        ],
        middleStripLabel: 'NHỊP ĐIỆU TRIỂN KHAI',
        middleStripText: '2 workshop · 28 ngày · 4 lần nhìn lại — giữ thay đổi ở lại sau buổi học',
        bottomStripLabel: 'SẴN SÀNG CHO GIAI ĐOẠN 2',
        bottomStripText:
          'Career Clarity – Thông suốt sự nghiệp · định hướng bước tiếp theo trên nền đã vững',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },

    // §10. Cách triển khai (tr. 10), nền warm-ivory
    {
      type: 'JourneyMilestones',
      props: {
        id: 'journey-milestones',
        version: 1,
        seriesLabel: '09 · CÁCH TRIỂN KHAI',
        title: 'HÀNH TRÌNH CHUYỂN HÓA',
        showAccentBar: true,
        topStats: [
          {
            number: '2',
            title: 'Workshop online',
            description: '90 phút/buổi, diễn ra trước ngày 1',
          },
          {
            number: '28',
            title: 'Ngày thực hành',
            description: 'Theo kế hoạch cá nhân, nhịp của riêng mình',
          },
          {
            number: '4',
            title: 'Lần reflection',
            description: 'Hằng tuần, đề xuất 60 phút/buổi',
          },
        ],
        group1Title: 'TRƯỚC NGÀY 1',
        group1Cards: [
          {
            title: 'Workshop 1',
            subtitle: '90 phút · online',
            tone: 'lavender-mist',
          },
          {
            title: 'Workshop 2',
            subtitle: '90 phút · online',
            tone: 'lavender-mist',
          },
        ],
        group2Title: '28 NGÀY THỰC HÀNH CÓ ĐỒNG HÀNH',
        group2Cards: [
          {
            title: 'Tuần 1',
            subtitle: 'Reflection ngày 7',
            tone: 'white',
          },
          {
            title: 'Tuần 2',
            subtitle: 'Reflection ngày 14',
            tone: 'white',
          },
          {
            title: 'Tuần 3',
            subtitle: 'Reflection ngày 21',
            tone: 'white',
          },
          {
            title: 'Tuần 4',
            subtitle: 'Ngày 28 · tổng kết',
            tone: 'white',
          },
        ],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },

    // §11. Chương trình 01 (tr. 11), nền butter-cream
    {
      type: 'ProgramStepFlow',
      props: {
        id: 'journey-p1-habit',
        version: 1,
        seriesLabel: 'CHƯƠNG TRÌNH 01 · HABIT FORMATION',
        title: 'Xây thói quen - Dựng thương hiệu',
        showAccentBar: true,
        emotionLine: 'Sống điều mình muốn được biết đến · lộ trình HIỂU – THỬ – SỐNG',
        takeawayTone: 'butter-cream',
        steps: [
          {
            eyebrow: 'CHẶNG 1 · HIỂU',
            title: 'Habit Loop & bốn quy luật',
            chip: 'Workshop 1 · 90 phút',
            bullets: [
              'Tín hiệu → làm cho rõ ràng',
              'Khao khát → làm cho hấp dẫn',
              'Hành động → làm cho dễ dàng',
              'Phần thưởng → làm cho thỏa mãn',
            ],
            takeawayTitle: 'Mang về',
            takeawayText: 'Hiểu cách thói quen vận hành và hướng dẫn tự trải nghiệm xây dựng thói quen',
          },
          {
            eyebrow: 'CHẶNG 2 · THỬ',
            title: 'NAME – MATCH – ACT – REFINE',
            chip: 'Workshop 2 · 90 phút',
            bullets: [
              'Gọi tên hành vi, mức tối thiểu',
              'Chọn công cụ hợp điểm kẹt',
              'Điền Habit Plan, làm thử',
              'Chỉnh khi bận hoặc mệt',
            ],
            takeawayTitle: 'Mang về',
            takeawayText: 'Bản Habit Plan và công cụ theo dõi trong 28 ngày',
          },
          {
            eyebrow: 'CHẶNG 3 · SỐNG',
            title: 'Thực hành có đồng hành',
            chip: '28 ngày + 4 reflection',
            bullets: [
              'Tuần 1: bắt đầu, quan sát',
              'Tuần 2: chỉnh cho hợp mình',
              'Tuần 3: giữ nhịp, quay lại',
              'Tuần 4: nhận diện giá trị',
            ],
            takeawayTitle: 'Mang về',
            takeawayText: 'Một thói quen của riêng mình và cách tiếp nối',
          },
        ],
        bgColor: 'butter-cream',
        padding: 'md',
      },
    },

    // §12. Thương hiệu cá nhân (tr. 12), nền butter-cream
    {
      type: 'BrandFormula',
      props: {
        id: 'journey-p1-formula',
        version: 1,
        seriesLabel: 'CHƯƠNG TRÌNH 01 · CÁCH HIỂU THƯƠNG HIỆU',
        title: 'Thương hiệu cá nhân bắt đầu từ giá trị thật',
        showAccentBar: true,
        steps: [
          {
            number: '1',
            title: 'Điều mình đại diện',
            description: 'Phẩm chất và năng lực mình muốn tiếp tục nuôi dưỡng.',
          },
          {
            number: '2',
            title: 'Giá trị mình tạo ra',
            description: 'Một nhóm người cụ thể nhận được điều hữu ích từ mình.',
          },
          {
            number: '3',
            title: 'Minh chứng họ nhìn thấy',
            description: 'Cách làm việc, sản phẩm hoặc trải nghiệm có thể chia sẻ.',
          },
        ],
        bottomQuoteLeft:
          'Thói quen là cầu nối: biến lời giới thiệu thành điều người khác trải nghiệm được.',
        planCardEyebrow: 'HABIT PLAN MINH HỌA',
        planCardSubtitle: 'Mong muốn: chia sẻ kinh nghiệm nghề nghiệp có ích cho người mới',
        planCardQuote:
          '“Sau khi đóng máy làm việc vào thứ Ba và thứ Sáu, mình dành 5 phút ghi lại một tình huống và một bài học.”',
        planItem1Title: 'Ngày ít năng lượng',
        planItem1Text: 'Ghi một câu để giữ lại ý chính.',
        planItem2Title: 'Nếu bỏ lỡ',
        planItem2Text: 'Quay lại ở buổi kế tiếp đã lên lịch và xem điều gì cần đổi.',
        bgColor: 'butter-cream',
        padding: 'md',
      },
    },

    // §13. Chương trình 02 (tr. 13), nền soft-pink
    {
      type: 'ProgramStepFlow',
      props: {
        id: 'journey-p2-eq',
        version: 1,
        seriesLabel: 'CHƯƠNG TRÌNH 02 · EQ DEVELOPMENT',
        title: 'Tập thương cảm xúc',
        showAccentBar: true,
        emotionLine: 'Vững chãi từ bên trong · lộ trình HIỂU – GỌI TÊN – ĐÓN NHẬN & ĐIỀU HÒA',
        takeawayTone: 'soft-pink',
        steps: [
          {
            eyebrow: 'BƯỚC 1 · HIỂU',
            title: 'Emotional Literacy',
            chip: 'Workshop 1',
            description:
              'Tách bạch tình huống, cách diễn giải, tín hiệu cơ thể, cảm xúc, nhu cầu và phản ứng.',
            takeawayTitle: 'Mang về',
            takeawayText: 'Hiểu tín hiệu cảm xúc của chính mình',
          },
          {
            eyebrow: 'BƯỚC 2 · GỌI TÊN',
            title: 'Visual EQ',
            chip: 'Workshop 1',
            bullets: [
              'Chọn một màu, hình, biểu tượng',
              'Gắn tên cụ thể hơn “ổn”',
              'Kết nối với thời điểm, cơ thể',
              'Tự chọn giữ riêng hay chia sẻ',
            ],
            takeawayTitle: 'Mang về',
            takeawayText: 'Visual Emotion Map của riêng mình',
          },
          {
            eyebrow: 'BƯỚC 3 · ĐÓN NHẬN & ĐIỀU HÒA',
            title: 'Regulation Toolkit',
            chip: 'Workshop 2',
            description:
              'Phân biệt đón nhận với kìm nén, né tránh hay bốc đồng; thử vài cách làm dịu vừa sức.',
            takeawayTitle: 'Mang về',
            takeawayText: 'Emotional First-Aid Plan cá nhân',
          },
        ],
        bottomStripLeftLabel: 'SỐNG CÙNG CẢM XÚC',
        bottomStripLeftText: '28 ngày + 4 reflection → nhật ký quan sát và cách tiếp nối',
        bottomStripRightText: 'Giáo dục năng lực cảm xúc, không thay thế trị liệu tâm lý',
        bgColor: 'soft-pink',
        padding: 'md',
      },
    },

    // §14. Bộ công cụ điều hòa (tr. 14), nền soft-pink
    {
      type: 'NumberedStepsStrip',
      props: {
        id: 'journey-p2-tools',
        version: 1,
        seriesLabel: 'CHƯƠNG TRÌNH 02 · BỘ CÔNG CỤ ĐIỀU HÒA',
        title: 'Năm bước đi qua một cơn dông cảm xúc',
        showAccentBar: true,
        steps: [
          {
            number: '01',
            title: 'DỪNG',
            text: 'Nhận ra mình đang bị cuốn vào phản ứng; tạm dừng nếu an toàn.',
          },
          {
            number: '02',
            title: 'NHẬN DIỆN',
            text: 'Gọi tên cảm xúc, tín hiệu cơ thể và nhu cầu cần được chú ý.',
          },
          {
            number: '03',
            title: 'ĐIỀU HÒA',
            text: 'Thử một cách làm dịu: thở tự nhiên, grounding, uống nước, đi bộ.',
          },
          {
            number: '04',
            title: 'LỰA CHỌN',
            text: 'Cân nhắc cách nói, hành động hoặc xin hỗ trợ trước khi phản hồi.',
          },
          {
            number: '05',
            title: 'QUAY LẠI',
            text: 'Nhìn lại điều hiệu quả, không phán xét mình vì từng mất bình tĩnh.',
          },
        ],
        outputStripLabel: 'ĐẦU RA',
        outputStripText:
          'Emotional First-Aid Plan — kế hoạch vừa sức cho một tình huống quen thuộc, ví dụ khi nhận một phản hồi khiến mình muốn trả lời ngay.',
        bottomQuote: 'Vững vàng không phải là không có cơn dông.',
        bgColor: 'soft-pink',
        padding: 'md',
      },
    },

    // §15. Chương trình 03 (tr. 15), nền mint-haze
    {
      type: 'ProgramStepFlow',
      props: {
        id: 'journey-p3-comm',
        version: 1,
        seriesLabel: 'CHƯƠNG TRÌNH 03 · COMMUNICATION',
        title: 'Giao tiếp hài hòa tính nam - tính nữ',
        showAccentBar: true,
        emotionLine: 'Hài hòa với người · lộ trình HIỂU – CÂN BẰNG – THỂ HIỆN',
        takeawayTone: 'mint-haze',
        steps: [
          {
            eyebrow: 'BƯỚC 1 · HIỂU',
            title: 'Hai năng lượng',
            chip: 'Workshop 1',
            subColumns: {
              left: {
                title: 'Nam tính',
                items: ['Rõ ràng', 'Quyết đoán', 'Ranh giới', 'Hướng mục tiêu'],
              },
              right: {
                title: 'Nữ tính',
                items: ['Lắng nghe', 'Thấu cảm', 'Kết nối', 'Linh hoạt'],
              },
            },
            takeawayTitle: 'Mang về',
            takeawayText: 'Mình đang nghiêng về năng lượng nào, khi nào',
          },
          {
            eyebrow: 'BƯỚC 2 · CÂN BẰNG',
            title: 'Chọn theo ngữ cảnh',
            chip: 'Workshop 1',
            bullets: [
              'Khi cần rõ: nêu ý, đặt ranh giới',
              'Khi cần mềm: hỏi, nghe, ghi nhận',
              'Quá cứng hay quá mềm đều là tín hiệu',
              'Dừng và điều hòa trước khi đáp',
            ],
            takeawayTitle: 'Mang về',
            takeawayText: 'Bản đồ giao tiếp cá nhân',
          },
          {
            eyebrow: 'BƯỚC 3 · THỂ HIỆN',
            title: '5 module giao tiếp',
            chip: 'Workshop 2',
            description:
              'Trình bày quan điểm · Lắng nghe · Nói · Thuyết trình · Viết — luyện qua tình huống công sở thật.',
            takeawayTitle: 'Mang về',
            takeawayText: 'Một cuộc trò chuyện thật được chuẩn bị kỹ',
          },
        ],
        bottomStripLeftLabel: 'SỐNG CÙNG GIAO TIẾP',
        bottomStripLeftText: '28 ngày + 4 reflection → mỗi tuần thử trong một tình huống thật',
        bottomStripRightText: 'Hai năng lượng có trong mỗi người, không phải chuyện giới tính',
        bgColor: 'mint-haze',
        padding: 'md',
      },
    },

    // §16. Năm module giao tiếp (tr. 16), nền mint-haze
    {
      type: 'NumberedStepsStrip',
      props: {
        id: 'journey-p3-modules',
        version: 1,
        seriesLabel: 'CHƯƠNG TRÌNH 03 · NĂM MODULE GIAO TIẾP',
        title: 'Mỗi module, hai năng lượng cùng làm việc',
        showAccentBar: true,
        steps: [
          {
            number: '01',
            title: 'Trình bày quan điểm',
            subLines: [
              { label: 'Nam tính', text: 'Nêu ý rõ, có lý do' },
              { label: 'Nữ tính', text: 'Gắn với điều người nghe cần' },
            ],
          },
          {
            number: '02',
            title: 'Lắng nghe',
            subLines: [
              { label: 'Nam tính', text: 'Hỏi làm rõ, giữ trọng tâm' },
              { label: 'Nữ tính', text: 'Nghe cả ý lẫn cảm xúc' },
            ],
          },
          {
            number: '03',
            title: 'Nói',
            subLines: [
              { label: 'Nam tính', text: 'Dám nói “không”, đặt ranh giới' },
              { label: 'Nữ tính', text: 'Giọng ấm, ghi nhận người nghe' },
            ],
          },
          {
            number: '04',
            title: 'Thuyết trình',
            subLines: [
              { label: 'Nam tính', text: 'Cấu trúc, thông điệp chính' },
              { label: 'Nữ tính', text: 'Câu chuyện và sự hiện diện' },
            ],
          },
          {
            number: '05',
            title: 'Viết',
            subLines: [
              { label: 'Nam tính', text: 'Email mạch lạc, đúng mục đích' },
              { label: 'Nữ tính', text: 'Giữ quan hệ qua câu chữ' },
            ],
          },
        ],
        outputStripLabel: 'ĐẦU RA THEO TÌNH HUỐNG',
        outputStripText:
          'Mỗi module gắn với một tình huống thật: góp ý, từ chối, đề xuất trong họp, viết một email quan trọng.',
        bgColor: 'mint-haze',
        padding: 'md',
      },
    },

    // §17. Reflection (tr. 17), nền deep-navy
    {
      type: 'MatrixTable',
      props: {
        id: 'journey-reflection-table',
        version: 1,
        variant: 'list',
        bgColor: 'deep-navy',
        seriesLabel: '10 · SỢI CHỈ XUYÊN SUỐT',
        titleLine1: 'Reflection giữ thay đổi ở lại sau workshop',
        titleLine2: '',
        titleCase: 'none',
        showAccentBar: true,
        chipsTitle: '4 MỐC NHÌN LẠI',
        chips: [
          { label: 'Ngày 7' },
          { label: 'Ngày 14' },
          { label: 'Ngày 21' },
          { label: 'Ngày 28 · tổng kết' },
        ],
        rows: [
          {
            label: 'NHÌN LẠI',
            text: 'Điều gì thực sự đã diễn ra?',
            color: 'soft-pink',
          },
          {
            label: 'HIỂU',
            text: 'Điều gì giúp mình bắt đầu, hoặc khiến mình dừng lại?',
            color: 'mint-haze',
          },
          {
            label: 'ĐIỀU CHỈNH',
            text: 'Mình muốn giữ, giảm hoặc thay đổi điều gì?',
            color: 'butter-cream',
          },
          {
            label: 'TIẾP NỐI',
            text: 'Bước tiếp theo vừa sức với mình là gì?',
            color: 'lavender-mist',
          },
        ],
        footerNote:
          'Xem lại dữ liệu thật trên tracker hoặc nhật ký trước mỗi buổi · Chia sẻ ở mức mình chọn · Xin phép trước khi góp ý',
      },
    },

    // §18. Bản đồ 28 ngày (tr. 18), nền warm-ivory
    {
      type: 'MatrixTable',
      props: {
        id: 'journey-28day-map',
        version: 1,
        variant: 'grid',
        bgColor: 'warm-ivory',
        seriesLabel: '11 · BẢN ĐỒ 28 NGÀY',
        titleLine1: 'Nhịp thực hành',
        titleLine2: '',
        titleCase: 'none',
        showAccentBar: true,
        columns: [
          { label: '01 · Thói quen', color: 'butter-cream' },
          { label: '02 · Cảm xúc', color: 'soft-pink' },
          { label: '03 · Giao tiếp', color: 'mint-haze' },
        ],
        rows: [
          {
            label: 'Tuần 1',
            cells: [
              {
                title: 'Bắt đầu, quan sát',
                text: 'Điều gì khác với dự tính?',
              },
              {
                title: 'Quan sát tín hiệu',
                text: 'Cơ thể báo hiệu cảm xúc ra sao?',
              },
              {
                title: 'Quan sát cách mình nói',
                text: 'Mình nghiêng về năng lượng nào?',
              },
            ],
          },
          {
            label: 'Tuần 2',
            cells: [
              {
                title: 'Chỉnh cho hợp mình',
                text: 'Thay đổi nào giúp dễ làm hơn?',
              },
              {
                title: 'Gọi tên, biểu đạt',
                text: 'Cách nào giúp mình diễn đạt tốt hơn?',
              },
              {
                title: 'Lắng nghe, hỏi rõ',
                text: 'Mình nghe để hiểu hay để đáp?',
              },
            ],
          },
          {
            label: 'Tuần 3',
            cells: [
              {
                title: 'Giữ nhịp, quay lại',
                text: 'Khi nhịp gián đoạn, mình làm gì?',
              },
              {
                title: 'Đón nhận nhu cầu',
                text: 'Mình hay né tránh hay chăm sóc?',
              },
              {
                title: 'Nói rõ, ranh giới mềm',
                text: 'Nói thật mà vẫn giữ quan hệ?',
              },
            ],
          },
          {
            label: 'Tuần 4',
            cells: [
              {
                title: 'Nhận diện giá trị',
                text: 'Mình đã làm được gì, tiếp ra sao?',
              },
              {
                title: 'Điều hòa, quay lại',
                text: 'Điều gì giúp mình trở lại?',
              },
              {
                title: 'Thể hiện thật',
                text: 'Cuộc trò chuyện nào mình đã đi qua?',
              },
            ],
          },
        ],
      },
    },

    // §19. Điều mang về (tr. 19), nền warm-ivory
    {
      type: 'PillarCardGrid',
      props: {
        id: 'journey-takeaways',
        version: 1,
        seriesLabel: '12 · ĐIỀU MANG VỀ',
        title: 'Những thành tựu bạn tự tay tạo nên',
        showAccentBar: true,
        emotionLine: 'Đúc kết từ chính hành trình hiểu – thực hành – nhìn lại của bạn',
        cards: [
          {
            tone: 'butter-cream',
            label: '01 · HÀNH ĐỘNG',
            hasAccentBar: true,
            items: [
              {
                title: 'Thói quen của riêng mình',
                text: 'Biết bắt đầu từ đâu, giữ nhịp ra sao, quay lại khi lỡ nhịp.',
              },
              {
                title: 'Niềm tin vào chính mình',
                text: 'Những lời hứa nhỏ được giữ, và cả những lần biết quay lại.',
              },
              {
                title: 'Câu chuyện đáng kể',
                text: 'Trải nghiệm thật giúp người khác nhận ra giá trị của bạn.',
              },
            ],
          },
          {
            tone: 'soft-pink',
            label: '02 · CẢM XÚC',
            hasAccentBar: true,
            items: [
              {
                title: 'Hiểu cảm xúc của mình',
                text: 'Gọi tên điều đang diễn ra bên trong, bằng hình ảnh và từ ngữ.',
              },
              {
                title: 'Lối về bình an',
                text: 'Một cách làm dịu vừa sức cho lúc cảm xúc dâng cao.',
              },
              {
                title: 'Dịu dàng với chính mình',
                text: 'Nhìn lại mà không phán xét, kể cả khi chưa làm được.',
              },
            ],
          },
          {
            tone: 'mint-haze',
            label: '03 · GIAO TIẾP',
            hasAccentBar: true,
            items: [
              {
                title: 'Giọng nói của riêng mình',
                text: 'Vừa rõ ràng vừa ấm áp, hợp với từng tình huống.',
              },
              {
                title: 'Cuộc trò chuyện đã đi qua',
                text: 'Góp ý, từ chối hay đề xuất mà vẫn giữ được kết nối.',
              },
              {
                title: 'Tự tin khi lên tiếng',
                text: 'Trong họp, trước sếp hay đồng nghiệp.',
              },
            ],
          },
        ],
        bottomQuote:
          'Mỗi người đi một nhịp riêng — thành tựu là điều chính bạn đã hiểu, đã thử và đã nhìn lại.',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },

    // §20. Phase 2 (tr. 20), nền warm-ivory
    {
      type: 'PhaseArchitecture',
      props: {
        id: 'journey-phase2',
        version: 1,
        seriesLabel: '13 · PHASE 2',
        title: 'Từ nền tảng vững đến định hướng rõ',
        showAccentBar: true,
        phase1Label: 'PHASE 1 MANG SANG',
        phase1Title: '',
        phase1Items: [
          {
            tone: 'butter-cream',
            title: 'Thói quen',
            text: 'Nhịp hành động đều và câu chuyện giá trị của mình',
          },
          {
            tone: 'soft-pink',
            title: 'Cảm xúc',
            text: 'Nền vững để cân nhắc lựa chọn mà không vội vàng',
          },
          {
            tone: 'mint-haze',
            title: 'Giao tiếp',
            text: 'Cách trình bày giá trị và trao đổi về bước chuyển',
          },
        ],
        phase2Label: 'PHASE 2 · ĐỊNH HƯỚNG',
        phase2Title: 'Career Clarity',
        phase2Subtitle: 'Thông suốt sự nghiệp · Vững vàng với nghề',
        phase2Text:
          'Hiểu mình rõ hơn, nhận ra thế mạnh và định hướng rõ bước tiếp theo trong sự nghiệp.',
        phase2Chip: 'Khai vấn và hướng nghiệp 1:1',
        bottomQuote:
          'Bước chuyển rõ ràng và tự tin hơn khi mình đã đứng vững bằng những năng lực từ nội tại.',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },

    // §21. CTA cuối trang (thiết kế chưa có - mẫu CTASection)
    {
      type: 'CTASection',
      props: {
        id: 'journey-final-cta',
        version: 1,
        seriesLabel: '',
        titleLine1: '[MẪU] Tiêu đề kêu gọi',
        titleLine2: '',
        description: '',
        primaryButtonText: '[MẪU] Đăng ký tư vấn',
        primaryButtonLink: '/lien-he',
        secondaryButtonText: '',
        secondaryButtonLink: '',
        variant: 'default',
        bgColor: 'deep-navy',
        padding: 'lg',
      },
    },
  ],
}
