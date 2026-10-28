import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Payload } from 'payload'
import { buildBoardingPass, type BoardingPassInput, type BoardingPassData } from './boarding-pass'

export async function resolveBoardingPassData(
  input: BoardingPassInput,
  payloadInstance?: Payload,
): Promise<BoardingPassData> {
  const payload = payloadInstance ?? (await getPayload({ config }))

  // 1. Đọc số ngày hành trình từ siteSettings (depth: 0)
  let journeyDays = 28
  try {
    const settings = await payload.findGlobal({
      slug: 'siteSettings',
      depth: 0,
    })
    if (typeof settings?.habitJourneyDays === 'number' && settings.habitJourneyDays > 0) {
      journeyDays = settings.habitJourneyDays
    }
  } catch {
    journeyDays = 28
  }

  // 2. Đọc tên các kỹ thuật đã xuất bản theo techniqueIds (bỏ ID không có / chưa xuất bản)
  const techniqueIds = input.techniqueIds || []
  let publishedTechniques: Array<{ id: number; name: string; stage: string }> = []

  if (techniqueIds.length > 0) {
    try {
      const res = await payload.find({
        collection: 'techniques',
        where: {
          and: [{ id: { in: techniqueIds } }, { _status: { equals: 'published' } }],
        },
        limit: 50,
        depth: 0,
        draft: false,
      })

      publishedTechniques = res.docs
        .filter(
          (doc) =>
            typeof doc.id === 'number' &&
            typeof doc.name === 'string' &&
            doc.stage &&
            ['cue', 'craving', 'response', 'reward'].includes(doc.stage),
        )
        .map((doc) => ({
          id: doc.id as number,
          name: doc.name as string,
          stage: doc.stage as string,
        }))
    } catch {
      publishedTechniques = []
    }
  }

  return buildBoardingPass(input, {
    journeyDays,
    startDate: new Date(),
    techniques: publishedTechniques,
  })
}
