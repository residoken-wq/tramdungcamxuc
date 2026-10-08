// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { importHabitHack } from '../../seed/import/habit-hack'
import { courseModules, diagnosticQuestions } from '../../seed/import/habit-hack-data'

type Doc = Record<string, unknown> & { id: number }

/** In-memory stand-in for the few Payload calls the importer makes. */
function fakePayload(initial: Record<string, Doc[]> = {}) {
  const db: Record<string, Doc[]> = structuredClone(initial)
  let nextId = 1000
  const matches = (doc: Doc, where: Record<string, { equals: unknown }>) =>
    Object.entries(where).every(([k, cond]) => doc[k] === cond.equals)
  const payload = {
    find: async ({
      collection,
      where,
    }: {
      collection: string
      where: Record<string, { equals: unknown }>
    }) => ({
      docs: (db[collection] ?? []).filter((d) => matches(d, where)),
    }),
    create: async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
      const doc = { ...data, id: nextId++ }
      ;(db[collection] ??= []).push(doc)
      return doc
    },
    delete: async ({ collection, id }: { collection: string; id: number }) => {
      db[collection] = (db[collection] ?? []).filter((d) => d.id !== id)
    },
  }
  return { db, payload: payload as unknown as Payload }
}

const lessons = courseModules.flatMap((m) => m.lessons)
const techniques = lessons.flatMap((l) => (l.technique ? [l.technique] : []))

describe('Habit Hack workbook data', () => {
  it('has the 16 questions, 20 lessons and 11 techniques of the workbook', () => {
    expect(diagnosticQuestions).toHaveLength(16)
    expect(lessons).toHaveLength(20)
    expect(techniques).toHaveLength(11)
  })

  it('keeps the stage split of sheet "Khảo sát trì hoãn"', () => {
    const count = (s: string) => diagnosticQuestions.filter((q) => q.stage === s).length
    expect([count('cue'), count('craving'), count('response'), count('reward')]).toEqual([
      6, 3, 5, 2,
    ])
  })

  it('carries no sample marker, numbering or personal contact', () => {
    const text = JSON.stringify({ diagnosticQuestions, courseModules })
    expect(text).not.toContain('[MẪU]')
    expect(text).not.toMatch(/@|\$\d/)
    for (const q of diagnosticQuestions) expect(q.statement).not.toMatch(/^\d+\./)
  })
})

describe('importHabitHack', () => {
  it('creates published real records and links each technique to its lesson', async () => {
    const { db, payload } = fakePayload()
    const report = await importHabitHack(payload)
    expect(report.diagnosticQuestions.created).toBe(16)
    expect(report.lessons.created).toBe(20)
    expect(report.techniques.created).toBe(11)
    expect(report.courseModules.created).toBe(7)
    for (const doc of Object.values(db).flat()) {
      expect(doc.isSample).toBe(false)
      expect(doc._status).toBe('published')
    }
    const lessonIds = new Set(db.lessons.map((l) => l.id))
    for (const t of db.techniques) expect(lessonIds.has(t.lesson as number)).toBe(true)
  })

  it('never overwrites a record Hana already edited and is safe to re-run', async () => {
    const { db, payload } = fakePayload()
    await importHabitHack(payload)
    const edited = db.diagnosticQuestions[0]
    edited.order = 99
    const again = await importHabitHack(payload)
    expect(again.diagnosticQuestions).toMatchObject({ created: 0, keptExisting: 16 })
    expect(db.diagnosticQuestions).toHaveLength(16)
    expect(edited.order).toBe(99)
  })

  it('removes sample records only', async () => {
    const { db, payload } = fakePayload({
      diagnosticQuestions: [
        { id: 1, statement: '[MẪU] Tình huống trì hoãn 1', isSample: true },
        { id: 2, statement: 'Câu Hana tự thêm', isSample: false },
      ],
      lessons: [{ id: 3, title: '[MẪU] Bài 1', isSample: true }],
    })
    const report = await importHabitHack(payload)
    expect(report.diagnosticQuestions.samplesRemoved).toBe(1)
    expect(report.lessons.samplesRemoved).toBe(1)
    expect(db.diagnosticQuestions.map((d) => d.id)).toContain(2)
    expect(db.diagnosticQuestions.some((d) => d.isSample)).toBe(false)
  })
})
