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
        titleLine1Color: 'warm-ivory',
        titleLine2Color: 'warm-ivory',
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
            stat: '1/3',
            text: 'kỹ năng cốt lõi sẽ **thay đổi trong 5 năm tới** khi AI định hình lại công việc.',
          },
          {
            stat: '2.5×',
            text: 'công việc do phụ nữ nắm giữ có **nguy cơ bị GenAI tác động cao hơn 2.5 lần** so với nam giới.',
          },
        ],
        italicQuoteLeft: 'Luật chơi đang đổi — và phụ nữ công sở chịu sức ép thích nghi lớn hơn.',
        profileCard: {
          eyebrow: 'CÔ ẤY LÀ AI',
          quote:
            '“Mình có năng lực, có kinh nghiệm — nhưng chưa đủ tự tin để thể hiện mình và luôn sợ bị đào thải.”',
          items: [
            '30–45 tuổi, quản lý tầm trung hoặc chuyên gia có kinh nghiệm',
            'Thấy guồng quay nhanh dần, đòi hỏi nhiều hơn',
            'Nghĩ về ngã rẽ mới: vị trí cao hơn, chuyển ngành, làm tự do',
            'Muốn bứt phá nhưng sợ quyết định sai và không vững tâm',
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
            label: '01 · NỖI ĐAU HÀNH ĐỘNG',
            hasAccentBar: true,
            items: [
              {
                title: 'Trì hoãn & quá tải',
                text: 'Nhiều dự định nhưng mở ra là chùn bước, không duy trì được.',
              },
              {
                title: 'Tự trách & so sánh',
                text: 'Thấy người khác học AI, đổi việc, làm rực rỡ, mình dậm chân tại chỗ.',
              },
              {
                title: 'Mất phương hướng',
                text: 'Làm nhiều nhưng không thấy điểm tựa, không tích lũy thành tài sản cá nhân.',
              },
            ],
          },
          {
            tone: 'soft-pink',
            label: '02 · NỖI ĐAU CẢM XÚC',
            hasAccentBar: true,
            items: [
              {
                title: 'Cạn kiệt & quá tải',
                text: 'Gánh nhiều vai, không còn khoảng thở, ngày nào cũng thấy mệt sâu.',
              },
              {
                title: 'Lo âu & bất an ngầm',
                text: 'Sợ bị thay thế, sợ tụt hậu, luôn trong trạng thái đề phòng.',
              },
              {
                title: 'Cô độc',
                text: 'Không biết chia sẻ cùng ai, sợ bị phán xét là yếu đuối hay than thở.',
              },
            ],
          },
          {
            tone: 'mint-haze',
            label: '03 · NỖI ĐAU GIAO TIẾP',
            hasAccentBar: true,
            items: [
              {
                title: 'Ngại thể hiện',
                text: 'Có chuyên môn nhưng im lặng trong các cuộc họp quan trọng.',
              },
              {
                title: 'Xung đột phong cách',
                text: 'Nữ tính bị coi là yếu mềm; quyết đoán bị dán nhãn khó gần.',
              },
              {
                title: 'Thiếu đồng minh',
                text: 'Làm việc chăm chỉ nhưng không có người nâng đỡ ở những ngã rẽ.',
              },
            ],
          },
        ],
        bottomQuote:
          'Gốc rễ không nằm ở năng lực. Gốc rễ nằm ở chỗ bạn đang cố bước qua một ngã rẽ lớn mà thiếu ba nền tảng cốt lõi.',
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
        title: 'Điều người phụ nữ chuyển mình thật sự tìm kiếm',
        showAccentBar: true,
        topQuote: 'Không phải là một khóa học nữa. Mà là một bước ngoặt để mình đứng vững.',
        cards: [
          {
            tone: 'butter-cream',
            label: '01 · HÀNH ĐỘNG',
            title: 'Hành động nhỏ mà bền',
            text: 'Một hệ thống hành động đơn giản, vừa sức, duy trì được mỗi ngày ngay trong guồng bận rộn.',
          },
          {
            tone: 'soft-pink',
            label: '02 · CẢM XÚC',
            title: 'Nội tâm vững vàng',
            text: 'Một chiếc phanh để dừng lại, điều hòa cảm xúc, không bị cuốn vào nỗi sợ bị đào thải.',
          },
          {
            tone: 'mint-haze',
            label: '03 · GIAO TIẾP',
            title: 'Giao tiếp có ảnh hưởng',
            text: 'Biết cách lên tiếng, giữ ranh giới, kết nối và dẫn dắt mà vẫn là chính mình.',
          },
          {
            tone: 'deep-navy',
            label: 'PHASE 2 · ĐÍCH ĐẾN',
            title: 'Thông suốt sự nghiệp',
            text: 'Một bản đồ nghề nghiệp rõ ràng, định vị bản thân sắc nét cho chặng tiếp theo.',
          },
        ],
        calloutTitle: 'ĐIỂM CHẠM QUAN TRỌNG:',
        calloutText:
          'Phase 1 xây nền vững (Hành động – Cảm xúc – Giao tiếp) thì Phase 2 (Career Clarity) mới đi xa được.',
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
        title: 'Một kiến trúc hai giai đoạn',
        showAccentBar: true,
        phase1Label: 'PHASE 1 · NỀN TẢNG CHUYỂN MÌNH',
        phase1Title: 'Ba năng lực nội tại cốt lõi',
        phase1Items: [
          {
            tone: 'butter-cream',
            title: '01 · XÂY THÓI QUEN – DỰNG THƯƠNG HIỆU',
            text: 'Hành động nhỏ, bền bỉ, tích lũy thành uy tín cá nhân trên dữ liệu thật',
          },
          {
            tone: 'soft-pink',
            title: '02 · TẬP THƯƠNG CẢM XÚC',
            text: 'Vững chãi từ bên trong, nhận diện và điều hòa cơn giông cảm xúc',
          },
          {
            tone: 'mint-haze',
            title: '03 · GIAO TIẾP HÀI HÒA NAM TÍNH – NỮ TÍNH',
            text: 'Ảnh hưởng tự nhiên, kết nối sâu sắc mà không phải gồng mình',
          },
        ],
        phase2Label: 'PHASE 2 · ĐỊNH HƯỚNG',
        phase2Title: 'Career Clarity',
        phase2Subtitle: 'Thông suốt sự nghiệp',
        phase2Text:
          'Khai vấn định hướng sự nghiệp 1:1, xây dựng chiến lược cá nhân và lộ trình chuyển mình cho 1–3 năm tới.',
        phase2Chip: 'Khai vấn 1:1 chuyên sâu',
        noteBoxLabel: 'LƯU Ý QUAN TRỌNG VỀ LỘ TRÌNH',
        noteBoxText:
          'Phase 1 là điều kiện tiên quyết. Khi nền tảng nội tại chưa vững, mọi định hướng nghề nghiệp đều dễ rơi vào chông chênh.',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },

    // §7. Nguyên lý thiết kế (tr. 7), nền warm-ivory
    {
      type: 'LoopDiagram',
      props: {
        id: 'journey-loop',
        version: 2,
        seriesLabel: '06 · NGUYÊN LÝ THIẾT KẾ',
        titleLine1: 'Vòng lặp chuyển hóa trong từng năng lực',
        titleLine2: '',
        titleCase: 'none',
        showAccentBar: true,
        centerText: 'CHUYỂN HÓA THẬT',
        nodes: [
          { label: '01 · NHẬN DIỆN' },
          { label: '02 · GIẢI MÃ' },
          { label: '03 · THỰC HÀNH' },
          { label: '04 · THEO DÕI' },
          { label: '05 · NHÌN LẠI' },
          { label: '06 · TÍCH HỢP' },
        ],
        rightTitle: 'MỖI NĂNG LỰC ĐỀU ĐI QUA 3 TẦNG TRẢI NGHIỆM',
        rightItems: [
          {
            pill: 'Workshop',
            pillStyle: 'solid',
            text: 'Hiểu nguyên lý, nhận diện mô thức qua bài tập thực tế',
          },
          {
            pill: '28 ngày',
            pillStyle: 'outline',
            text: 'Thực hành vi mô mỗi ngày trên Habit Tracker cá nhân',
          },
          {
            pill: 'Reflection',
            pillStyle: 'outline',
            text: '4 buổi nhìn lại có cấu trúc để neo lại chuyển hóa',
          },
        ],
        bottomQuote:
          'Không có chuyển hóa nào diễn ra sau một buổi nghe. Chuyển hóa thật cần một chu trình khép kín: hiểu – làm – nhìn lại.',
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
        title: 'Mô hình tổng thể Phase 1',
        showAccentBar: true,
        topStripLabel: 'KHUNG NỀN TẢNG',
        topStripText: '3 năng lực lõi × 28 ngày thực hành có đồng hành',
        pillars: [
          {
            tone: 'butter-cream',
            pillarNumber: '01',
            title: 'HÀNH ĐỘNG',
            subtitleItalic: 'Bền bỉ từ bên ngoài',
            stepsText: 'TẬP TRUNG · KỶ LUẬT · ĐO LƯỜNG',
          },
          {
            tone: 'soft-pink',
            pillarNumber: '02',
            title: 'CẢM XÚC',
            subtitleItalic: 'Vững chãi từ bên trong',
            stepsText: 'NHẬN DIỆN · CHUYỂN HÓA · ĐIỀU HÒA',
          },
          {
            tone: 'mint-haze',
            pillarNumber: '03',
            title: 'GIAO TIẾP',
            subtitleItalic: 'Hài hòa trong tương tác',
            stepsText: 'LẮNG NGHE · ẢNH HƯỞNG · ĐỒNG MINH',
          },
        ],
        middleStripLabel: 'SỢI CHỈ XUYÊN SUỐT',
        middleStripText: '4 buổi Reflection hàng tuần (Ngày 7 · 14 · 21 · 28)',
        bottomStripLabel: 'ĐÍCH ĐẾN',
        bottomStripText: 'Nền tảng vững chắc để tự tin bước vào Phase 2 — Career Clarity',
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
        title: 'Hành trình chuyển hóa',
        showAccentBar: true,
        topStats: [
          {
            number: '2',
            title: 'TUẦN CHUẨN BỊ',
            description:
              'Làm quen công cụ, chọn thói quen lõi, thiết lập nhịp sống trước khi vào hành trình chính thức.',
          },
          {
            number: '28',
            title: 'NGÀY THỰC HÀNH',
            description:
              'Đồng hành hàng ngày qua Habit Tracker số và nhóm thực hành riêng tư có coach theo sát.',
          },
          {
            number: '4',
            title: 'BUỔI REFLECTION',
            description:
              'Hàng tuần nhìn lại dữ liệu thật, gỡ nút thắt, điều chỉnh chiến lược kịp thời.',
          },
        ],
        group1Title: 'TRƯỚC NGÀY 1',
        group1Cards: [
          {
            title: 'Workshop định hướng',
            subtitle: 'Hiểu bản đồ hành trình, chọn 1–2 thói quen trọng tâm',
            tone: 'lavender-mist',
          },
          {
            title: 'Cài đặt công cụ',
            subtitle: 'Bàn giao Habit Tracker số và hướng dẫn đo lường cá nhân',
            tone: 'lavender-mist',
          },
        ],
        group2Title: '28 NGÀY THỰC HÀNH CÓ ĐỒNG HÀNH',
        group2Cards: [
          {
            title: 'Check-in mỗi ngày',
            subtitle: 'Ghi nhận tiến trình trên tracker, không áp lực hoàn hảo',
            tone: 'white',
          },
          {
            title: 'Prompt suy ngẫm',
            subtitle: 'Câu hỏi gợi mở mỗi sáng giúp kết nối sâu với bản thân',
            tone: 'white',
          },
          {
            title: 'Hỏi đáp cùng Coach',
            subtitle: 'Gỡ vướng theo thời gian thực khi gặp tình huống khó',
            tone: 'white',
          },
          {
            title: 'Reflection cuối tuần',
            subtitle: '90 phút nhìn lại cùng nhóm nhỏ, đúc kết bài học tuần',
            tone: 'white',
          },
        ],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },

    // §11. Chương trình 01 (tr. 11), nền warm-ivory
    {
      type: 'ProgramStepFlow',
      props: {
        id: 'journey-p1-habit',
        version: 1,
        seriesLabel: 'CHƯƠNG TRÌNH 01 · HABIT FORMATION',
        title: 'Xây thói quen – Dựng thương hiệu',
        showAccentBar: true,
        emotionLine:
          'Biến kỷ luật thành niềm vui tự nhiên, biến hành động nhỏ thành uy tín cá nhân.',
        takeawayTone: 'butter-cream',
        steps: [
          {
            eyebrow: 'CHẶNG 1',
            title: 'Hiểu vòng lặp',
            chip: 'Workshop 1',
            bullets: [
              'Giải mã cơ chế Gợi ý → Thèm muốn → Đáp ứng → Phần thưởng',
              'Xác định điểm nghẽn khiến bạn hay bỏ cuộc',
              'Thiết kế thói quen vi mô (2 phút) không thể từ chối',
            ],
            takeawayTitle: 'MANG VỀ',
            takeawayText: 'Bản Habit Loop cá nhân hóa cho 1 thói quen then chốt.',
          },
          {
            eyebrow: 'CHẶNG 2',
            title: 'Thực hành 28 ngày',
            chip: 'Đồng hành số',
            bullets: [
              'Đo lường hàng ngày trên Habit Tracker chuyên biệt',
              'Kỹ thuật xếp chồng thói quen vào lịch biểu có sẵn',
              'Áp dụng quy tắc "Không bỏ lỡ 2 ngày liên tiếp"',
            ],
            takeawayTitle: 'MANG VỀ',
            takeawayText: 'Dữ liệu thật 28 ngày chứng minh năng lực duy trì cam kết.',
          },
          {
            eyebrow: 'CHẶNG 3',
            title: 'Dựng thương hiệu',
            chip: 'Workshop 2',
            bullets: [
              'Biến tính kỷ luật thành câu chuyện thương hiệu cá nhân',
              'Đóng gói bài học thực tế thành nội dung chia sẻ có giá trị',
              'Xây dựng uy tín chuyên nghiệp từ sự nhất quán nội tại',
            ],
            takeawayTitle: 'MANG VỀ',
            takeawayText: 'Khung định vị uy tín cá nhân dựa trên sự nhất quán.',
          },
        ],
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },

    // §12. Thương hiệu cá nhân (tr. 12), nền warm-ivory
    {
      type: 'BrandFormula',
      props: {
        id: 'journey-p1-formula',
        version: 1,
        seriesLabel: 'CHƯƠNG TRÌNH 01 · CÁCH HIỂU THƯƠNG HIỆU',
        title: 'Công thức chuyển hóa thói quen thành thương hiệu',
        showAccentBar: true,
        steps: [
          {
            number: '1',
            title: 'NHẤT QUÁN',
            description:
              'Hành động nhỏ lặp lại tạo nên sự tin cậy nội tâm trước khi người khác nhìn thấy.',
          },
          {
            number: '2',
            title: 'BẰNG CHỨNG',
            description:
              'Dữ liệu thật chứng minh năng lực thực thi, thay thế cho lời hứa suông.',
          },
          {
            number: '3',
            title: 'LAN TỎA',
            description:
              'Chia sẻ hành trình chân thực thu hút những cơ hội và đồng minh tự nhiên.',
          },
        ],
        bottomQuoteLeft:
          'Thương hiệu cá nhân không phải là đánh bóng bên ngoài, mà là kết quả tất yếu của sự nhất quán bên trong.',
        planCardEyebrow: 'HABIT PLAN MINH HỌA',
        planCardSubtitle: 'Thiết kế riêng cho phụ nữ bận rộn',
        planCardQuote: '“Tôi không cần hoàn hảo, tôi chỉ cần xuất hiện mỗi ngày.”',
        planItem1Title: 'HÀNH ĐỘNG VI MÔ (5 PHÚT)',
        planItem1Text: 'Viết 3 dòng đúc kết chuyên môn mỗi sáng trước giờ làm việc.',
        planItem2Title: 'KẾT NỐI TÍNH CÁCH',
        planItem2Text: 'Tích lũy 20 bài chia sẻ thực chiến sau 4 tuần, tạo tài sản số đầu tiên.',
        bgColor: 'warm-ivory',
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
        emotionLine:
          'Cảm xúc không phải là kẻ thù cần chế ngự, mà là người bạn chỉ đường cần thấu hiểu.',
        takeawayTone: 'soft-pink',
        steps: [
          {
            eyebrow: 'BƯỚC 1',
            title: 'Tách biệt',
            chip: 'Workshop 1',
            bullets: [
              'Phân tách Sự kiện – Suy nghĩ – Cảm xúc – Phản ứng cơ thể',
              'Nhận diện tiếng nói chỉ trích nội tâm (Inner Critic)',
              'Kỹ thuật hạ nhiệt cơn giông cảm xúc trong 90 giây',
            ],
            takeawayTitle: 'MANG VỀ',
            takeawayText: 'Bộ thẻ sơ đồ tách lớp cảm xúc khi đối mặt áp lực công việc.',
          },
          {
            eyebrow: 'BƯỚC 2',
            title: 'Gọi tên',
            chip: 'Bộ thẻ EQ Buddy',
            bullets: [
              'Mở rộng vốn từ vựng cảm xúc với 26 thẻ EQ Buddy',
              'Chuyển dịch từ phán xét ("tôi tệ") sang tò mò ("tôi đang sợ gì?")',
              'Tìm kiếm thông điệp tích cực ẩn sau nỗi sợ và cơn giận',
            ],
            takeawayTitle: 'MANG VỀ',
            takeawayText: 'Khả năng gọi tên chính xác nhu cầu sâu kín dưới cảm xúc.',
          },
          {
            eyebrow: 'BƯỚC 3',
            title: 'Chuyển hóa',
            chip: 'Workshop 2',
            bullets: [
              'Thiết lập lòng trắc ẩn với chính mình (Self-Compassion)',
              'Chuyển hóa năng lượng tiêu cực thành hành động bảo vệ ranh giới',
              'Xây dựng chiếc neo bình an trong những cuộc họp căng thẳng',
            ],
            takeawayTitle: 'MANG VỀ',
            takeawayText: 'Chiến lược tự vỗ về và tái tạo năng lượng sau khủng hoảng.',
          },
        ],
        bottomStripLeftLabel: 'SỐNG CÙNG CẢM XÚC',
        bottomStripLeftText:
          'Thực hành nhận diện và ghi chép cảm xúc mỗi ngày trên nhật ký EQ Buddy đi kèm.',
        bottomStripRightText: 'Không đè nén · Không bùng nổ · Lắng nghe và hòa giải',
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
        title: 'Năm bước điều hòa cơn giông cảm xúc',
        showAccentBar: true,
        steps: [
          {
            number: '01',
            title: 'DỪNG LẠI (PAUSE)',
            text: 'Ngắt phản xạ tự động, hít thở sâu 3 nhịp để kích hoạt hệ thần kinh phó giao cảm.',
          },
          {
            number: '02',
            title: 'QUAN SÁT (FEEL)',
            text: 'Cảm nhận vị trí cảm xúc đang co thắt trong cơ thể (ngực, cổ họng, dạ dày).',
          },
          {
            number: '03',
            title: 'GỌI TÊN (NAME)',
            text: 'Đặt tên chính xác cảm xúc: lo âu, thất vọng, bất lực hay cô độc.',
          },
          {
            number: '04',
            title: 'CHẤP NHẬN (ALLOW)',
            text: 'Cho phép cảm xúc hiện diện mà không phán xét, tự nhủ "cảm giác này là bình thường".',
          },
          {
            number: '05',
            title: 'CHỌN LỰA (CHOOSE)',
            text: 'Hỏi bản thân: "Hành động nào lúc này tôn trọng cả mình và người khác?"',
          },
        ],
        outputStripLabel: 'ĐẦU RA',
        outputStripText:
          'Một phản ứng điềm tĩnh, sáng suốt thay thế cho cơn bùng nổ hoặc sự rút lui im lặng.',
        bottomQuote:
          'Giữa kích thích và phản ứng có một khoảng trống. Trong khoảng trống đó là tự do lựa chọn của bạn.',
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
        title: 'Giao tiếp hài hòa nam tính – nữ tính',
        showAccentBar: true,
        emotionLine:
          'Sức mạnh không đến từ việc trở nên gay gắt, mà đến từ sự rõ ràng kết hợp với lòng thấu cảm.',
        takeawayTone: 'mint-haze',
        steps: [
          {
            eyebrow: 'BƯỚC 1',
            title: 'Cân bằng hai năng lượng',
            chip: 'Workshop 1',
            subColumns: {
              left: {
                title: 'NĂNG LƯỢNG NAM TÍNH',
                items: [
                  'Rõ ràng về mục tiêu',
                  'Quyết đoán khi ra quyết định',
                  'Bảo vệ ranh giới chuyên môn',
                ],
              },
              right: {
                title: 'NĂNG LƯỢNG NỮ TÍNH',
                items: [
                  'Lắng nghe tầng sâu',
                  'Đồng cảm và nuôi dưỡng',
                  'Linh hoạt thích ứng bối cảnh',
                ],
              },
            },
            takeawayTitle: 'MANG VỀ',
            takeawayText: 'Bản đồ tự đánh giá thiên hướng giao tiếp cá nhân.',
          },
          {
            eyebrow: 'BƯỚC 2',
            title: 'Ứng dụng tình huống',
            chip: 'Thực hành',
            bullets: [
              'Từ chối khéo léo những yêu cầu ngoài phạm vi công việc',
              'Đàm phán thăng tiến, quyền lợi mà không có cảm giác tội lỗi',
              'Đưa phản hồi xây dựng cho cấp dưới và quản lý cấp trên',
            ],
            takeawayTitle: 'MANG VỀ',
            takeawayText: '5 kịch bản giao tiếp mẫu cho tình huống nhạy cảm.',
          },
          {
            eyebrow: 'BƯỚC 3',
            title: 'Xây dựng đồng minh',
            chip: 'Workshop 2',
            bullets: [
              'Nhận diện các bên liên quan trọng yếu trong tổ chức',
              'Tạo dựng kết nối dựa trên giá trị chung chân thành',
              'Biến mâu thuẫn phong cách thành cơ hội hợp tác đa dạng',
            ],
            takeawayTitle: 'MANG VỀ',
            takeawayText: 'Kế hoạch kết nối và xây dựng mạng lưới hỗ trợ nội bộ.',
          },
        ],
        bottomStripLeftLabel: 'SỐNG CÙNG GIAO TIẾP'
        ,
        bottomStripLeftText:
          'Thực hành lên tiếng và áp dụng kịch bản giao tiếp vào ngay các cuộc họp trong tuần.',
        bottomStripRightText: 'Rõ ràng mà không thô bạo · Dịu dàng mà không yếu thế',
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
        title: 'Năm năng lực giao tiếp chuyển đổi',
        showAccentBar: true,
        steps: [
          {
            number: '01',
            title: 'LÊN TIẾNG CÓ TRỌNG LƯỢNG',
            subLines: [
              { label: 'Nam tính', text: 'Cấu trúc thông điệp súc tích, đi thẳng vào giải pháp.' },
              { label: 'Nữ tính', text: 'Giọng điệu ấm áp, thu hút sự chú ý chân thành.' },
            ],
          },
          {
            number: '02',
            title: 'THIẾT LẬP RANH GIỚI',
            subLines: [
              { label: 'Nam tính', text: 'Nói "Không" kiên định, không thanh minh dài dòng.' },
              { label: 'Nữ tính', text: 'Tôn trọng mối quan hệ, mở ra giải pháp thay thế.' },
            ],
          },
          {
            number: '03',
            title: 'PHẢN HỒI NÂNG ĐỠ',
            subLines: [
              { label: 'Nam tính', text: 'Chỉ rõ sự thật khách quan và tiêu chuẩn cần đạt.' },
              { label: 'Nữ tính', text: 'Ghi nhận nỗ lực, nâng đỡ niềm tin của đối phương.' },
            ],
          },
          {
            number: '04',
            title: 'ĐÀM PHÁN GIÁ TRỊ',
            subLines: [
              { label: 'Nam tính', text: 'Nắm vững số liệu và luận điểm thuyết phục.' },
              { label: 'Nữ tính', text: 'Cảm nhận động cơ ngầm của đối tác để cùng thắng.' },
            ],
          },
          {
            number: '05',
            title: 'KẾT NỐI ĐỒNG MINH',
            subLines: [
              { label: 'Nam tính', text: 'Hợp tác dựa trên mục tiêu chiến lược cụ thể.' },
              { label: 'Nữ tính', text: 'Xây dựng lòng tin và sự gắn kết qua sự chân thành.' },
            ],
          },
        ],
        outputStripLabel: 'ĐẦU RA THEO TÌNH HUỐNG',
        outputStripText:
          'Làm chủ nghệ thuật giao tiếp đa chiều: tự tin khi quyết đoán, khéo léo khi gắn kết.',
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
            text: 'Điều gì đã diễn ra trong tuần qua? Dữ liệu trên tracker nói lên điều gì về nhịp sống của bạn?',
            color: 'soft-pink',
          },
          {
            label: 'GỠ NÚT THẮT',
            text: 'Đâu là rào cản khiến bạn lỡ nhịp? Nỗi sợ hay sự kỳ vọng quá mức nào đang cản trở?',
            color: 'mint-haze',
          },
          {
            label: 'HIỆU CHỈNH',
            text: 'Cần điều chỉnh quy mô hành động hay nhịp độ thế nào để vừa vặn hơn với năng lượng thật?',
            color: 'butter-cream',
          },
          {
            label: 'NEO LẠI',
            text: 'Đâu là bài học quý giá nhất cần mang theo sang tuần mới để tiếp tục vững vàng?',
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
        titleLine1: 'NHỊP THỰC HÀNH',
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
            label: 'TUẦN 1',
            cells: [
              {
                title: 'Khởi động vi mô',
                text: 'Chọn 1 hành động 2 phút, thực hành đều đặn mỗi sáng.',
              },
              {
                title: 'Nhận diện cơ thể',
                text: 'Để ý vị trí căng thẳng trên cơ thể khi có áp lực.',
              },
              {
                title: 'Quan sát phong cách',
                text: 'Để ý phản xạ im lặng hay bùng nổ khi bất đồng.',
              },
            ],
          },
          {
            label: 'TUẦN 2',
            cells: [
              {
                title: 'Xếp chồng thói quen',
                text: 'Gắn thói quen mới vào lịch trình sẵn có mỗi ngày.',
              },
              {
                title: 'Gọi tên cảm xúc',
                text: 'Sử dụng bộ thẻ EQ Buddy để đặt tên chính xác trạng thái.',
              },
              {
                title: 'Thiết lập ranh giới',
                text: 'Nói lời từ chối khéo léo với một đầu việc ngoài phạm vi.',
              },
            ],
          },
          {
            label: 'TUẦN 3',
            cells: [
              {
                title: 'Vượt điểm nghẽn',
                text: 'Áp dụng quy tắc "Không bỏ lỡ 2 ngày" khi gặp sự cố.',
              },
              {
                title: 'Tập thương chính mình',
                text: 'Hạ giọng chỉ trích nội tâm, viết lời vỗ về bản thân.',
              },
              {
                title: 'Lên tiếng rõ ràng',
                text: 'Đóng góp 1 ý kiến sắc bén trong cuộc họp chuyên môn.',
              },
            ],
          },
          {
            label: 'TUẦN 4',
            cells: [
              {
                title: 'Đóng gói uy tín',
                text: 'Tổng kết dữ liệu tracker, đúc kết bài học về sự nhất quán.',
              },
              {
                title: 'Neo giữ bình an',
                text: 'Thiết lập phản xạ bình tĩnh trước tình huống bất ngờ.',
              },
              {
                title: 'Kết nối đồng minh',
                text: 'Chủ động hẹn trò chuyện chia sẻ giá trị với 1 đồng nghiệp.',
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
                title: 'Hệ thống thói quen cá nhân',
                text: 'Duy trì được ít nhất 1 thói quen cốt lõi ngay trong guồng bận rộn.',
              },
              {
                title: 'Dữ liệu minh chứng',
                text: '28 ngày check-in chứng minh năng lực giữ cam kết với chính mình.',
              },
              {
                title: 'Nền tảng thương hiệu',
                text: 'Sự tự tin nội tại xuất phát từ hành động thực chất, không màu mè.',
              },
            ],
          },
          {
            tone: 'soft-pink',
            label: '02 · CẢM XÚC',
            hasAccentBar: true,
            items: [
              {
                title: 'Vốn từ cảm xúc sâu sắc',
                text: 'Khả năng gọi tên và tách lớp cảm xúc phức tạp một cách điềm tĩnh.',
              },
              {
                title: 'Quy trình 5 bước tự vỗ về',
                text: 'Hạ nhiệt cơn giông cảm xúc trong 90 giây mà không cần kìm nén.',
              },
              {
                title: 'Sự bao dung với chính mình',
                text: 'Giảm bớt tự phán xét, đón nhận những bất toàn như một phần tất yếu.',
              },
            ],
          },
          {
            tone: 'mint-haze',
            label: '03 · GIAO TIẾP',
            hasAccentBar: true,
            items: [
              {
                title: 'Bộ kịch bản ứng xử linh hoạt',
                text: 'Sẵn sàng lên tiếng, từ chối và phản hồi trong các tình huống khó.',
              },
              {
                title: 'Năng lượng giao tiếp hài hòa',
                text: 'Cân bằng giữa sự rõ ràng, quyết đoán với lòng trắc ẩn, thấu hiểu.',
              },
              {
                title: 'Mạng lưới đồng minh vững vàng',
                text: 'Xây dựng được kết nối tin cậy và sự ủng hộ chân thành từ đồng nghiệp.',
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
        phase1Title: 'Bệ phóng vững chắc',
        phase1Items: [
          {
            tone: 'butter-cream',
            title: '01 · BỀN BỈ HÀNH ĐỘNG',
            text: 'Năng lực tạo ra kết quả nhất quán mà không bị kiệt sức',
          },
          {
            tone: 'soft-pink',
            title: '02 · VỮNG CHÃI NỘI TÂM',
            text: 'Tâm thế bình an trước những biến động và bất định nghề nghiệp',
          },
          {
            tone: 'mint-haze',
            title: '03 · HÀI HÒA KẾT NỐI',
            text: 'Mối quan hệ chất lượng và sự ủng hộ mạnh mẽ từ xung quanh',
          },
        ],
        phase2Label: 'PHASE 2 · ĐỊNH HƯỚNG',
        phase2Title: 'Career Clarity',
        phase2Subtitle: 'Thông suốt sự nghiệp',
        phase2Text:
          'Khai vấn định hướng chuyên sâu giúp bạn chọn đúng ngã rẽ, định vị thương hiệu sắc bén và thiết kế chiến lược nghề nghiệp bứt phá.',
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
        titleLine1: '[MẪU] Bắt đầu hành trình chuyển mình của bạn',
        titleLine2: '',
        description:
          'Đăng ký phiên trải nghiệm để khám phá lộ trình phù hợp nhất với giai đoạn sự nghiệp hiện tại của bạn.',
        primaryButtonText: 'Đăng ký tư vấn 1:1',
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
