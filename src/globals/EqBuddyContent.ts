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
              defaultValue: 'Trạm dừng để lắng nghe ♡',
            },
            {
              name: 'badge',
              label: 'Huy hiệu mở đầu',
              type: 'text',
              defaultValue: 'Bộ thẻ chánh niệm & Trí tuệ cảm xúc (EQ)',
            },
            {
              name: 'mainTitle',
              label: 'Tiêu đề chính',
              type: 'text',
              defaultValue: 'TRẠM DỪNG CẢM XÚC',
            },
            {
              name: 'subtitle',
              label: 'Tiêu đề phụ',
              type: 'text',
              defaultValue: '26 thông điệp cùng bạn. Gọi tên - Ghi nhận - Gợi nhớ.',
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
              defaultValue: 'https://shopee.vn',
            },
          ],
        },
        {
          label: 'Bộ thẻ là gì? (Bước 1)',
          fields: [
            {
              name: 'intro1Heading',
              label: 'Tiêu đề khối',
              type: 'text',
              defaultValue: 'Bộ thẻ là gì?',
            },
            {
              name: 'intro1Description',
              label: 'Mô tả ngắn',
              type: 'text',
              defaultValue:
                'Công cụ chiêm nghiệm và đối thoại cảm xúc được thiết kế cho phụ nữ hiện đại.',
            },
            {
              name: 'card1Title',
              label: 'Thẻ 1: Tiêu đề',
              type: 'text',
              defaultValue: 'Tĩnh lặng & Lắng nghe sâu',
            },
            {
              name: 'card1Desc',
              label: 'Thẻ 1: Nội dung',
              type: 'textarea',
              defaultValue:
                'Mỗi thẻ là một từ khóa EQ giúp bạn dừng lại, kết nối với cảm xúc, nhận diện những xao động và tái tạo nguồn năng lượng an yên bên trong.',
            },
            {
              name: 'card2Title',
              label: 'Thẻ 2: Tiêu đề',
              type: 'text',
              defaultValue: 'Chiêm nghiệm cá nhân',
            },
            {
              name: 'card2Desc',
              label: 'Thẻ 2: Nội dung',
              type: 'textarea',
              defaultValue:
                'Mở đầu ngày mới tràn đầy chánh niệm, đúc kết bài học sau mỗi trải nghiệm, hoặc tìm một từ khóa dẫn lối khi lý trí đang bối rối, mông lung.',
            },
            {
              name: 'card3Title',
              label: 'Thẻ 3: Tiêu đề',
              type: 'text',
              defaultValue: 'Kết nối & Thấu hiểu nhóm',
            },
            {
              name: 'card3Desc',
              label: 'Thẻ 3: Nội dung',
              type: 'textarea',
              defaultValue:
                'Phá băng nhóm (Icebreaker), khám phá giá trị đội ngũ, nhắn nhủ chân thành giữa bạn bè hoặc người thân trong một không gian an toàn, cởi mở.',
            },
            {
              name: 'card4Title',
              label: 'Thẻ 4: Tiêu đề',
              type: 'text',
              defaultValue: '2 Mặt tương tác 3D',
            },
            {
              name: 'card4Desc',
              label: 'Thẻ 4: Nội dung',
              type: 'textarea',
              defaultValue:
                'Mặt trước: Từ khóa EQ + Thông điệp cảm hứng dẫn dắt. Mặt sau: 3 câu hỏi gợi mở suy ngẫm theo cấu trúc Gợi nhớ - Gói ghém - Ghi nhận.',
            },
          ],
        },
        {
          label: '4 Bước sử dụng (Bước 2)',
          fields: [
            {
              name: 'intro2Heading',
              label: 'Tiêu đề khối',
              type: 'text',
              defaultValue: '4 Bước Sử Dụng Bộ Thẻ',
            },
            {
              name: 'intro2Description',
              label: 'Mô tả ngắn',
              type: 'text',
              defaultValue:
                'Hãy thả lỏng vai, hít một hơi thật sâu và làm theo 4 chỉ dẫn đơn giản sau:',
            },
            {
              name: 'step1Title',
              label: 'Bước 1: Tên',
              type: 'text',
              defaultValue: '1. Mở đầu',
            },
            {
              name: 'step1Tag',
              label: 'Bước 1: Nhãn',
              type: 'text',
              defaultValue: 'Đặt ý định',
            },
            {
              name: 'step1Desc',
              label: 'Bước 1: Mô tả',
              type: 'textarea',
              defaultValue:
                'Đặt ý định cho điều gì trong cuộc sống hay công việc hôm nay? Dành 30 giây tĩnh lặng, hít thở sâu để đưa tâm trí về trạng thái hiện diện trọn vẹn.',
            },
            {
              name: 'step2Title',
              label: 'Bước 2: Tên',
              type: 'text',
              defaultValue: '2. Chọn thẻ',
            },
            {
              name: 'step2Tag',
              label: 'Bước 2: Nhãn',
              type: 'text',
              defaultValue: 'Gọi tên cảm xúc',
            },
            {
              name: 'step2Desc',
              label: 'Bước 2: Mô tả',
              type: 'textarea',
              defaultValue:
                'Chia sẻ cảm xúc bạn đang gặp — hoặc để trống và rút ngẫu nhiên thông điệp phù hợp cho khoảnh khắc này.',
            },
            {
              name: 'step3Title',
              label: 'Bước 3: Tên',
              type: 'text',
              defaultValue: '3. Thực hiện',
            },
            {
              name: 'step3Tag',
              label: 'Bước 3: Nhãn',
              type: 'text',
              defaultValue: 'Mặt trước thẻ',
            },
            {
              name: 'step3Desc',
              label: 'Bước 3: Mô tả',
              type: 'textarea',
              defaultValue:
                'Đọc từ khóa kèm câu diễn giải ở mặt trước → kết nối cảm nhận và lắng nghe phản hồi từ cơ thể và tâm trí.',
            },
            {
              name: 'step4Title',
              label: 'Bước 4: Tên',
              type: 'text',
              defaultValue: '4. Khám phá',
            },
            {
              name: 'step4Tag',
              label: 'Bước 4: Nhãn',
              type: 'text',
              defaultValue: 'Mặt sau thẻ',
            },
            {
              name: 'step4Desc',
              label: 'Bước 4: Mô tả',
              type: 'textarea',
              defaultValue:
                'Lật thẻ, trả lời 3 câu hỏi ở mặt sau để đào sâu và kết nối, gói ghém bài học và ghi nhận nỗ lực của bản thân.',
            },
          ],
        },
        {
          label: 'Hộp hướng dẫn toàn cục',
          fields: [
            {
              name: 'guideModalQuote',
              label: 'Câu châm ngôn trong hộp hướng dẫn',
              type: 'textarea',
              defaultValue:
                '“Mỗi thẻ là một tấm gương soi chiếu. Không có lá bài đúng hay sai, chỉ có khoảnh khắc bạn chân thật với chính mình.” ♡',
            },
          ],
        },
      ],
    },
  ],
}
