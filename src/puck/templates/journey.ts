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
      type: 'SectionHeader',
      props: {
        id: 'journey-story-header',
        version: 2,
        seriesLabel: '01 · CÂU CHUYỆN KHÔNG CỦA RIÊNG AI',
        titleLine1: 'Chuyển mình là hành trình khó khăn bạn luôn cần đi qua để trưởng thành.',
        titleLine2: '',
        emotionLine: 'Nhưng bạn hoàn toàn có thể đi qua nó mà KHÔNG CHÊNH VÊNH.',
        align: 'left',
        bgColor: 'lavender-mist',
        padding: 'md',
      },
    },
    {
      type: 'RichText',
      props: {
        id: 'journey-story-desc',
        version: 1,
        content:
          'Chương trình đồng hành cùng phụ nữ công sở xây ba nền tảng — hành động bền bỉ, cảm xúc vững vàng, giao tiếp hài hòa — để mỗi bước chuyển trong sự nghiệp được đi trên một nền đủ vững và bình an hơn trong nội tâm.',
        align: 'left',
        textColor: 'deep-navy',
        textSize: 'md',
        bgColor: 'lavender-mist',
        padding: 'sm',
      },
    },

    // §3. Bối cảnh & chân dung (tr. 3)
    {
      type: 'SectionHeader',
      props: {
        id: 'journey-context-header',
        version: 2,
        seriesLabel: '02 · BỐI CẢNH & CHÂN DUNG',
        titleLine1: 'Phụ nữ thời đại AI đứng trước một bước chuyển mình lớn',
        titleLine2: '',
        align: 'left',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'Columns',
      props: {
        id: 'journey-context-cols',
        version: 1,
        numColumns: '2',
        gap: 'lg',
        bgColor: 'warm-ivory',
        padding: 'sm',
        col1: [
          {
            type: 'StatsBar',
            props: {
              id: 'journey-context-stats',
              version: 3,
              columns: 2,
              stats: [
                {
                  type: 'Stat',
                  props: {
                    id: 'stat-wef',
                    value: '39%',
                    label:
                      'kỹ năng cốt lõi của người lao động được dự báo sẽ thay đổi đến năm 2030.',
                    description: '',
                    icon: '',
                    valueColor: 'bright-magenta',
                    valueSize: 'md',
                    labelColor: 'deep-navy',
                    labelSize: 'md',
                    align: 'left',
                  },
                },
                {
                  type: 'Stat',
                  props: {
                    id: 'stat-ilo',
                    value: '3X',
                    label:
                      'Ở các nước thu nhập cao, việc làm của nữ có nguy cơ bị AI tự động hóa cao nhất chiếm 9,6% — gần gấp ba nam giới.',
                    description: '',
                    icon: '',
                    valueColor: 'bright-magenta',
                    valueSize: 'md',
                    labelColor: 'deep-navy',
                    labelSize: 'md',
                    align: 'left',
                  },
                },
              ],
              bgColor: 'warm-ivory',
              padding: 'none',
            },
          },
          {
            type: 'QuoteBlock',
            props: {
              id: 'journey-context-quote',
              version: 2,
              quote: 'Luật chơi đang đổi — và phụ nữ công sở chịu sức ép thích nghi lớn hơn.',
              author: '',
              role: '',
              variant: 'minimal',
              quoteColor: 'deep-navy',
              bgColor: 'warm-ivory',
              padding: 'sm',
            },
          },
        ],
        col2: [
          {
            type: 'Card',
            props: {
              icon: 'none',
              id: 'journey-persona-card',
              version: 1,
              cardBg: 'lavender-mist',
              eyebrow: 'CÔ ẤY LÀ AI',
              title:
                '“Mình có năng lực, có kinh nghiệm — nhưng chưa đủ tự tin để thể hiện mình và luôn sợ bị đào thải.”',
              text: '- Giỏi chuyên môn, nhưng nhiều việc quen tay giờ AI làm nhanh hơn\n- Biết mình cần đổi, chưa rõ đổi theo hướng nào\n- Vừa giữ việc, vừa lo gia đình, vừa phải học lại\n- Luôn trong trạng thái "overthinking"',
              bgColor: 'lavender-mist',
              padding: 'md',
            },
          },
        ],
      },
    },
    {
      type: 'RichText',
      props: {
        id: 'journey-context-source',
        version: 1,
        content:
          'Nguồn: WEF, Future of Jobs Report 2025 · ILO–NASK, chỉ số tác động của GenAI tới việc làm, 2025',
        align: 'left',
        textColor: 'deep-navy',
        textSize: 'sm',
        bgColor: 'warm-ivory',
        padding: 'sm',
      },
    },

    // §4. Nỗi đau (tr. 4)
    {
      type: 'IconCardGrid',
      props: {
        id: 'journey-painpoints-grid',
        version: 2,
        seriesLabel: '03 · NỖI ĐAU',
        titleLine1: 'Ba kiểu chênh vênh khi AI đổi luật chơi',
        titleLine2: '',
        columns: 3,
        bgColor: 'warm-ivory',
        padding: 'md',
        cards: [
          {
            id: 'pain-action',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'pain-card-action',
              version: 1,
              cardBg: 'butter-cream',
              eyebrow: 'TRONG HÀNH ĐỘNG',
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
          },
          {
            id: 'pain-emotion',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'pain-card-emotion',
              version: 1,
              cardBg: 'soft-pink',
              eyebrow: 'TRONG CẢM XÚC',
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
          },
          {
            id: 'pain-comm',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'pain-card-comm',
              version: 1,
              cardBg: 'mint-haze',
              eyebrow: 'TRONG GIAO TIẾP',
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
          },
        ],
      },
    },
    {
      type: 'QuoteBlock',
      props: {
        id: 'journey-pain-root-quote',
        version: 2,
        quote: 'Gốc chung: luật chơi đổi nhanh hơn NỘI LỰC bên trong mỗi chúng ta.',
        author: '',
        role: '',
        variant: 'minimal',
        quoteColor: 'deep-navy',
        bgColor: 'warm-ivory',
        padding: 'sm',
      },
    },

    // §5. Mong muốn thật sự (tr. 5)
    {
      type: 'SectionHeader',
      props: {
        id: 'journey-desire-header',
        version: 2,
        seriesLabel: '04 · MONG MUỐN THẬT SỰ',
        titleLine1: 'Bước tiếp cùng AI, mà vẫn là chính mình',
        titleLine2: '',
        align: 'left',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'QuoteBlock',
      props: {
        id: 'journey-desire-quote',
        version: 2,
        quote: 'Mình muốn thay đổi — nhưng không muốn đánh mất sự bình an và chính mình.',
        author: '',
        role: '',
        variant: 'minimal',
        quoteColor: 'deep-navy',
        bgColor: 'warm-ivory',
        padding: 'sm',
      },
    },
    {
      type: 'IconCardGrid',
      props: {
        id: 'journey-desire-grid',
        version: 2,
        columns: 4,
        bgColor: 'warm-ivory',
        padding: 'sm',
        cards: [
          {
            id: 'desire-p1',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'desire-card-p1',
              version: 1,
              cardBg: 'butter-cream',
              eyebrow: 'Chương trình 01',
              title: 'Bền bỉ với mình',
              text: 'Học và thích nghi đều đặn bằng những hành động nhỏ, bền bỉ.',
            },
          },
          {
            id: 'desire-p2',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'desire-card-p2',
              version: 1,
              cardBg: 'soft-pink',
              eyebrow: 'Chương trình 02',
              title: 'Vững chãi từ bên trong',
              text: 'Bình an trước thay đổi, không bị nỗi lo đào thải dẫn dắt.',
            },
          },
          {
            id: 'desire-p3',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'desire-card-p3',
              version: 1,
              cardBg: 'mint-haze',
              eyebrow: 'Chương trình 03',
              title: 'Hài hòa với người',
              text: 'Lắng nghe, thuyết phục, kết nối — điều AI khó làm thay.',
            },
          },
          {
            id: 'desire-p4',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'desire-card-p4',
              version: 1,
              cardBg: 'deep-navy',
              eyebrow: 'Phase 2',
              title: 'Vững vàng với nghề',
              text: 'Rõ thế mạnh, giá trị và hướng đi tiếp theo trong sự nghiệp.',
            },
          },
        ],
      },
    },
    {
      type: 'Callout',
      props: {
        id: 'journey-trend-callout',
        version: 1,
        variant: 'strip',
        stripTone: 'white',
        title: 'XU HƯỚNG ĐẾN 2030',
        description:
          'Bên cạnh AI, sự bền bỉ, linh hoạt, tò mò và học suốt đời là những kỹ năng đang tăng tầm quan trọng. — WEF, Future of Jobs 2025',
        bgColor: 'warm-ivory',
        padding: 'sm',
      },
    },

    // §6. Kiến trúc chương trình (tr. 6)
    {
      type: 'SectionHeader',
      props: {
        id: 'journey-arch-header',
        version: 2,
        seriesLabel: '05 · KIẾN TRÚC CHƯƠNG TRÌNH',
        titleLine1: 'Hai phase: xây nền trước, định hướng sau',
        titleLine2: '',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'Columns',
      props: {
        id: 'journey-arch-cols',
        version: 1,
        numColumns: '2',
        gap: 'lg',
        bgColor: 'warm-ivory',
        padding: 'sm',
        col1: [
          {
            type: 'Card',
            props: {
              icon: 'none',
              id: 'arch-phase1-card',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: 'PHASE 1 · HÔM NAY',
              title: 'Nền tảng chuyển mình',
              items: [
                {
                  title: '01 · Xây thói quen – Dựng thương hiệu',
                  text: 'Bền bỉ trong hành động · Tự tin với mình',
                },
                {
                  title: '02 · Tập thương cảm xúc',
                  text: 'Vững chãi từ bên trong',
                },
                {
                  title: '03 · Giao tiếp hài hòa nam tính – nữ tính',
                  text: 'Hài hòa với người',
                },
              ],
            },
          },
        ],
        col2: [
          {
            type: 'Card',
            props: {
              icon: 'none',
              id: 'arch-phase2-card',
              version: 1,
              cardBg: 'deep-navy',
              eyebrow: 'PHASE 2 · TIẾP THEO',
              title: 'Career Clarity',
              subtitle: 'Thông suốt sự nghiệp · Vững vàng với nghề',
              text: 'Hiểu mình rõ hơn, nhận ra thế mạnh và định hướng rõ bước tiếp theo trong sự nghiệp.',
              chip: 'Thông qua lộ trình Hướng nghiệp và Khai vấn 1:1',
            },
          },
        ],
      },
    },
    {
      type: 'Callout',
      props: {
        id: 'journey-why-career-clarity',
        version: 1,
        variant: 'strip',
        stripTone: 'soft-pink',
        title: 'VÌ SAO CAREER CLARITY ĐI SAU',
        description:
          'Khi đã có nhịp hành động, nền cảm xúc vững và cách giao tiếp hài hòa, lựa chọn nghề nghiệp mới đủ rõ để bước và đủ bền để đi tiếp.',
        bgColor: 'warm-ivory',
        padding: 'sm',
      },
    },

    // §7. Nguyên lý thiết kế (tr. 7)
    {
      type: 'SectionHeader',
      props: {
        id: 'journey-principles-header',
        version: 2,
        seriesLabel: '06 · NGUYÊN LÝ THIẾT KẾ',
        titleLine1: 'Một vòng lặp cho mọi kỹ năng',
        titleLine2: '',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'Columns',
      props: {
        id: 'journey-loop-cols',
        version: 1,
        numColumns: '2',
        gap: 'lg',
        bgColor: 'warm-ivory',
        padding: 'sm',
        col1: [
          {
            type: 'LoopDiagram',
            props: {
              id: 'journey-loop-diagram',
              version: 1,
              seriesLabel: '',
              titleLine1: '',
              titleLine2: '',
              emotionLine: '',
              centerText: 'Hiểu mình và tự tin hơn qua từng trải nghiệm',
              nodes: [
                { label: '01 · Nhận diện vấn đề' },
                { label: '02 · Hiểu rõ phương pháp' },
                { label: '03 · Hướng dẫn' },
                { label: '04 · Thử nghiệm' },
                { label: '05 · Nhìn lại' },
                { label: '06 · Đúc kết' },
              ],
              bgColor: 'warm-ivory',
              padding: 'sm',
            },
          },
        ],
        col2: [
          {
            type: 'Card',
            props: {
              icon: 'none',
              id: 'journey-loop-details',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: 'VÒNG LẶP TRONG CÁCH TRIỂN KHAI',
              items: [
                {
                  title: 'Workshop',
                  text: 'Nhận diện vấn đề của mình, hiểu rõ phương pháp và được hướng dẫn cách làm.',
                },
                {
                  title: '28 ngày',
                  text: 'Thử nghiệm trong đời sống thật, theo nhịp của riêng mình.',
                },
                {
                  title: 'Reflection',
                  text: 'Nhìn lại và đúc kết điều thật sự hợp với mình.',
                },
              ],
            },
          },
        ],
      },
    },
    {
      type: 'QuoteBlock',
      props: {
        id: 'journey-loop-quote',
        version: 2,
        quote:
          'Mỗi vòng quay là một lần kỹ năng bám rễ sâu hơn, cho đến khi nó trở thành thói quen.',
        author: '',
        role: '',
        variant: 'minimal',
        quoteColor: 'deep-navy',
        bgColor: 'warm-ivory',
        padding: 'sm',
      },
    },

    // §8. Nền tảng phương pháp (tr. 8)
    {
      type: 'IconCardGrid',
      props: {
        id: 'journey-method-grid',
        version: 2,
        seriesLabel: '07 · NỀN TẢNG PHƯƠNG PHÁP',
        titleLine1: 'Bốn nền tảng phương pháp của chương trình',
        titleLine2: '',
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
      },
    },
    {
      type: 'QuoteBlock',
      props: {
        id: 'journey-method-quote',
        version: 2,
        quote: 'Mỗi lần nhìn lại là một lần thấy mình rõ hơn — và bớt chênh vênh hơn.',
        author: '',
        role: '',
        variant: 'minimal',
        quoteColor: 'deep-navy',
        bgColor: 'warm-ivory',
        padding: 'sm',
      },
    },

    // §9. Mô hình tổng thể (tr. 9)
    {
      type: 'SectionHeader',
      props: {
        id: 'journey-model-header',
        version: 2,
        seriesLabel: '08 · MÔ HÌNH TỔNG THỂ',
        titleLine1: 'Một nền tảng chung, ba trụ cột chuyển mình',
        titleLine2: '',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'Callout',
      props: {
        id: 'journey-common-foundation',
        version: 1,
        variant: 'strip',
        stripTone: 'lavender-mist',
        title: 'NỀN TẢNG CHUNG',
        description:
          'Dành cho phụ nữ công sở · Học qua trải nghiệm thật · Cam kết vừa sức · Tôn trọng mức chia sẻ',
        bgColor: 'warm-ivory',
        padding: 'sm',
      },
    },
    {
      type: 'IconCardGrid',
      props: {
        id: 'journey-three-pillars-grid',
        version: 2,
        columns: 3,
        bgColor: 'warm-ivory',
        padding: 'sm',
        cards: [
          {
            id: 'pillar-1',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'pillar-c1',
              version: 1,
              cardBg: 'butter-cream',
              eyebrow: 'TRỤ CỘT 01',
              title: 'Xây thói quen – Dựng thương hiệu',
              subtitle: 'Bền bỉ trong hành động',
              chip: 'HIỂU → THỬ → SỐNG',
            },
          },
          {
            id: 'pillar-2',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'pillar-c2',
              version: 1,
              cardBg: 'soft-pink',
              eyebrow: 'TRỤ CỘT 02',
              title: 'Tập thương cảm xúc',
              subtitle: 'Vững chãi từ bên trong',
              chip: 'HIỂU → GỌI TÊN → ĐÓN NHẬN & ĐIỀU HÒA',
            },
          },
          {
            id: 'pillar-3',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'pillar-c3',
              version: 1,
              cardBg: 'mint-haze',
              eyebrow: 'TRỤ CỘT 03',
              title: 'Giao tiếp hài hòa nam tính – nữ tính',
              subtitle: 'Hài hòa với người',
              chip: 'HIỂU → CÂN BẰNG → THỂ HIỆN',
            },
          },
        ],
      },
    },
    {
      type: 'Callout',
      props: {
        id: 'journey-delivery-rhythm',
        version: 1,
        variant: 'strip',
        stripTone: 'dashed',
        title: 'NHỊP ĐIỆU TRIỂN KHAI',
        description: '2 workshop · 28 ngày · 4 lần nhìn lại — giữ thay đổi ở lại sau buổi học',
        bgColor: 'warm-ivory',
        padding: 'sm',
      },
    },
    {
      type: 'Callout',
      props: {
        id: 'journey-phase2-ready',
        version: 1,
        variant: 'strip',
        stripTone: 'deep-navy',
        title: 'SẴN SÀNG CHO GIAI ĐOẠN 2',
        description:
          'Career Clarity – Thông suốt sự nghiệp · định hướng bước tiếp theo trên nền đã vững',
        bgColor: 'warm-ivory',
        padding: 'sm',
      },
    },

    // §10. Cách triển khai (tr. 10)
    {
      type: 'SectionHeader',
      props: {
        id: 'journey-delivery-header',
        version: 2,
        seriesLabel: '09 · CÁCH TRIỂN KHAI',
        titleLine1: 'HÀNH TRÌNH CHUYỂN HÓA',
        titleLine2: '',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'StatsBar',
      props: {
        id: 'journey-delivery-numbers',
        version: 3,
        columns: 3,
        stats: [
          {
            type: 'Stat',
            props: {
              id: 'deliv-s1',
              value: '2',
              label: 'Workshop online · 90 phút/buổi, diễn ra trước ngày 1',
              description: '',
              icon: '',
              valueColor: 'bright-magenta',
              valueSize: 'md',
              labelColor: 'deep-navy',
              labelSize: 'md',
              align: 'center',
            },
          },
          {
            type: 'Stat',
            props: {
              id: 'deliv-s2',
              value: '28',
              label: 'Ngày thực hành · Theo kế hoạch cá nhân, nhịp của riêng mình',
              description: '',
              icon: '',
              valueColor: 'bright-magenta',
              valueSize: 'md',
              labelColor: 'deep-navy',
              labelSize: 'md',
              align: 'center',
            },
          },
          {
            type: 'Stat',
            props: {
              id: 'deliv-s3',
              value: '4',
              label: 'Lần reflection · Hằng tuần, đề xuất 60 phút/buổi',
              description: '',
              icon: '',
              valueColor: 'bright-magenta',
              valueSize: 'md',
              labelColor: 'deep-navy',
              labelSize: 'md',
              align: 'center',
            },
          },
        ],
        bgColor: 'warm-ivory',
        padding: 'sm',
      },
    },
    {
      type: 'Columns',
      props: {
        id: 'journey-timeline-cols',
        version: 1,
        numColumns: '2',
        gap: 'lg',
        bgColor: 'warm-ivory',
        padding: 'sm',
        col1: [
          {
            type: 'Card',
            props: {
              icon: 'none',
              id: 'timeline-pre-card',
              version: 1,
              cardBg: 'lavender-mist',
              eyebrow: 'TRƯỚC NGÀY 1',
              items: [
                { title: 'Workshop 1', text: '90 phút · online' },
                { title: 'Workshop 2', text: '90 phút · online' },
              ],
            },
          },
        ],
        col2: [
          {
            type: 'Card',
            props: {
              icon: 'none',
              id: 'timeline-practice-card',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: '28 NGÀY THỰC HÀNH CÓ ĐỒNG HÀNH',
              eyebrowBar: true,
              items: [
                { title: 'Tuần 1', text: 'Reflection ngày 7' },
                { title: 'Tuần 2', text: 'Reflection ngày 14' },
                { title: 'Tuần 3', text: 'Reflection ngày 21' },
                { title: 'Tuần 4', text: 'Ngày 28 · tổng kết' },
              ],
            },
          },
        ],
      },
    },

    // §11. Chương trình 01 (tr. 11), nền butter-cream
    {
      type: 'SectionHeader',
      props: {
        id: 'p1-habit-header',
        version: 2,
        seriesLabel: 'CHƯƠNG TRÌNH 01 · HABIT FORMATION',
        titleLine1: 'Xây thói quen - Dựng thương hiệu',
        titleLine2: '',
        emotionLine: 'Sống điều mình muốn được biết đến · lộ trình HIỂU – THỬ – SỐNG',
        bgColor: 'butter-cream',
        padding: 'md',
      },
    },
    {
      type: 'IconCardGrid',
      props: {
        id: 'p1-habit-grid',
        version: 2,
        columns: 3,
        bgColor: 'butter-cream',
        padding: 'sm',
        cards: [
          {
            id: 'habit-c1',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'habit-card-1',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: 'CHẶNG 1 · HIỂU',
              title: 'Workshop 1 · 90 phút',
              subtitle: 'Habit Loop & bốn quy luật',
              text: '- Tín hiệu → làm cho rõ ràng\n- Khao khát → làm cho hấp dẫn\n- Hành động → làm cho dễ dàng\n- Phần thưởng → làm cho thỏa mãn',
              note: {
                title: 'Mang về',
                text: 'Hiểu cách thói quen vận hành và hướng dẫn tự trải nghiệm xây dựng thói quen',
                tone: 'butter-cream',
              },
            },
          },
          {
            id: 'habit-c2',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'habit-card-2',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: 'CHẶNG 2 · THỬ',
              title: 'Workshop 2 · 90 phút',
              subtitle: 'NAME – MATCH – ACT – REFINE',
              text: '- Gọi tên hành vi, mức tối thiểu\n- Chọn công cụ hợp điểm kẹt\n- Điền Habit Plan, làm thử\n- Chỉnh khi bận hoặc mệt',
              note: {
                title: 'Mang về',
                text: 'Bản Habit Plan và công cụ theo dõi trong 28 ngày',
                tone: 'butter-cream',
              },
            },
          },
          {
            id: 'habit-c3',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'habit-card-3',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: 'CHẶNG 3 · SỐNG',
              title: '28 ngày + 4 reflection',
              subtitle: 'Thực hành có đồng hành',
              text: '- Tuần 1: bắt đầu, quan sát\n- Tuần 2: chỉnh cho hợp mình\n- Tuần 3: giữ nhịp, quay lại\n- Tuần 4: nhận diện giá trị',
              note: {
                title: 'Mang về',
                text: 'Một thói quen của riêng mình và cách tiếp nối',
                tone: 'butter-cream',
              },
            },
          },
        ],
      },
    },

    // §12. Thương hiệu cá nhân (tr. 12), nền butter-cream
    {
      type: 'SectionHeader',
      props: {
        id: 'p1-brand-header',
        version: 2,
        seriesLabel: 'CHƯƠNG TRÌNH 01 · CÁCH HIỂU THƯƠNG HIỆU',
        titleLine1: 'Thương hiệu cá nhân bắt đầu từ giá trị thật',
        titleLine2: '',
        bgColor: 'butter-cream',
        padding: 'md',
      },
    },
    {
      type: 'Columns',
      props: {
        id: 'p1-brand-cols',
        version: 1,
        numColumns: '2',
        gap: 'lg',
        bgColor: 'butter-cream',
        padding: 'sm',
        col1: [
          {
            type: 'Card',
            props: {
              icon: 'none',
              id: 'brand-three-points',
              version: 1,
              cardBg: 'warm-ivory',
              items: [
                {
                  title: '1 · Điều mình đại diện',
                  text: 'Phẩm chất và năng lực mình muốn tiếp tục nuôi dưỡng.',
                },
                {
                  title: '2 · Giá trị mình tạo ra',
                  text: 'Một nhóm người cụ thể nhận được điều hữu ích từ mình.',
                },
                {
                  title: '3 · Minh chứng họ nhìn thấy',
                  text: 'Cách làm việc, sản phẩm hoặc trải nghiệm có thể chia sẻ.',
                },
              ],
              note: {
                title: '',
                text: 'Thói quen là cầu nối: biến lời giới thiệu thành điều người khác trải nghiệm được.',
                tone: 'butter-cream',
              },
            },
          },
        ],
        col2: [
          {
            type: 'Card',
            props: {
              icon: 'none',
              id: 'brand-habit-sample',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: 'HABIT PLAN MINH HỌA',
              title: 'Mong muốn: chia sẻ kinh nghiệm nghề nghiệp có ích cho người mới',
              subtitle:
                '“Sau khi đóng máy làm việc vào thứ Ba và thứ Sáu, mình dành 5 phút ghi lại một tình huống và một bài học.”',
              items: [
                {
                  title: 'Ngày ít năng lượng',
                  text: 'Ghi một câu để giữ lại ý chính.',
                },
                {
                  title: 'Nếu bỏ lỡ',
                  text: 'Quay lại ở buổi kế tiếp đã lên lịch và xem điều gì cần đổi.',
                },
              ],
            },
          },
        ],
      },
    },

    // §13. Chương trình 02 (tr. 13), nền soft-pink
    {
      type: 'SectionHeader',
      props: {
        id: 'p2-eq-header',
        version: 2,
        seriesLabel: 'CHƯƠNG TRÌNH 02 · EQ DEVELOPMENT',
        titleLine1: 'Tập thương cảm xúc',
        titleLine2: '',
        emotionLine: 'Vững chãi từ bên trong · lộ trình HIỂU – GỌI TÊN – ĐÓN NHẬN & ĐIỀU HÒA',
        bgColor: 'soft-pink',
        padding: 'md',
      },
    },
    {
      type: 'IconCardGrid',
      props: {
        id: 'p2-eq-grid',
        version: 2,
        columns: 3,
        bgColor: 'soft-pink',
        padding: 'sm',
        cards: [
          {
            id: 'eq-c1',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'eq-card-1',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: 'BƯỚC 1 · HIỂU',
              title: 'Emotional Literacy',
              chip: 'Workshop 1',
              text: 'Tách bạch tình huống, cách diễn giải, tín hiệu cơ thể, cảm xúc, nhu cầu và phản ứng.',
              note: {
                title: 'Mang về',
                text: 'Hiểu tín hiệu cảm xúc của chính mình',
                tone: 'soft-pink',
              },
            },
          },
          {
            id: 'eq-c2',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'eq-card-2',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: 'BƯỚC 2 · GỌI TÊN',
              title: 'Visual EQ',
              chip: 'Workshop 1',
              text: '- Chọn một màu, hình, biểu tượng\n- Gắn tên cụ thể hơn “ổn”\n- Kết nối với thời điểm, cơ thể\n- Tự chọn giữ riêng hay chia sẻ',
              note: {
                title: 'Mang về',
                text: 'Visual Emotion Map của riêng mình',
                tone: 'soft-pink',
              },
            },
          },
          {
            id: 'eq-c3',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'eq-card-3',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: 'BƯỚC 3 · ĐÓN NHẬN & ĐIỀU HÒA',
              title: 'Regulation Toolkit',
              chip: 'Workshop 2',
              text: 'Phân biệt đón nhận với kìm nén, né tránh hay bốc đồng; thử vài cách làm dịu vừa sức.',
              note: {
                title: 'Mang về',
                text: 'Emotional First-Aid Plan cá nhân',
                tone: 'soft-pink',
              },
            },
          },
        ],
      },
    },
    {
      type: 'Callout',
      props: {
        id: 'p2-live-eq',
        version: 1,
        variant: 'strip',
        stripTone: 'white',
        title: 'SỐNG CÙNG CẢM XÚC',
        description: '28 ngày + 4 reflection → nhật ký quan sát và cách tiếp nối',
        bgColor: 'soft-pink',
        padding: 'sm',
      },
    },
    {
      type: 'Callout',
      props: {
        id: 'p2-disclaimer',
        version: 1,
        variant: 'strip',
        stripTone: 'dashed',
        title: '',
        description: 'Giáo dục năng lực cảm xúc, không thay thế trị liệu tâm lý',
        bgColor: 'soft-pink',
        padding: 'sm',
      },
    },

    // §14. Bộ công cụ điều hòa (tr. 14), nền soft-pink
    {
      type: 'SectionHeader',
      props: {
        id: 'p2-regulation-header',
        version: 2,
        seriesLabel: 'CHƯƠNG TRÌNH 02 · BỘ CÔNG CỤ ĐIỀU HÒA',
        titleLine1: 'Năm bước đi qua một cơn dông cảm xúc',
        titleLine2: '',
        bgColor: 'soft-pink',
        padding: 'md',
      },
    },
    {
      type: 'IconCardGrid',
      props: {
        id: 'p2-regulation-grid',
        version: 2,
        columns: 5,
        connector: 'arrow',
        bgColor: 'soft-pink',
        padding: 'sm',
        cards: [
          {
            id: 'reg-c1',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'reg-card-1',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: '01',
              title: 'DỪNG',
              text: 'Nhận ra mình đang bị cuốn vào phản ứng; tạm dừng nếu an toàn.',
            },
          },
          {
            id: 'reg-c2',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'reg-card-2',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: '02',
              title: 'NHẬN DIỆN',
              text: 'Gọi tên cảm xúc, tín hiệu cơ thể và nhu cầu cần được chú ý.',
            },
          },
          {
            id: 'reg-c3',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'reg-card-3',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: '03',
              title: 'ĐIỀU HÒA',
              text: 'Thử một cách làm dịu: thở tự nhiên, grounding, uống nước, đi bộ.',
            },
          },
          {
            id: 'reg-c4',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'reg-card-4',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: '04',
              title: 'LỰA CHỌN',
              text: 'Cân nhắc cách nói, hành động hoặc xin hỗ trợ trước khi phản hồi.',
            },
          },
          {
            id: 'reg-c5',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'reg-card-5',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: '05',
              title: 'QUAY LẠI',
              text: 'Nhìn lại điều hiệu quả, không phán xét mình vì từng mất bình tĩnh.',
            },
          },
        ],
      },
    },
    {
      type: 'Callout',
      props: {
        id: 'p2-reg-output',
        version: 1,
        variant: 'strip',
        stripTone: 'white',
        title: 'ĐẦU RA',
        description:
          '**Emotional First-Aid Plan** — kế hoạch vừa sức cho một tình huống quen thuộc, ví dụ khi nhận một phản hồi khiến mình muốn trả lời ngay.',
        bgColor: 'soft-pink',
        padding: 'sm',
      },
    },
    {
      type: 'QuoteBlock',
      props: {
        id: 'p2-reg-quote',
        version: 2,
        quote: 'Vững vàng không phải là không có cơn dông.',
        author: '',
        role: '',
        variant: 'minimal',
        quoteColor: 'deep-navy',
        bgColor: 'soft-pink',
        padding: 'sm',
      },
    },

    // §15. Chương trình 03 (tr. 15), nền mint-haze
    {
      type: 'SectionHeader',
      props: {
        id: 'p3-comm-header',
        version: 2,
        seriesLabel: 'CHƯƠNG TRÌNH 03 · COMMUNICATION',
        titleLine1: 'Giao tiếp hài hòa tính nam - tính nữ',
        titleLine2: '',
        emotionLine: 'Hài hòa với người · lộ trình HIỂU – CÂN BẰNG – THỂ HIỆN',
        bgColor: 'mint-haze',
        padding: 'md',
      },
    },
    {
      type: 'IconCardGrid',
      props: {
        id: 'p3-comm-grid',
        version: 2,
        columns: 3,
        bgColor: 'mint-haze',
        padding: 'sm',
        cards: [
          {
            id: 'comm-c1',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'comm-card-1',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: 'BƯỚC 1 · HIỂU',
              title: 'Hai năng lượng',
              chip: 'Workshop 1',
              itemsColumns: 2,
              items: [
                {
                  title: 'Nam tính',
                  text: 'Rõ ràng, Quyết đoán, Ranh giới, Hướng mục tiêu',
                },
                {
                  title: 'Nữ tính',
                  text: 'Lắng nghe, Thấu cảm, Kết nối, Linh hoạt',
                },
              ],
              note: {
                title: 'Mang về',
                text: 'Mình đang nghiêng về năng lượng nào, khi nào',
                tone: 'mint-haze',
              },
            },
          },
          {
            id: 'comm-c2',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'comm-card-2',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: 'BƯỚC 2 · CÂN BẰNG',
              title: 'Chọn theo ngữ cảnh',
              chip: 'Workshop 1',
              text: '- Khi cần rõ: nêu ý, đặt ranh giới\n- Khi cần mềm: hỏi, nghe, ghi nhận\n- Quá cứng hay quá mềm đều là tín hiệu\n- Dừng và điều hòa trước khi đáp',
              note: {
                title: 'Mang về',
                text: 'Bản đồ giao tiếp cá nhân',
                tone: 'mint-haze',
              },
            },
          },
          {
            id: 'comm-c3',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'comm-card-3',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: 'BƯỚC 3 · THỂ HIỆN',
              title: '5 module giao tiếp',
              chip: 'Workshop 2',
              text: 'Trình bày quan điểm · Lắng nghe · Nói · Thuyết trình · Viết — luyện qua tình huống công sở thật.',
              note: {
                title: 'Mang về',
                text: 'Một cuộc trò chuyện thật được chuẩn bị kỹ',
                tone: 'mint-haze',
              },
            },
          },
        ],
      },
    },
    {
      type: 'Callout',
      props: {
        id: 'p3-live-comm',
        version: 1,
        variant: 'strip',
        stripTone: 'white',
        title: 'SỐNG CÙNG GIAO TIẾP',
        description: '28 ngày + 4 reflection → mỗi tuần thử trong một tình huống thật',
        bgColor: 'mint-haze',
        padding: 'sm',
      },
    },
    {
      type: 'Callout',
      props: {
        id: 'p3-disclaimer',
        version: 1,
        variant: 'strip',
        stripTone: 'dashed',
        title: '',
        description: 'Hai năng lượng có trong mỗi người, không phải chuyện giới tính',
        bgColor: 'mint-haze',
        padding: 'sm',
      },
    },

    // §16. Năm module giao tiếp (tr. 16), nền mint-haze
    {
      type: 'SectionHeader',
      props: {
        id: 'p3-modules-header',
        version: 2,
        seriesLabel: 'CHƯƠNG TRÌNH 03 · NĂM MODULE GIAO TIẾP',
        titleLine1: 'Mỗi module, hai năng lượng cùng làm việc',
        titleLine2: '',
        bgColor: 'mint-haze',
        padding: 'md',
      },
    },
    {
      type: 'IconCardGrid',
      props: {
        id: 'p3-modules-grid',
        version: 2,
        columns: 5,
        bgColor: 'mint-haze',
        padding: 'sm',
        cards: [
          {
            id: 'mod-c1',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'mod-card-1',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: '01',
              title: 'Trình bày quan điểm',
              items: [
                { title: 'Nam tính', text: 'Nêu ý rõ, có lý do' },
                { title: 'Nữ tính', text: 'Gắn với điều người nghe cần' },
              ],
            },
          },
          {
            id: 'mod-c2',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'mod-card-2',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: '02',
              title: 'Lắng nghe',
              items: [
                { title: 'Nam tính', text: 'Hỏi làm rõ, giữ trọng tâm' },
                { title: 'Nữ tính', text: 'Nghe cả ý lẫn cảm xúc' },
              ],
            },
          },
          {
            id: 'mod-c3',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'mod-card-3',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: '03',
              title: 'Nói',
              items: [
                { title: 'Nam tính', text: 'Dám nói “không”, đặt ranh giới' },
                { title: 'Nữ tính', text: 'Giọng ấm, ghi nhận người nghe' },
              ],
            },
          },
          {
            id: 'mod-c4',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'mod-card-4',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: '04',
              title: 'Thuyết trình',
              items: [
                { title: 'Nam tính', text: 'Cấu trúc, thông điệp chính' },
                { title: 'Nữ tính', text: 'Câu chuyện và sự hiện diện' },
              ],
            },
          },
          {
            id: 'mod-c5',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'mod-card-5',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: '05',
              title: 'Viết',
              items: [
                { title: 'Nam tính', text: 'Email mạch lạc, đúng mục đích' },
                { title: 'Nữ tính', text: 'Giữ quan hệ qua câu chữ' },
              ],
            },
          },
        ],
      },
    },
    {
      type: 'Callout',
      props: {
        id: 'p3-mod-output',
        version: 1,
        variant: 'strip',
        stripTone: 'white',
        title: 'ĐẦU RA THEO TÌNH HUỐNG',
        description:
          'Mỗi module gắn với một tình huống thật: góp ý, từ chối, đề xuất trong họp, viết một email quan trọng.',
        bgColor: 'mint-haze',
        padding: 'sm',
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
            hasAccentBar: true,
          },
          {
            label: 'HIỂU',
            text: 'Điều gì giúp mình bắt đầu, hoặc khiến mình dừng lại?',
            hasAccentBar: true,
          },
          {
            label: 'ĐIỀU CHỈNH',
            text: 'Mình muốn giữ, giảm hoặc thay đổi điều gì?',
            hasAccentBar: true,
          },
          {
            label: 'TIẾP NỐI',
            text: 'Bước tiếp theo vừa sức với mình là gì?',
            hasAccentBar: true,
          },
        ],
        padding: 'md',
      },
    },
    {
      type: 'RichText',
      props: {
        id: 'journey-reflection-notice',
        version: 1,
        content:
          'Xem lại dữ liệu thật trên tracker hoặc nhật ký trước mỗi buổi · Chia sẻ ở mức mình chọn · Xin phép trước khi góp ý',
        align: 'left',
        textColor: 'white',
        textSize: 'sm',
        bgColor: 'deep-navy',
        padding: 'sm',
      },
    },

    // §18. Bản đồ 28 ngày (tr. 18)
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
        columns: [
          { label: '01 · Thói quen', color: 'butter-cream' },
          { label: '02 · Cảm xúc', color: 'soft-pink' },
          { label: '03 · Giao tiếp', color: 'mint-haze' },
        ],
        rows: [
          {
            label: 'Tuần 1',
            cells: [
              { title: 'Bắt đầu, quan sát', text: 'Điều gì khác với dự tính?' },
              { title: 'Quan sát tín hiệu', text: 'Cơ thể báo hiệu cảm xúc ra sao?' },
              { title: 'Quan sát cách mình nói', text: 'Mình nghiêng về năng lượng nào?' },
            ],
          },
          {
            label: 'Tuần 2',
            cells: [
              { title: 'Chỉnh cho hợp mình', text: 'Thay đổi nào giúp dễ làm hơn?' },
              { title: 'Gọi tên, biểu đạt', text: 'Cách nào giúp mình diễn đạt tốt hơn?' },
              { title: 'Lắng nghe, hỏi rõ', text: 'Mình nghe để hiểu hay để đáp?' },
            ],
          },
          {
            label: 'Tuần 3',
            cells: [
              { title: 'Giữ nhịp, quay lại', text: 'Khi nhịp gián đoạn, mình làm gì?' },
              { title: 'Đón nhận nhu cầu', text: 'Mình hay né tránh hay chăm sóc?' },
              { title: 'Nói rõ, ranh giới mềm', text: 'Nói thật mà vẫn giữ quan hệ?' },
            ],
          },
          {
            label: 'Tuần 4',
            cells: [
              { title: 'Nhận diện giá trị', text: 'Mình đã làm được gì, tiếp ra sao?' },
              { title: 'Điều hòa, quay lại', text: 'Điều gì giúp mình trở lại?' },
              { title: 'Thể hiện thật', text: 'Cuộc trò chuyện nào mình đã đi qua?' },
            ],
          },
        ],
        padding: 'md',
      },
    },

    // §19. Điều mang về (tr. 19)
    {
      type: 'SectionHeader',
      props: {
        id: 'journey-takeaways-header',
        version: 2,
        seriesLabel: '12 · ĐIỀU MANG VỀ',
        titleLine1: 'Những thành tựu bạn tự tay tạo nên',
        titleLine2: '',
        emotionLine: 'Đúc kết từ chính hành trình hiểu – thực hành – nhìn lại của bạn',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'IconCardGrid',
      props: {
        id: 'journey-takeaways-grid',
        version: 2,
        columns: 3,
        bgColor: 'warm-ivory',
        padding: 'sm',
        cards: [
          {
            id: 'takeaway-c1',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'takeaway-card-1',
              version: 1,
              cardBg: 'butter-cream',
              eyebrow: '01 · HÀNH ĐỘNG',
              eyebrowBar: true,
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
          },
          {
            id: 'takeaway-c2',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'takeaway-card-2',
              version: 1,
              cardBg: 'soft-pink',
              eyebrow: '02 · CẢM XÚC',
              eyebrowBar: true,
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
          },
          {
            id: 'takeaway-c3',
            type: 'Card',
            props: {
              icon: 'none',
              id: 'takeaway-card-3',
              version: 1,
              cardBg: 'mint-haze',
              eyebrow: '03 · GIAO TIẾP',
              eyebrowBar: true,
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
          },
        ],
      },
    },
    {
      type: 'QuoteBlock',
      props: {
        id: 'journey-takeaways-quote',
        version: 2,
        quote:
          'Mỗi người đi một nhịp riêng — thành tựu là điều chính bạn đã hiểu, đã thử và đã nhìn lại.',
        author: '',
        role: '',
        variant: 'minimal',
        quoteColor: 'deep-navy',
        bgColor: 'warm-ivory',
        padding: 'sm',
      },
    },

    // §20. Phase 2 (tr. 20)
    {
      type: 'SectionHeader',
      props: {
        id: 'journey-p2-header',
        version: 2,
        seriesLabel: '13 · PHASE 2',
        titleLine1: 'Từ nền tảng vững đến định hướng rõ',
        titleLine2: '',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
    },
    {
      type: 'Columns',
      props: {
        id: 'journey-p2-cols',
        version: 1,
        numColumns: '2',
        gap: 'lg',
        bgColor: 'warm-ivory',
        padding: 'sm',
        col1: [
          {
            type: 'Card',
            props: {
              icon: 'none',
              id: 'p2-transfer-card',
              version: 1,
              cardBg: 'warm-ivory',
              eyebrow: 'PHASE 1 MANG SANG',
              items: [
                {
                  title: 'Thói quen',
                  text: 'Nhịp hành động đều và câu chuyện giá trị của mình',
                },
                {
                  title: 'Cảm xúc',
                  text: 'Nền vững để cân nhắc lựa chọn mà không vội vàng',
                },
                {
                  title: 'Giao tiếp',
                  text: 'Cách trình bày giá trị và trao đổi về bước chuyển',
                },
              ],
            },
          },
        ],
        col2: [
          {
            type: 'Card',
            props: {
              icon: 'none',
              id: 'p2-career-clarity-card',
              version: 1,
              cardBg: 'deep-navy',
              eyebrow: 'PHASE 2 · ĐỊNH HƯỚNG',
              title: 'Career Clarity',
              subtitle: 'Thông suốt sự nghiệp · Vững vàng với nghề',
              text: 'Hiểu mình rõ hơn, nhận ra thế mạnh và định hướng rõ bước tiếp theo trong sự nghiệp.',
              chip: 'Khai vấn và hướng nghiệp 1:1',
            },
          },
        ],
      },
    },
    {
      type: 'QuoteBlock',
      props: {
        id: 'journey-p2-quote',
        version: 2,
        quote:
          'Bước chuyển rõ ràng và tự tin hơn khi mình đã đứng vững bằng những năng lực từ nội tại.',
        author: '',
        role: '',
        variant: 'minimal',
        quoteColor: 'deep-navy',
        bgColor: 'warm-ivory',
        padding: 'sm',
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
        buttonText: '[MẪU] Đăng ký tư vấn',
        buttonLink: '/lien-he',
        bgColor: 'deep-navy',
        padding: 'lg',
      },
    },
  ],
}
