// scripts/dp02d-fill-empty-content.ts
// DP-02d: Script chỉ điền ô trống cho habitJourneyContent và eqBuddyContent (không ghi đè ô đã có dữ liệu).
// Dry-run: pnpm exec tsx scripts/dp02d-fill-empty-content.ts
// Apply:   APPLY=true pnpm exec tsx scripts/dp02d-fill-empty-content.ts

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import {
  DEFAULT_DP01_CONTENT,
  DEFAULT_ONE_PERCENT_UNKNOWNS,
} from '../src/lib/habit/dp01-content'
import { DEFAULT_EQ_BUDDY_CONTENT } from '../src/lib/eq/eq-content'

const isApply = process.env.APPLY === 'true'

async function run() {
  const payload = await getPayload({ config })
  console.log('======================================================================')
  console.log(
    isApply
      ? '🚀 [APPLY] DP-02D FILL EMPTY CONTENT - ĐANG GHI VÀO DATABASE'
      : '🔍 [DRY-RUN] DP-02D FILL EMPTY CONTENT - CHỈ KIỂM TRA Ô TRỐNG',
  )
  console.log('======================================================================\n')

  // 1. Kiểm tra habitJourneyContent
  console.log('--- 1. Kiểm tra habitJourneyContent ---')
  const habitContent = await payload.findGlobal({
    slug: 'habitJourneyContent',
    overrideAccess: true,
  })

  function patchGroup<T extends object>(
    current: Record<string, unknown> | undefined | null,
    defaults: T,
  ): { patched: T; changed: boolean } {
    const res: Record<string, unknown> = { ...(current || {}) }
    let changed = false
    for (const [k, v] of Object.entries(defaults as Record<string, unknown>)) {
      if (res[k] === undefined || res[k] === null || res[k] === '') {
        res[k] = v
        changed = true
        console.log(`  + Điền ô trống: ${k} = "${String(v).slice(0, 50)}..."`)
      }
    }
    return { patched: res as T, changed }
  }

  const step1 = patchGroup(habitContent?.step1 as Record<string, unknown> | undefined, {
    title: DEFAULT_DP01_CONTENT.step1.title,
    quoteText: DEFAULT_DP01_CONTENT.step1.quoteText,
    quoteAuthor: DEFAULT_DP01_CONTENT.step1.quoteAuthor,
    leadIn: DEFAULT_DP01_CONTENT.step1.leadIn,
    surveyTitle: DEFAULT_DP01_CONTENT.step1.surveyTitle,
    surveyDesc: DEFAULT_DP01_CONTENT.step1.surveyDesc,
    cueDiagnosis: DEFAULT_DP01_CONTENT.step1.cueDiagnosis,
    cravingDiagnosis: DEFAULT_DP01_CONTENT.step1.cravingDiagnosis,
    responseDiagnosis: DEFAULT_DP01_CONTENT.step1.responseDiagnosis,
    rewardDiagnosis: DEFAULT_DP01_CONTENT.step1.rewardDiagnosis,
  })

  const step3 = patchGroup(habitContent?.step3 as Record<string, unknown> | undefined, {
    title: DEFAULT_DP01_CONTENT.step3.title,
    leadIn: DEFAULT_DP01_CONTENT.step3.leadIn,
    scorecardTitle: DEFAULT_DP01_CONTENT.step3.scorecardTitle,
    scorecardDesc: DEFAULT_DP01_CONTENT.step3.scorecardDesc,
    mentorTitle: DEFAULT_DP01_CONTENT.step3.mentorTitle,
    mentorDesc: DEFAULT_DP01_CONTENT.step3.mentorDesc,
    emptyMentorHint: DEFAULT_DP01_CONTENT.step3.emptyMentorHint,
    mentorTimeLabel: DEFAULT_DP01_CONTENT.step3.mentorTimeLabel,
    mentorSuccessHint: DEFAULT_DP01_CONTENT.step3.mentorSuccessHint,
  })

  const step4 = patchGroup(habitContent?.step4 as Record<string, unknown> | undefined, {
    title: DEFAULT_DP01_CONTENT.step4.title,
    leadIn: DEFAULT_DP01_CONTENT.step4.leadIn,
    leadInEmphasis: DEFAULT_DP01_CONTENT.step4.leadInEmphasis,
    statementTitle: DEFAULT_DP01_CONTENT.step4.statementTitle,
    statementDesc: DEFAULT_DP01_CONTENT.step4.statementDesc,
    rhythmTitle: DEFAULT_DP01_CONTENT.step4.rhythmTitle,
    rhythmDesc: DEFAULT_DP01_CONTENT.step4.rhythmDesc,
    rhythmNote: DEFAULT_DP01_CONTENT.step4.rhythmNote,
    atomicHabitTitle: DEFAULT_DP01_CONTENT.step4.atomicHabitTitle,
    atomicHabitDesc: DEFAULT_DP01_CONTENT.step4.atomicHabitDesc,
    commitmentTitle: DEFAULT_DP01_CONTENT.step4.commitmentTitle,
    whyImportantLabel: DEFAULT_DP01_CONTENT.step4.whyImportantLabel,
    whyImportantPlaceholder: DEFAULT_DP01_CONTENT.step4.whyImportantPlaceholder,
    whyImportantNote: DEFAULT_DP01_CONTENT.step4.whyImportantNote,
  })

  const step5 = patchGroup(habitContent?.step5 as Record<string, unknown> | undefined, {
    title: DEFAULT_DP01_CONTENT.step5.title,
    leadIn: DEFAULT_DP01_CONTENT.step5.leadIn,
    theoryTitle: DEFAULT_DP01_CONTENT.step5.theoryTitle,
    theoryDesc: DEFAULT_DP01_CONTENT.step5.theoryDesc,
    customActionPlaceholder: DEFAULT_DP01_CONTENT.step5.customActionPlaceholder,
  })

  let onePercentChanged = false
  const curUnknowns = habitContent?.onePercent?.unknowns
  let patchedUnknowns = curUnknowns
  if (!Array.isArray(curUnknowns) || curUnknowns.length === 0) {
    patchedUnknowns = DEFAULT_ONE_PERCENT_UNKNOWNS.map((u) => ({
      title: u.title,
      body: u.content,
    }))
    onePercentChanged = true
    console.log('  + Điền 3 điều unknowns vào onePercent.unknowns')
  }

  const habitChanged =
    step1.changed || step3.changed || step4.changed || step5.changed || onePercentChanged

  if (isApply && habitChanged) {
    await payload.updateGlobal({
      slug: 'habitJourneyContent',
      data: {
        step1: step1.patched,
        step3: step3.patched,
        step4: step4.patched,
        step5: step5.patched,
        onePercent: {
          ...(habitContent?.onePercent || {}),
          unknowns: patchedUnknowns,
        },
      },
    })
    console.log('  ✅ Đã cập nhật ô trống vào habitJourneyContent!')
  }

  // 2. Kiểm tra eqBuddyContent
  console.log('\n--- 2. Kiểm tra eqBuddyContent ---')
  const eqContent = await payload.findGlobal({
    slug: 'eqBuddyContent',
    overrideAccess: true,
  })

  const eqPatched = patchGroup(
    (eqContent as unknown) as Record<string, unknown> | undefined,
    DEFAULT_EQ_BUDDY_CONTENT,
  )

  if (isApply && eqPatched.changed) {
    await payload.updateGlobal({
      slug: 'eqBuddyContent',
      data: eqPatched.patched,
    })
    console.log('  ✅ Đã cập nhật ô trống vào eqBuddyContent!')
  }

  console.log('\n======================================================================')
  console.log('HOÀN TẤT KIỂM TRA/ĐIỀN Ô TRỐNG')
  console.log('======================================================================')
  process.exit(0)
}

run().catch((err) => {
  console.error('Lỗi khi chạy script:', err)
  process.exit(1)
})

