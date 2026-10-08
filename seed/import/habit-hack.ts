import type { CollectionSlug, Payload } from 'payload'
import { lexical } from '../data'
import { courseModules, diagnosticQuestions } from './habit-hack-data'

type LooseWriter = {
  create(args: Record<string, unknown>): Promise<{ id: number }>
  delete(args: Record<string, unknown>): Promise<unknown>
}

export type ImportReport = Record<
  string,
  { created: number; keptExisting: number; samplesRemoved: number }
>

/** Collections whose sample records give way to Hana's real content. */
export const habitCollections: CollectionSlug[] = [
  'lessons',
  'techniques',
  'courseModules',
  'diagnosticQuestions',
]

/**
 * Imports the real Habit Hack content (isSample = false, published).
 * A record that already exists with the same key is kept as is, so re-running never
 * overwrites edits Hana made in the CMS. Sample records in the same collections are removed;
 * `pnpm seed` no longer recreates them once real records exist.
 */
export async function importHabitHack(payload: Payload): Promise<ImportReport> {
  const writer = payload as unknown as LooseWriter
  const report: ImportReport = {}
  const tally = (collection: string) =>
    (report[collection] ??= { created: 0, keptExisting: 0, samplesRemoved: 0 })

  async function ensure(
    collection: CollectionSlug,
    key: string,
    value: string,
    doc: Record<string, unknown>,
  ): Promise<number> {
    const existing = await payload.find({
      collection,
      where: { [key]: { equals: value } },
      limit: 1,
      depth: 0,
      draft: true,
    })
    const found = existing.docs[0] as { id: number } | undefined
    if (found) {
      tally(collection).keptExisting++
      return found.id
    }
    const created = await writer.create({
      collection,
      data: { ...doc, [key]: value, isSample: false, _status: 'published' },
    })
    tally(collection).created++
    return created.id
  }

  for (const [i, { statement, stage, suggestion }] of diagnosticQuestions.entries())
    await ensure('diagnosticQuestions', 'statement', statement, {
      stage,
      suggestion: lexical(suggestion),
      order: i + 1,
    })

  let lessonOrder = 0
  for (const [m, { title, group, lessons }] of courseModules.entries()) {
    const moduleId = await ensure('courseModules', 'title', title, { group, order: m + 1 })
    for (const lesson of lessons) {
      lessonOrder++
      const lessonId = await ensure('lessons', 'title', lesson.title, {
        module: moduleId,
        stage: lesson.stage,
        order: lessonOrder,
        isFreePreview: false,
      })
      if (lesson.technique) {
        const { name, howTo, example } = lesson.technique
        await ensure('techniques', 'name', name, {
          stage: lesson.stage,
          ...(howTo ? { howTo: lexical(howTo) } : {}),
          ...(example ? { example: lexical(example) } : {}),
          lesson: lessonId,
        })
      }
    }
  }

  // Lessons reference modules and techniques reference lessons: delete in that order.
  for (const collection of habitCollections) {
    const samples = await payload.find({
      collection,
      where: { isSample: { equals: true } },
      limit: 1000,
      depth: 0,
      draft: true,
      pagination: false,
    })
    for (const doc of samples.docs as { id: number }[]) {
      await writer.delete({ collection, id: doc.id })
      tally(collection).samplesRemoved++
    }
  }
  return report
}
