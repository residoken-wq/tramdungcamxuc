import 'server-only'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { HabitJourneyContent } from '@/payload-types'
import { HABIT_STAGES, type HabitStage } from '@/lib/diagnostic'

export { splitJourneyIntoStations, type StationRange } from './stations'

export interface CleanStationReflectionQuestion {
  id?: string | null
  question: string
}

export interface CleanHabitStation {
  id?: string | null
  name: string
  tagline?: string | null
  reflectionQuestions: CleanStationReflectionQuestion[]
}

export interface CleanHabitQuote {
  id?: string | null
  text: string
  author: string
  source: string
  sourceUrl?: string | null
  isActive?: boolean | null
}

export interface CleanHabitFact {
  id?: string | null
  statement: string
  sourceLabel: string
  sourceUrl?: string | null
}

export interface CleanHabitOnePercent {
  title?: string | null
  intro?: unknown
  dailyPercent: number
  maxDays: number
  facts: CleanHabitFact[]
}

export interface CleanHabitDiagnoseQuote {
  text: string
  author: string
  source: string
  sourceUrl?: string | null
}

export interface CleanHabitDiagnoseStat {
  id?: string | null
  value: string
  label: string
  source: string
  sourceUrl?: string | null
}

export interface CleanHabitDiagnoseQuestion {
  id?: string | null
  statement: string
  stage: HabitStage
  isActive?: boolean | null
}

export interface CleanHabitDiagnoseStageResult {
  title?: string | null
  suggestion?: unknown
  nextStepHint?: string | null
}

export interface CleanHabitDiagnose {
  title?: string | null
  intro?: unknown
  quote: CleanHabitDiagnoseQuote | null
  stats: CleanHabitDiagnoseStat[]
  questions: CleanHabitDiagnoseQuestion[]
  stageResults: Record<HabitStage, CleanHabitDiagnoseStageResult>
}

export interface HabitJourneyContentResult {
  stations: CleanHabitStation[]
  quotes: CleanHabitQuote[]
  onePercent: CleanHabitOnePercent
  diagnose: CleanHabitDiagnose
}

const VALID_STAGES = new Set<string>(HABIT_STAGES)

export function getDefaultCleanHabitDiagnose(): CleanHabitDiagnose {
  return {
    title: null,
    intro: null,
    quote: null,
    stats: [],
    questions: [],
    stageResults: {
      cue: { title: null, suggestion: null, nextStepHint: null },
      craving: { title: null, suggestion: null, nextStepHint: null },
      response: { title: null, suggestion: null, nextStepHint: null },
      reward: { title: null, suggestion: null, nextStepHint: null },
    },
  }
}

async function resolvePayload(injected?: Payload): Promise<Payload> {
  if (injected) return injected
  return await getPayload({ config })
}

/**
 * Đọc cấu hình nội dung hành trình Habit từ global Payload CMS.
 * Trả về kiểu dữ liệu đã làm sạch và áp dụng giá trị mặc định.
 */
