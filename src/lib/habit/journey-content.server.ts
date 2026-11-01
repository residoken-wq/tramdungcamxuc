import 'server-only'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { HabitJourneyContent, SiteSetting } from '@/payload-types'
import type { HabitStage } from '../diagnostic'
import { HABIT_STAGES } from '../diagnostic'
import { isHabitStage, type FlowDiagnoseQuestion } from './flow-content'

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

export interface CleanTitledText {
  title: string
  body: string | null
}

export interface CleanStepQuote {
  text: string
  author: string
  source: string
  sourceUrl?: string | null
}

export interface CleanHabitStepQuotes {
  onePercent: CleanStepQuote | null
  mentor: CleanStepQuote | null
  name: CleanStepQuote | null
  loop: CleanStepQuote | null
  boardingPass: CleanStepQuote | null
  tracker: CleanStepQuote | null
}

export interface CleanHabitTrackerContent {
  afterJourneyTitle: string | null
  afterJourneyText: string | null
}

export interface CleanHabitSiteSettings {
  habitCoachBookingUrl: string | null
  habitDonationEnabled: boolean
  habitDonationUrl: string | null
}

export interface CleanHabitOnePercent {
  title?: string | null
  intro?: unknown
  dailyPercent: number
  maxDays: number
  facts: CleanHabitFact[]
  closing?: string | null
}

/** HB-24: step 1 "Khám đúng bệnh". */
export interface CleanHabitDiagnose {
  title: string | null
  intro: unknown
  /** Null unless text, author and source are all present (AGENTS §14: no unsourced quote). */
  quote: { text: string; author: string; source: string; sourceUrl: string | null } | null
  /** Only stats with a source. */
  stats: { value: string; label: string; sourceLabel: string; sourceUrl: string | null }[]
  questions: FlowDiagnoseQuestion[]
  scaleMinLabel: string | null
  scaleMaxLabel: string | null
  /** At most one result per stage, in Cue → Reward order. */
  results: { stage: HabitStage; title: string; suggestion: string }[]
}

/** HB-24: step 5 "Vòng lặp". */
export interface CleanHabitLoop {
  intro: unknown
  /** At most one explanation per stage, in Cue → Reward order. */
  stages: { stage: HabitStage; title: string; explanation: string }[]
  rules: CleanTitledText[]
  note: string | null
  techniqueHint: string | null
}

export interface HabitJourneyContentResult {
  stations: CleanHabitStation[]
  quotes: CleanHabitQuote[]
  stepQuotes: CleanHabitStepQuotes
  onePercent: CleanHabitOnePercent
  /** HB-24: "3 điều có thể bạn chưa biết" (step 2), stored under `onePercent.unknowns`. */
  onePercentUnknowns: CleanTitledText[]
  diagnose: CleanHabitDiagnose
  loop: CleanHabitLoop
  tracker: CleanHabitTrackerContent
  /** HB-24: step 6 caption template; null when empty. */
  boardingPassCaption: string | null
  /** HB-24: data/privacy sentence written by Hana; null when empty. */
  privacyNote: string | null
}

const trimmed = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null

function cleanTitledRows(rows: unknown): CleanTitledText[] {
  if (!Array.isArray(rows)) return []
  return rows.flatMap((row: { title?: unknown; body?: unknown } | null) => {
    const title = trimmed(row?.title)
    return title ? [{ title, body: trimmed(row?.body) }] : []
  })
}

/** Keeps the first valid row per stage and orders rows Cue → Craving → Response → Reward. */
function onePerStage<T extends { stage: HabitStage }>(rows: T[]): T[] {
  return HABIT_STAGES.flatMap((stage) => rows.find((row) => row.stage === stage) ?? [])
}

function cleanDiagnose(raw: HabitJourneyContent['diagnose'] | null): CleanHabitDiagnose {
  const quoteText = trimmed(raw?.quote?.text)
  const quoteAuthor = trimmed(raw?.quote?.author)
  const quoteSource = trimmed(raw?.quote?.source)
  const stats = (Array.isArray(raw?.stats) ? raw.stats : []).flatMap((row) => {
    const value = trimmed(row?.value)
    const label = trimmed(row?.label)
    const sourceLabel = trimmed(row?.sourceLabel)
    return value && label && sourceLabel
      ? [{ value, label, sourceLabel, sourceUrl: trimmed(row?.sourceUrl) }]
      : []
  })
  const questions = (Array.isArray(raw?.questions) ? raw.questions : []).flatMap((row) => {
    const statement = trimmed(row?.statement)
    return statement && isHabitStage(row?.stage) ? [{ statement, stage: row.stage }] : []
  })
  const results = (Array.isArray(raw?.results) ? raw.results : []).flatMap((row) => {
    const title = trimmed(row?.title)
    const suggestion = trimmed(row?.suggestion)
    return title && suggestion && isHabitStage(row?.stage)
      ? [{ stage: row.stage, title, suggestion }]
      : []
  })
  return {
    title: trimmed(raw?.title),
    intro: raw?.intro ?? null,
    quote:
      quoteText && quoteAuthor && quoteSource
        ? {
            text: quoteText,
            author: quoteAuthor,
            source: quoteSource,
            sourceUrl: trimmed(raw?.quote?.sourceUrl),
          }
        : null,
    stats,
    questions,
    scaleMinLabel: trimmed(raw?.scaleMinLabel),
    scaleMaxLabel: trimmed(raw?.scaleMaxLabel),
    results: onePerStage(results),
  }
}

