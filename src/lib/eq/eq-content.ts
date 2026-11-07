/**
 * DP-02d: Central defaults and helper for EQ Buddy copy.
 * Default text strings live here in one place and can be overridden by CMS global EqBuddyContent.
 */

export interface Dp01EqIntroContent {
  tagline: string
  quoteTop: string
  badge: string
  mainTitle: string
  subtitle: string
  shopeeUrl: string
  intro1Heading: string
  intro1Description: string
  card1Title: string
  card1Desc: string
  card2Title: string
  card2Desc: string
  card3Title: string
  card3Desc: string
  card4Title: string
  card4Desc: string
  intro2Heading: string
  intro2Description: string
  step1Title: string
  step1Tag: string
  step1Desc: string
  step2Title: string
  step2Tag: string
  step2Desc: string
  step3Title: string
  step3Tag: string
  step3Desc: string
  step4Title: string
  step4Tag: string
  step4Desc: string
  guideModalQuote: string
}

export type Dp01EqBuddyContent = Dp01EqIntroContent

export const DEFAULT_EQ_BUDDY_CONTENT: Dp01EqIntroContent = {
  tagline: 'EQ Buddy • Thẻ Trạm Dừng Cảm Xúc',
  quoteTop: 'Trạm dừng để lắng nghe ♡',
  badge: 'Bộ thẻ chánh niệm & Trí tuệ cảm xúc (EQ)',
  mainTitle: 'TRẠM DỪNG CẢM XÚC',
  subtitle: '26 thông điệp cùng bạn. Gọi tên - Ghi nhận - Gợi nhớ.',
  shopeeUrl: 'https://shopee.vn',
  intro1Heading: 'Bộ thẻ là gì?',
  intro1Description: 'Công cụ chiêm nghiệm và đối thoại cảm xúc được thiết kế cho phụ nữ hiện đại.',
  card1Title: 'Tĩnh lặng & Lắng nghe sâu',
  card1Desc:
    'Mỗi thẻ là một từ khóa EQ giúp bạn dừng lại, kết nối với cảm xúc, nhận diện những xao động và tái tạo nguồn năng lượng an yên bên trong.',
  card2Title: 'Chiêm nghiệm cá nhân',
  card2Desc:
    'Mở đầu ngày mới tràn đầy chánh niệm, đúc kết bài học sau mỗi trải nghiệm, hoặc tìm một từ khóa dẫn lối khi lý trí đang bối rối, mông lung.',
  card3Title: 'Kết nối & Thấu hiểu nhóm',
  card3Desc:
    'Phá băng nhóm (Icebreaker), khám phá giá trị đội ngũ, nhắn nhủ chân thành giữa bạn bè hoặc người thân trong một không gian an toàn, cởi mở.',
  card4Title: '2 Mặt tương tác 3D',
  card4Desc: '',
  intro2Heading: '4 Bước Sử Dụng Bộ Thẻ',
  intro2Description: 'Hãy thả lỏng vai, hít một hơi thật sâu và làm theo 4 chỉ dẫn đơn giản sau:',
  step1Title: '1. Mở đầu',
  step1Tag: 'Đặt ý định',
  step1Desc:
    'Đặt ý định cho điều gì trong cuộc sống hay công việc hôm nay? Dành 30 giây tĩnh lặng, hít thở sâu để đưa tâm trí về trạng thái hiện diện trọn vẹn.',
  step2Title: '2. Chọn thẻ',
  step2Tag: 'Gọi tên cảm xúc',
  step2Desc:
    'Chia sẻ cảm xúc bạn đang gặp — hoặc để trống và rút ngẫu nhiên thông điệp phù hợp cho khoảnh khắc này.',
  step3Title: '3. Thực hiện',
  step3Tag: 'Mặt trước thẻ',
  step3Desc:
    'Đọc từ khóa kèm câu diễn giải ở mặt trước → kết nối cảm nhận và lắng nghe phản hồi từ cơ thể và tâm trí.',
  step4Title: '4. Khám phá',
  step4Tag: 'Mặt sau thẻ',
  step4Desc:
    'Lật thẻ, trả lời 3 câu hỏi ở mặt sau để đào sâu và kết nối, gói ghém bài học và ghi nhận nỗ lực của bản thân.',
  guideModalQuote:
    '“Mỗi thẻ là một tấm gương soi chiếu. Không có lá bài đúng hay sai, chỉ có khoảnh khắc bạn chân thật với chính mình.” ♡',
}