export async function getHabitJourneyContent(
  payloadInstance?: Payload,
): Promise<HabitJourneyContentResult> {
  let content: HabitJourneyContent | null = null
  try {
    const payload = await resolvePayload(payloadInstance)
    content = (await payload.findGlobal({
      slug: 'habitJourneyContent',
      depth: 0,
    })) as HabitJourneyContent | null
  } catch {
    content = null
  }

  if (!content) {
    return {
      stations: [],
      quotes: [],
      onePercent: {
        title: null,
        intro: null,
        dailyPercent: 1,
        maxDays: 365,
        facts: [],
      },
      diagnose: getDefaultCleanHabitDiagnose(),
    }
  }

  const rawStations = Array.isArray(content.stations) ? content.stations : []
  const stations: CleanHabitStation[] = rawStations
    .filter((s): s is NonNullable<typeof s> =>
      Boolean(s && typeof s.name === 'string' && s.name.trim().length > 0),
    )
    .map((s) => ({
      id: s.id ?? null,
      name: s.name.trim(),
      tagline: s.tagline?.trim() || null,
      reflectionQuestions: (Array.isArray(s.reflectionQuestions) ? s.reflectionQuestions : [])
        .filter((q): q is NonNullable<typeof q> =>
          Boolean(q && typeof q.question === 'string' && q.question.trim().length > 0),
        )
        .map((q) => ({
          id: q.id ?? null,
          question: q.question.trim(),
        })),
    }))

  const rawQuotes = Array.isArray(content.quotes) ? content.quotes : []
  const quotes: CleanHabitQuote[] = rawQuotes
    .filter((q): q is NonNullable<typeof q> => {
      if (!q) return false
      if (q.isActive === false) return false
      return (
        typeof q.text === 'string' &&
        q.text.trim().length > 0 &&
        typeof q.author === 'string' &&
        q.author.trim().length > 0 &&
        typeof q.source === 'string' &&
        q.source.trim().length > 0
      )
    })
    .map((q) => ({
      id: q.id ?? null,
      text: q.text.trim(),
      author: q.author.trim(),
      source: q.source.trim(),
      sourceUrl: q.sourceUrl?.trim() || null,
      isActive: q.isActive ?? true,
    }))

  const rawOnePercent = content.onePercent
  const dailyPercent =
    typeof rawOnePercent?.dailyPercent === 'number' && Number.isFinite(rawOnePercent.dailyPercent)
      ? rawOnePercent.dailyPercent
      : 1
  const maxDays =
    typeof rawOnePercent?.maxDays === 'number' && Number.isFinite(rawOnePercent.maxDays)
      ? rawOnePercent.maxDays
      : 365

  const rawFacts = Array.isArray(rawOnePercent?.facts) ? rawOnePercent.facts : []
  const facts: CleanHabitFact[] = rawFacts
    .filter((f): f is NonNullable<typeof f> => {
      if (!f) return false
      return (
        typeof f.statement === 'string' &&
        f.statement.trim().length > 0 &&
        typeof f.sourceLabel === 'string' &&
        f.sourceLabel.trim().length > 0
      )
    })
    .map((f) => ({
      id: f.id ?? null,
      statement: f.statement.trim(),
      sourceLabel: f.sourceLabel.trim(),
      sourceUrl: f.sourceUrl?.trim() || null,
    }))

  const rawDiagnose = content.diagnose
  const rawQuote = rawDiagnose?.quote
  const cleanQuote: CleanHabitDiagnoseQuote | null =
    rawQuote &&
    typeof rawQuote.text === 'string' &&
    rawQuote.text.trim().length > 0 &&
    typeof rawQuote.author === 'string' &&
    rawQuote.author.trim().length > 0 &&
    typeof rawQuote.source === 'string' &&
    rawQuote.source.trim().length > 0
      ? {
          text: rawQuote.text.trim(),
          author: rawQuote.author.trim(),
          source: rawQuote.source.trim(),
          sourceUrl: rawQuote.sourceUrl?.trim() || null,
        }
      : null

  const rawStats = Array.isArray(rawDiagnose?.stats) ? rawDiagnose.stats : []
  const stats: CleanHabitDiagnoseStat[] = rawStats
    .filter((s): s is NonNullable<typeof s> => {
      if (!s) return false
      return (
        typeof s.value === 'string' &&
        s.value.trim().length > 0 &&
        typeof s.label === 'string' &&
        s.label.trim().length > 0 &&
        typeof s.source === 'string' &&
        s.source.trim().length > 0
      )
    })
    .map((s) => ({
      id: s.id ?? null,
      value: s.value.trim(),
      label: s.label.trim(),
      source: s.source.trim(),
      sourceUrl: s.sourceUrl?.trim() || null,
    }))

  const rawQuestions = Array.isArray(rawDiagnose?.questions) ? rawDiagnose.questions : []
  const questions: CleanHabitDiagnoseQuestion[] = rawQuestions
    .filter((q): q is NonNullable<typeof q> => {
      if (!q) return false
      if (q.isActive === false) return false
      return (
        typeof q.statement === 'string' &&
        q.statement.trim().length > 0 &&
        typeof q.stage === 'string' &&
        VALID_STAGES.has(q.stage)
      )
    })
    .map((q) => ({
      id: q.id ?? null,
      statement: q.statement.trim(),
      stage: q.stage as HabitStage,
      isActive: q.isActive ?? true,
    }))

  const stageResults = getDefaultCleanHabitDiagnose().stageResults
  for (const stg of HABIT_STAGES) {
    const rawStage = rawDiagnose?.stageResults?.[stg]
    stageResults[stg] = {
      title: rawStage?.title?.trim() || null,
      suggestion: rawStage?.suggestion ?? null,
      nextStepHint: rawStage?.nextStepHint?.trim() || null,
    }
  }

  return {
    stations,
    quotes,
    onePercent: {
      title: rawOnePercent?.title?.trim() || null,
      intro: rawOnePercent?.intro ?? null,
      dailyPercent,
      maxDays,
      facts,
    },
    diagnose: {
      title: rawDiagnose?.title?.trim() || null,
      intro: rawDiagnose?.intro ?? null,
      quote: cleanQuote,
      stats,
      questions,
      stageResults,
    },
  }
}
