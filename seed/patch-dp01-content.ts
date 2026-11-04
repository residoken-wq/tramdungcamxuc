/**
 * Script nạp nội dung mặc định chuẩn Brand Book / zip vào Payload CMS:
 * - habit-journey-content (H2, H6)
 * - eq-buddy-content (E4)
 *
 * Chạy độc lập: pnpm tsx seed/patch-dp01-content.ts
 */

import { getPayload } from 'payload'
import config from '../src/payload.config'

export async function patchDp01Content() {
  console.log('[DP-01] Bắt đầu nạp nội dung mặc định chuẩn zip vào CMS...')
  const payload = await getPayload({ config: await config })

  // 1. Cập nhật eq-buddy-content (E4)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingEq = await (payload.findGlobal as any)({
      slug: 'eq-buddy-content',
      overrideAccess: true,
    }).catch(() => null)

    const eqPatch = {
      eqAccessMode: existingEq?.eqAccessMode || 'trial',
      shopeeUrl:
        existingEq?.shopeeUrl ||
        'https://shopee.vn/search?keyword=tr%E1%BA%A1m%20d%E1%BB%ABng%20c%E1%BA%A3m%20x%C3%BAc',
      tagline: existingEq?.tagline || 'EQ Buddy • Thẻ Trạm Dừng Cảm Xúc',
      quoteTop: existingEq?.quoteTop || 'Trạm dừng để lắng nghe ♡',
      badge: existingEq?.badge || 'Bộ thẻ chánh niệm & Trí tuệ cảm xúc (EQ)',
      mainTitle: existingEq?.mainTitle || 'TRẠM DỪNG CẢM XÚC',
      subtitle: existingEq?.subtitle || '26 thông điệp cùng bạn. Gọi tên - Ghi nhận - Gợi nhớ.',
      intro1Heading: existingEq?.intro1Heading || 'Bộ thẻ là gì?',
      intro1Description:
        existingEq?.intro1Description ||
        'Bộ công cụ giúp bạn kết nối, nhận diện và chuyển hóa cảm xúc mỗi ngày.',
      card1Title: existingEq?.card1Title || 'Tự thân',
      card1Desc: existingEq?.card1Desc || 'Nhận biết cảm xúc và thế giới nội tâm của chính mình.',
      card2Title: existingEq?.card2Title || 'Người khác',
      card2Desc: existingEq?.card2Desc || 'Thấu hiểu, đồng cảm và xây dựng kết nối sâu sắc.',
      card3Title: existingEq?.card3Title || 'Tình huống',
      card3Desc: existingEq?.card3Desc || 'Góc nhìn khách quan trước các thử thách và biến cố.',
      card4Title: existingEq?.card4Title || 'Hành động',
      card4Desc: existingEq?.card4Desc || 'Những bước nhỏ để chuyển hóa và vững vàng tiến bước.',
      intro2Heading: existingEq?.intro2Heading || '4 Bước Sử Dụng Bộ Thẻ',
      intro2Description:
        existingEq?.intro2Description ||
        'Hãy thả lỏng vai, hít một hơi thật sâu và làm theo 4 chỉ dẫn đơn giản sau:',
      step1Title: existingEq?.step1Title || '1. Tĩnh lặng',
      step1Tag: existingEq?.step1Tag || '30 giây thở sâu',
      step1Desc:
        existingEq?.step1Desc ||
        'Dành 30 giây thả lỏng cơ thể, hít thở sâu và lắng đọng tâm trí để kết nối với chính mình.',
      step2Title: existingEq?.step2Title || '2. Rút thẻ',
      step2Tag: existingEq?.step2Tag || 'Gọi tên cảm xúc',
      step2Desc:
        existingEq?.step2Desc ||
        'Chia sẻ cảm xúc bạn đang gặp phải hoặc rút một thẻ ngẫu nhiên cho khoảnh khắc này.',
      step3Title: existingEq?.step3Title || '3. Lắng nghe',
      step3Tag: existingEq?.step3Tag || 'Mặt trước thẻ',
      step3Desc:
        existingEq?.step3Desc ||
        'Đọc từ khóa kèm câu diễn giải ở mặt trước → kết nối cảm nhận và lắng nghe phản hồi từ cơ thể và tâm trí.',
      step4Title: existingEq?.step4Title || '4. Khám phá',
      step4Tag: existingEq?.step4Tag || 'Mặt sau thẻ',
      step4Desc:
        existingEq?.step4Desc ||
        'Lật thẻ, trả lời 3 câu hỏi ở mặt sau để đào sâu và kết nối, gói ghém bài học và ghi nhận nỗ lực của bản thân.',
      guideModalQuote:
        existingEq?.guideModalQuote ||
        'Mỗi cảm xúc đều mang một thông điệp. Chúc bạn có những phút giây tĩnh lặng và thấu hiểu chính mình.',
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload.updateGlobal as any)({
      slug: 'eq-buddy-content',
      data: eqPatch,
      overrideAccess: true,
    })
    console.log('[DP-01] Đã nạp thành công eq-buddy-content vào CMS.')
  } catch (err) {
    console.error('[DP-01] Lỗi nạp eq-buddy-content:', err)
  }

  console.log('[DP-01] Hoàn tất nạp nội dung CMS.')
}

// Chạy trực tiếp qua CLI
if (process.argv[1]?.endsWith('patch-dp01-content.ts')) {
  patchDp01Content()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
