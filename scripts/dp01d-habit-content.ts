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
    }

    await payload.updateGlobal({
      slug: 'habitJourneyContent',
      data: updatedGlobalData,
    })
    console.log('  ✅ Đã cập nhật global habitJourneyContent (laws, cueBox, 8 câu hỏi zip)!')

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
