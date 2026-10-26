import 'server-only'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { HabitJourneyContent } from '@/payload-types'

export interface StationRange {
  index: number
  fromDay: number
  toDay: number
}

/**
 * Chia đều số ngày hành trình cho các trạm, phần dư dồn vào các trạm đầu.
 * Nếu số trạm > số ngày, mỗi trạm tối thiểu 1 ngày và bớt số trạm.
 * Hàm thuần túy, không đọc cơ sở dữ liệu.
 */
export function splitJourneyIntoStations(
  journeyDays: number,
  stationCount: number,
): StationRange[] {
  if (journeyDays <= 0 || stationCount <= 0) {
    return []
  }

  const effectiveStations = Math.min(stationCount, journeyDays)
  const baseDays = Math.floor(journeyDays / effectiveStations)
  const remainder = journeyDays % effectiveStations

  const ranges: StationRange[] = []
  let currentFromDay = 1

  for (let i = 0; i < effectiveStations; i++) {
    const daysInStation = baseDays + (i < remainder ? 1 : 0)
    const toDay = currentFromDay + daysInStation - 1
    ranges.push({
      index: i,
      fromDay: currentFromDay,
      toDay,
    })
    currentFromDay = toDay + 1
  }

  return ranges
}

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

export interface HabitJourneyContentResult {
  stations: CleanHabitStation[]
  quotes: CleanHabitQuote[]
  onePercent: CleanHabitOnePercent
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
      onePercent: {
        title: null,
        intro: null,
        dailyPercent: 1,
        maxDays: 365,
        facts: [],
      },
    }
  }

  const rawStations = Array.isArray(content.stations) ? content.stations : []
  const stations: CleanHabitStation[] = rawStations
    .filter(
      (s): s is NonNullable<typeof s> =>
        Boolean(s && typeof s.name === 'string' && s.name.trim().length > 0),
    )
    .map((s) => ({
      id: s.id ?? null,
      name: s.name.trim(),
      tagline: s.tagline?.trim() || null,
      reflectionQuestions: (Array.isArray(s.reflectionQuestions) ? s.reflectionQuestions : [])
        .filter(
          (q): q is NonNullable<typeof q> =>
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
    onePercent: {
      title: rawOnePercent?.title?.trim() || null,
      intro: rawOnePercent?.intro ?? null,
      dailyPercent,
      maxDays,
      facts,
    },
  }
}