function cleanStepQuote(
  raw:
    | {
        text?: string | null
        author?: string | null
        source?: string | null
        sourceUrl?: string | null
      }
    | null
    | undefined,
): CleanStepQuote | null {
  const text = trimmed(raw?.text)
  const author = trimmed(raw?.author)
  const source = trimmed(raw?.source)
  if (!text || !author || !source) return null
  return {
    text,
    author,
    source,
    sourceUrl: trimmed(raw?.sourceUrl),
  }
}

function cleanStepQuotes(
  raw: HabitJourneyContent['stepQuotes'] | null | undefined,
): CleanHabitStepQuotes {
  return {
    onePercent: cleanStepQuote(raw?.onePercent),
    mentor: cleanStepQuote(raw?.mentor),
    name: cleanStepQuote(raw?.name),
    loop: cleanStepQuote(raw?.loop),
    boardingPass: cleanStepQuote(raw?.boardingPass),
    tracker: cleanStepQuote(raw?.tracker),
  }
}

function cleanTrackerContent(
  raw: HabitJourneyContent['tracker'] | null | undefined,
): CleanHabitTrackerContent {
  return {
    afterJourneyTitle: trimmed(raw?.afterJourneyTitle),
    afterJourneyText: trimmed(raw?.afterJourneyText),
  }
}

function cleanLoop(raw: HabitJourneyContent['loop'] | null): CleanHabitLoop {
  const stages = (Array.isArray(raw?.stages) ? raw.stages : []).flatMap((row) => {
    const title = trimmed(row?.title)
    const explanation = trimmed(row?.explanation)
    return title && explanation && isHabitStage(row?.stage)
      ? [{ stage: row.stage, title, explanation }]
      : []
  })
  return {
    intro: raw?.intro ?? null,
    stages: onePerStage(stages),
    rules: cleanTitledRows(raw?.rules),
    note: trimmed(raw?.note),
    techniqueHint: trimmed(raw?.techniqueHint),
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
  const payload = await resolvePayload(payloadInstance)
  const content = (await payload.findGlobal({
    slug: 'habitJourneyContent',
    depth: 0,
  })) as HabitJourneyContent | null

  if (!content) {
    return {
      stations: [],
      quotes: [],
      stepQuotes: cleanStepQuotes(null),
      onePercent: {
        title: null,
        intro: null,
        dailyPercent: 1,
        maxDays: 365,
        facts: [],
        closing: null,
      },
      onePercentUnknowns: [],
      diagnose: cleanDiagnose(null),
      loop: cleanLoop(null),
      tracker: cleanTrackerContent(null),
      boardingPassCaption: null,
      privacyNote: null,
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

  return {
    stations,
    quotes,
    stepQuotes: cleanStepQuotes(content.stepQuotes),
    onePercent: {
      title: rawOnePercent?.title?.trim() || null,
      intro: rawOnePercent?.intro ?? null,
      dailyPercent,
      maxDays,
      facts,
      closing: trimmed(rawOnePercent?.closing),
    },
    onePercentUnknowns: cleanTitledRows(rawOnePercent?.unknowns).slice(0, 3),
    diagnose: cleanDiagnose(content.diagnose),
    loop: cleanLoop(content.loop),
    tracker: cleanTrackerContent(content.tracker),
    boardingPassCaption: trimmed(content.boardingPass?.captionTemplate),
    privacyNote: trimmed(content.privacyNote),
  }
}

/**
 * Đọc 3 cấu hình liên kết coaching và ủng hộ từ SiteSettings.
 * HB-18c: link Ủng hộ chỉ trả về khi công tắc đang bật (Hana đã duyệt), để nơi hiển thị
 * không thể vô tình hiện link khi mới chỉ nhập URL.
 */
export async function getHabitSiteSettings(
  payloadInstance?: Payload,
): Promise<CleanHabitSiteSettings> {
  const payload = await resolvePayload(payloadInstance)
  const settings = (await payload.findGlobal({
    slug: 'siteSettings',
    depth: 0,
  })) as SiteSetting | null

  const habitDonationEnabled = Boolean(settings?.habitDonationEnabled)
  return {
    habitCoachBookingUrl: trimmed(settings?.habitCoachBookingUrl),
    habitDonationEnabled,
    habitDonationUrl: habitDonationEnabled ? trimmed(settings?.habitDonationUrl) : null,
  }
}
