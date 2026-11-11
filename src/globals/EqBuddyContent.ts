import type { GlobalConfig } from 'payload'
import { isOwner, authenticated } from '../lib/auth/access'
import { vi } from '../lib/i18n/vi'
import { globalLivePreview } from '../lib/live-preview'
import { revalidatePath } from 'next/cache'

export const EqBuddyContent: GlobalConfig = {
  slug: 'eqBuddyContent',
  label: 'Nội dung EQ Buddy',
  admin: {
    group: vi.cms.nav.eq,
    description: 'Cấu hình chế độ truy cập (Owner), hướng dẫn 2 bước, và nội dung giao diện EQ Buddy.',
    livePreview: globalLivePreview('eqBuddyContent'),
  },
  access: {
    read: () => true,
    update: authenticated,
  },
  hooks: {
    afterChange: [
      async () => {
        try {
          revalidatePath('/eq-buddy')
          revalidatePath('/eq-buddy/rut-the')
        } catch (_e) {}
      },
    ],
  },
  fields: [
    {
      name: 'eqAccessMode',
      label: 'Chế độ truy cập EQ Buddy',
      type: 'select',
      options: [
        { label: 'Cần đăng ký dùng thử (mặc định)', value: 'trial' },
        { label: 'Miễn phí hoàn toàn (không giới hạn, mở toàn bộ 26 thẻ)', value: 'free' },
      ],
      defaultValue: 'trial',
      // REVIEW-REQUIRED: Chỉ owner mới được thay đổi chế độ truy cập EQ Buddy (E3)
      access: {
        update: isOwner,
      },
      admin: {
        description:
          'Chỉ chủ sở hữu (Owner) mới có quyền đổi. "Miễn phí hoàn toàn": khách rút không giới hạn, không cần đăng nhập, mở toàn bộ 26 thẻ và câu hỏi suy ngẫm, không hiển thị paywall. "Cần đăng ký dùng thử": khách rút 1 thẻ rồi phải dùng thử.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Giao diện chung',
          fields: [
            {
              name: 'tagline',
              label: 'Dòng tiêu đề phụ (Series bar)',
              type: 'text',
              defaultValue: 'EQ Buddy • Thẻ Trạm Dừng Cảm Xúc',
            },
            {
              name: 'quoteTop',
              label: 'Câu châm ngôn góc trên',
              type: 'text',
              defaultValue: 'Dừng để vững vàng bước tới.',
            },
            {
              name: 'badge',
              label: 'Huy hiệu mở đầu (để trống sẽ ẩn)',
              type: 'text',
              defaultValue: '',
            },
            {
              name: 'mainTitle',
              label: 'Tiêu đề chính',
              type: 'text',
              defaultValue: 'BỘ THẺ EQ BUDDY',
            },
            {
              name: 'subtitle',
              label: 'Tiêu đề phụ',
              type: 'text',
              defaultValue:
                '26 thông điệp cùng bạn Gói ghém cảm xúc - Ghi nhận nỗ lực - Gợi nhớ bài học ý nghĩa mỗi ngày.',
            },
            {
              name: 'suggestedEmotions',
              label: 'Gợi ý tâm trạng (phân cách bởi dấu phẩy)',
              type: 'text',
              defaultValue:
                'Mông lung, Căng thẳng, Biết ơn, Bình an, Tò mò, Cần dẫn lối, Hơi mệt, Bối rối',
            },
            {
              name: 'shopeeUrl',
              label: 'Đường dẫn mua bộ thẻ vật lý (Shopee)',
              type: 'text',
              defaultValue: 'https://tinyurl.com/yc43suhc',
            },
            {
              name: 'stateIcon1Label',
              label: 'Nhãn biểu tượng 1 (Nhập trạng thái)',
              type: 'text',
              defaultValue: 'Hít thở 3 hơi',
            },
            {
              name: 'stateIcon2Label',
              label: 'Nhãn biểu tượng 2 (Nhập trạng thái)',
              type: 'text',
              defaultValue: 'Nghĩ về mong muốn hôm nay',
            },
            {
              name: 'stateIcon3Label',
              label: 'Nhãn biểu tượng 3 (Nhập trạng thái)',
              type: 'text',
              defaultValue: 'Gọi tên cảm xúc hiện tại',
            },
            {
              name: 'cardBackPromptTitle',
              label: 'Tiêu đề 3 câu hỏi mặt sau thẻ',
              type: 'text',
              defaultValue: '3 câu hỏi kết nối nội tâm',
            },
            {
              name: 'cardBackQuote',
              label: 'Câu châm ngôn mặt sau thẻ',
              type: 'text',
              defaultValue: 'Dừng để vững vàng bước tới.',
            },
          ],
        },
        {
          label: 'Bộ thẻ là gì? (Bước 1)',
          fields: [
            {
              name: 'intro1Heading',
              label: 'Tiêu đề khối (để trống sẽ ẩn toàn bộ phần Bộ thẻ là gì)',
              type: 'text',
              defaultValue: '',
            },
            {
              name: 'intro1Description',
              label: 'Mô tả ngắn',
              type: 'text',
              defaultValue: '',
            },
            {
              name: 'card1Title',
              label: 'Thẻ 1: Tiêu đề',
              type: 'text',
              defaultValue: '',
            },
            {
              name: 'card1Desc',
              label: 'Thẻ 1: Nội dung',
              type: 'textarea',
              defaultValue: '',
            },
            {
              name: 'card2Title',
              label: 'Thẻ 2: Tiêu đề',
              type: 'text',
              defaultValue: '',
            },
            {
              name: 'card2Desc',
              label: 'Thẻ 2: Nội dung',
              type: 'textarea',
              defaultValue: '',
            },
            {
              name: 'card3Title',
              label: 'Thẻ 3: Tiêu đề',
              type: 'text',
              defaultValue: '',
            },
            {
              name: 'card3Desc',
              label: 'Thẻ 3: Nội dung',
              type: 'textarea',
              defaultValue: '',
            },
            {
              name: 'card4Title',
              label: 'Thẻ 4: Tiêu đề',
              type: 'text',
              defaultValue: '',
            },
            {
              name: 'card4Desc',
              label: 'Thẻ 4: Nội dung',
              type: 'textarea',
              defaultValue: '',
            },
          ],
        },
        {
          label: 'Hướng dẫn 3 bước',
          fields: [
            {
              name: 'intro2Heading',
              label: 'Tiêu đề khối',
              type: 'text',
              defaultValue: 'Hướng dẫn: 3 bước để "dừng" và kết nối nội tâm mỗi ngày',
            },
            {
              name: 'intro2Description',
              label: 'Mô tả ngắn',
              type: 'text',
              defaultValue:
                'Dành vài phút để lắng nghe và kết nối nội tâm:',
            },
            {
              name: 'step1Title',
              label: 'Bước 1: Tên',
              type: 'text',
              defaultValue: 'Gọi tên mong muốn và cảm xúc',
            },
            {
              name: 'step1Tag',
              label: 'Bước 1: Nhãn',
              type: 'text',
              defaultValue: 'Dành 3 hơi thở',
            },
            {
              name: 'step1Desc',
              label: 'Bước 1: Mô tả',
              type: 'textarea',
              defaultValue:
                'Dành 3 hơi thở để thả lỏng và gọi tên mong muốn cho hôm nay. Chia sẻ cảm xúc bạn đang có ngay lúc này.',
            },
            {
              name: 'step2Title',
              label: 'Bước 2: Tên',
              type: 'text',
              defaultValue: 'Chọn thông điệp',
            },
            {
              name: 'step2Tag',
              label: 'Bước 2: Nhãn',
              type: 'text',
              defaultValue: 'Rút thẻ',
            },
            {
              name: 'step2Desc',
              label: 'Bước 2: Mô tả',
              type: 'textarea',
              defaultValue:
                'Rút ngẫu nhiên thông điệp phù hợp với mình, đọc và cảm nhận',
            },
            {
              name: 'step3Title',
              label: 'Bước 3: Tên',
              type: 'text',
              defaultValue: 'Khám phá',
            },
            {
              name: 'step3Tag',
              label: 'Bước 3: Nhãn',
              type: 'text',
              defaultValue: 'Lật thẻ',
            },
            {
              name: 'step3Desc',
              label: 'Bước 3: Mô tả',
              type: 'textarea',
              defaultValue:
                'Lật thẻ sang mặt sau để được gợi mở bằng những câu hỏi đào sâu - kết nối. Khuyến khích đào sâu với coach, người thương hoặc có thời gian chất lượng cho bản thân.',
            },
            {
              name: 'step4Title',
              label: 'Bước 4: Tên (để trống nếu chỉ dùng 3 bước)',
              type: 'text',
              defaultValue: '',
            },
            {
              name: 'step4Tag',
              label: 'Bước 4: Nhãn',
              type: 'text',
              defaultValue: '',
            },
            {
              name: 'step4Desc',
              label: 'Bước 4: Mô tả',
              type: 'textarea',
              defaultValue: '',
            },
          ],
        },
        {
          label: 'Hộp hướng dẫn toàn cục',
          fields: [
            {
              name: 'guideModalTitle',
              label: 'Tiêu đề hộp hướng dẫn',
              type: 'text',
              defaultValue: 'Hướng dẫn: 3 bước để "dừng" và kết nối nội tâm mỗi ngày',
            },
            {
              name: 'guideModalQuote',
              label: 'Câu châm ngôn trong hộp hướng dẫn',
              type: 'textarea',
              defaultValue:
                'Đằng sau mỗi cảm xúc đều là một thông điệp đang chờ đợi bạn khám phá bằng sự chân thành và đón nhận trọn vẹn.',
            },
            {
              name: 'guideModalButton',
              label: 'Nút bấm trong hộp hướng dẫn',
              type: 'text',
              defaultValue: 'Trải nghiệm',
            },
          ],
        },
      ],
    },
  ],
}