function pickString(val: unknown, fallback: string): string {
  return typeof val === 'string' && val.trim().length > 0 ? val.trim() : fallback
}

export function withEqBuddyDefaults(
  content?: Partial<Dp01EqIntroContent> | null,
): Dp01EqIntroContent {
  const c = content || {}
  return {
    tagline: pickString(c.tagline, DEFAULT_EQ_BUDDY_CONTENT.tagline),
    quoteTop: pickString(c.quoteTop, DEFAULT_EQ_BUDDY_CONTENT.quoteTop),
    badge: pickString(c.badge, DEFAULT_EQ_BUDDY_CONTENT.badge),
    mainTitle: pickString(c.mainTitle, DEFAULT_EQ_BUDDY_CONTENT.mainTitle),
    subtitle: pickString(c.subtitle, DEFAULT_EQ_BUDDY_CONTENT.subtitle),
    shopeeUrl: pickString(c.shopeeUrl, DEFAULT_EQ_BUDDY_CONTENT.shopeeUrl),
    intro1Heading: pickString(c.intro1Heading, DEFAULT_EQ_BUDDY_CONTENT.intro1Heading),
    intro1Description: pickString(c.intro1Description, DEFAULT_EQ_BUDDY_CONTENT.intro1Description),
    card1Title: pickString(c.card1Title, DEFAULT_EQ_BUDDY_CONTENT.card1Title),
    card1Desc: pickString(c.card1Desc, DEFAULT_EQ_BUDDY_CONTENT.card1Desc),
    card2Title: pickString(c.card2Title, DEFAULT_EQ_BUDDY_CONTENT.card2Title),
    card2Desc: pickString(c.card2Desc, DEFAULT_EQ_BUDDY_CONTENT.card2Desc),
    card3Title: pickString(c.card3Title, DEFAULT_EQ_BUDDY_CONTENT.card3Title),
    card3Desc: pickString(c.card3Desc, DEFAULT_EQ_BUDDY_CONTENT.card3Desc),
    card4Title: pickString(c.card4Title, DEFAULT_EQ_BUDDY_CONTENT.card4Title),
    card4Desc: pickString(c.card4Desc, DEFAULT_EQ_BUDDY_CONTENT.card4Desc),
    intro2Heading: pickString(c.intro2Heading, DEFAULT_EQ_BUDDY_CONTENT.intro2Heading),
    intro2Description: pickString(c.intro2Description, DEFAULT_EQ_BUDDY_CONTENT.intro2Description),
    step1Title: pickString(c.step1Title, DEFAULT_EQ_BUDDY_CONTENT.step1Title),
    step1Tag: pickString(c.step1Tag, DEFAULT_EQ_BUDDY_CONTENT.step1Tag),
    step1Desc: pickString(c.step1Desc, DEFAULT_EQ_BUDDY_CONTENT.step1Desc),
    step2Title: pickString(c.step2Title, DEFAULT_EQ_BUDDY_CONTENT.step2Title),
    step2Tag: pickString(c.step2Tag, DEFAULT_EQ_BUDDY_CONTENT.step2Tag),
    step2Desc: pickString(c.step2Desc, DEFAULT_EQ_BUDDY_CONTENT.step2Desc),
    step3Title: pickString(c.step3Title, DEFAULT_EQ_BUDDY_CONTENT.step3Title),
    step3Tag: pickString(c.step3Tag, DEFAULT_EQ_BUDDY_CONTENT.step3Tag),
    step3Desc: pickString(c.step3Desc, DEFAULT_EQ_BUDDY_CONTENT.step3Desc),
    step4Title: pickString(c.step4Title, DEFAULT_EQ_BUDDY_CONTENT.step4Title),
    step4Tag: pickString(c.step4Tag, DEFAULT_EQ_BUDDY_CONTENT.step4Tag),
    step4Desc: pickString(c.step4Desc, DEFAULT_EQ_BUDDY_CONTENT.step4Desc),
    guideModalQuote: pickString(c.guideModalQuote, DEFAULT_EQ_BUDDY_CONTENT.guideModalQuote),
  }
}
