// DP-01d: nạp 11 kỹ thuật, 4 quy luật, và 8 câu hỏi khảo sát từ bản zip vào CMS.
// Dry-run (mặc định – chỉ in diff):
//   pnpm payload run scripts/dp01d-habit-content.ts < /dev/null
// Ghi vào database (kèm file backup trong backups/):
//   APPLY=true pnpm payload run scripts/dp01d-habit-content.ts < /dev/null

import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import {
  ZIP_11_TECHNIQUES,
  ZIP_4_LAWS,
  ZIP_CUE_BOX,
  ZIP_8_DIAGNOSE_QUESTIONS,
} from '../src/lib/habit/dp01d-content-patch'
import { DEFAULT_DP01_CONTENT } from '../src/lib/habit/dp01-content'

const isApply = process.env.APPLY === 'true'
const payload = await getPayload({ config })

try {
  console.log('======================================================================')
  console.log(
    isApply
      ? '🚀 [APPLY] DP-01D HABIT CONTENT IMPORT - ĐANG GHI VÀO DATABASE'
      : '🔍 [DRY-RUN] DP-01D HABIT CONTENT IMPORT - CHƯA GHI VÀO DATABASE',
  )
  console.log('======================================================================\n')

  // 1. KỸ THUẬT THỰC HÀNH (techniques)
  console.log('--- 1. Kiểm tra 11 kỹ thuật Atomic Habits ---')
  const existingTechResult = await payload.find({
    collection: 'techniques',
    limit: 200,
    depth: 0,
    draft: true,
  })
  const existingTechs = existingTechResult.docs

  const techToCreate: typeof ZIP_11_TECHNIQUES = []
  const techToUpdate: Array<{ id: number | string; patch: (typeof ZIP_11_TECHNIQUES)[0] }> = []

  for (const targetTech of ZIP_11_TECHNIQUES) {
    const existing = existingTechs.find((t) => t.name?.trim() === targetTech.name.trim())
    if (!existing) {
      techToCreate.push(targetTech)
    } else {
      techToUpdate.push({ id: existing.id, patch: targetTech })
    }
  }

  console.log(`- Kỹ thuật cần tạo mới: ${techToCreate.length}`)
  for (const t of techToCreate) {
    console.log(`  + [Tạo] #${t.order} ${t.name} (${t.stage})`)
  }
  console.log(`- Kỹ thuật cần cập nhật: ${techToUpdate.length}`)
  for (const { id, patch: t } of techToUpdate) {
    console.log(`  * [Cập nhật ID: ${id}] #${t.order} ${t.name} (${t.stage})`)
  }

  // QA DP-01d: older techniques with other names stay published and would show next to the
  // 11 zip techniques in step 5. The script never unpublishes them (existing plans may point to
  // them); it only lists them so the owner can switch them to draft in the CMS.
  const zipNames = new Set(ZIP_11_TECHNIQUES.map((t) => t.name.trim()))
  const otherPublished = existingTechs.filter(
    (t) => t._status === 'published' && !zipNames.has(t.name?.trim() ?? ''),
  )
  if (otherPublished.length > 0) {
    console.log(
      `\n⚠️  Còn ${otherPublished.length} kỹ thuật cũ đang xuất bản, sẽ hiện cùng 11 kỹ thuật zip ở bước 5.`,
    )
    console.log('   Vào CMS → Kỹ thuật, chuyển các bản dưới đây sang nháp nếu không dùng nữa:')
    for (const t of otherPublished) {
      console.log(`  - ID ${t.id}: ${t.name} (${t.stage})`)
    }
  }

  // 2. GLOBAL HABIT JOURNEY CONTENT (loop.laws, loop.cueBox, diagnose.questions)
  console.log('\n--- 2. Kiểm tra global habitJourneyContent (4 quy luật, cue box, 8 câu hỏi) ---')
  const currentGlobal = await payload.findGlobal({
    slug: 'habitJourneyContent',
    depth: 0,
  })

  console.log('  * 4 quy luật (loop.laws):', ZIP_4_LAWS.map((l) => l.lawChip).join(', '))
  console.log('  * Khối lưu ý Cue (loop.cueBox):', ZIP_CUE_BOX.boldText)
  console.log(
    '  * 8 câu hỏi bước 1 (diagnose.questions):',
    ZIP_8_DIAGNOSE_QUESTIONS.length,
    'câu hỏi nguyên văn zip',
  )

  if (!isApply) {
    console.log('\n======================================================================')
    console.log('👉 Để ghi vào database, chạy lại với APPLY=true:')
    console.log('   APPLY=true pnpm payload run scripts/dp01d-habit-content.ts < /dev/null')
    console.log('======================================================================')
  } else {
    // 3. APPLY: Backup trước khi ghi
    const backupDir = path.resolve(process.cwd(), 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(backupDir, `dp01d-habit-content-backup-${timestamp}.json`)
    fs.writeFileSync(
      backupPath,
      JSON.stringify(
        {
          techniques: existingTechs,
          habitJourneyContent: currentGlobal,
        },
        null,
        2,
      ),
      'utf-8',
    )
    console.log(`\n📦 Đã lưu bản sao lưu an toàn tại: ${backupPath}`)

    // 4. Ghi kỹ thuật
    for (const t of techToCreate) {
      await payload.create({
        collection: 'techniques',
        data: {
          name: t.name,
          stage: t.stage,
          order: t.order,
          description: t.description,
          examples: t.examples,
          applyTemplate: t.applyTemplate,
          exampleVideoUrl: t.exampleVideoUrl,
          _status: 'published',
        },
      })
      console.log(`  ✅ Đã tạo kỹ thuật: ${t.name}`)
    }

    for (const { id, patch: t } of techToUpdate) {
      await payload.update({
        collection: 'techniques',
        id,
        data: {
          stage: t.stage,
          order: t.order,
          description: t.description,
          examples: t.examples,
          applyTemplate: t.applyTemplate,
          exampleVideoUrl: t.exampleVideoUrl,
          _status: 'published',
        },
      })
      console.log(`  ✅ Đã cập nhật kỹ thuật ID ${id}: ${t.name}`)
    }

    // 5. Ghi global habitJourneyContent
    function patchGroup<T extends object>(
      current: Record<string, unknown> | undefined | null,
      defaults: T,
    ): T {
      const res: Record<string, unknown> = { ...(current || {}) }
      for (const [k, v] of Object.entries(defaults as Record<string, unknown>)) {
        if (res[k] === undefined || res[k] === null || res[k] === '') {
          res[k] = v
        }
      }
      return res as T
    }

    const currentHeader = (currentGlobal?.header || {}) as Record<string, unknown>
    const currentStep1 = (currentGlobal?.step1 || {}) as Record<string, unknown>
    const currentStep2 = (currentGlobal?.step2 || {}) as Record<string, unknown>
    const currentStep3 = (currentGlobal?.step3 || {}) as Record<string, unknown>
    const currentStep4 = (currentGlobal?.step4 || {}) as Record<string, unknown>
    const currentStep5 = (currentGlobal?.step5 || {}) as Record<string, unknown>
    const currentStep6 = (currentGlobal?.step6 || {}) as Record<string, unknown>
    const currentCheckIn = (currentGlobal?.checkIn || {}) as Record<string, unknown>
    const currentFooter = (currentGlobal?.footer || {}) as Record<string, unknown>

    const updatedGlobalData: Record<string, unknown> = {
      ...currentGlobal,
      loop: {
        ...(typeof currentGlobal?.loop === 'object' && currentGlobal.loop !== null
          ? (currentGlobal.loop as Record<string, unknown>)
          : {}),
        laws: ZIP_4_LAWS,
        cueBox: ZIP_CUE_BOX,
      },
      diagnose: {
        ...(typeof currentGlobal?.diagnose === 'object' && currentGlobal.diagnose !== null
          ? (currentGlobal.diagnose as Record<string, unknown>)
          : {}),
        questions: ZIP_8_DIAGNOSE_QUESTIONS,
      },
      header: patchGroup(currentHeader, DEFAULT_DP01_CONTENT.header),
      step1: patchGroup(currentStep1, DEFAULT_DP01_CONTENT.step1),
      step2: patchGroup(currentStep2, DEFAULT_DP01_CONTENT.step2),
      step3: patchGroup(currentStep3, DEFAULT_DP01_CONTENT.step3),
      step4: patchGroup(currentStep4, {
        ...DEFAULT_DP01_CONTENT.step4,
        suggestedRoles: DEFAULT_DP01_CONTENT.step4.suggestedRoles.join('\n'),
        suggestedAtomicHabits: DEFAULT_DP01_CONTENT.step4.suggestedAtomicHabits.join('\n'),
      }),
      step5: patchGroup(currentStep5, DEFAULT_DP01_CONTENT.step5),
      step6: patchGroup(currentStep6, DEFAULT_DP01_CONTENT.step6),
      checkIn: patchGroup(currentCheckIn, DEFAULT_DP01_CONTENT.checkIn),
      footer: patchGroup(currentFooter, DEFAULT_DP01_CONTENT.footer),
    }

    await payload.updateGlobal({
      slug: 'habitJourneyContent',
      data: updatedGlobalData,
    })
    console.log(
      '  ✅ Đã cập nhật global habitJourneyContent (laws, cueBox, 8 câu hỏi zip, và toàn bộ chữ các màn)!',
    )

    console.log('\n======================================================================')
    console.log('🎉 ĐÃ HOÀN TẤT NẠP NỘI DUNG DP-01D VÀO DATABASE!')
    console.log('======================================================================')
  }
} catch (error) {
  console.error('❌ Lỗi khi thực hiện dp01d-habit-content:', error)
  process.exit(1)
} finally {
  await payload.destroy()
}
process.exit(0)
