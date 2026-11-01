import 'server-only'
import type { Payload } from 'payload'
import type { HabitBackupReflection } from './backup'
import { splitJourneyIntoStations } from './stations'

export interface StationReflectionView {
  id: number
  stationIndex: number
  answers: {
    question: string
    answer: string
  }[]
  updatedAt?: string
}

/**
 * REVIEW-REQUIRED (HB-12c): server-only read of a plan's station reflections.
 * Lives outside the 'use server' module on purpose: every export of a 'use server' file is a
 * callable action, and this one takes a customer id. Callers pass the id from the session
 * (getCurrentCustomer), never from the client.
 */
export async function getStationReflectionsForPlan(
  payload: Payload,
  planId: number,
  customerId: number,
): Promise<StationReflectionView[]> {
  const res = await payload.find({
    collection: 'habitReflections',
    where: {
      and: [{ plan: { equals: planId } }, { customer: { equals: customerId } }],
    },
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  return res.docs.map((doc) => ({
    id: doc.id,
    stationIndex: Number(doc.stationIndex),
    answers: (doc.answers || []).map((a) => ({
      question: a.question,
      answer: a.answer || '',
    })),
    updatedAt: doc.updatedAt,
  }))
}

/** Reflections of a plan in the backup / CSV shape (HB-13 file format). */
export async function loadPlanReflectionsForBackup(
  payload: Payload,
  planId: number,
  stationNames: readonly (string | null | undefined)[] = [],
): Promise<HabitBackupReflection[]> {
  const res = await payload.find({
    collection: 'habitReflections',
    where: { plan: { equals: planId } },
    pagination: false,
    depth: 0,
    sort: 'stationIndex',
    overrideAccess: true,
  })

  return res.docs.map((doc) => {
    const stationIndex = Number(doc.stationIndex)
    return {
      stationIndex,
      stationName: stationNames[stationIndex] || null,
      answers: (doc.answers || []).map((a) => ({
        question: a.question,
        answer: a.answer || '',
      })),
      updatedAt: doc.updatedAt,
    }
  })
}

/**
 * Day a station's reflection opens: the day after the station's last day. Null when the
 * station index does not exist for this journey. Same rule as saveStationReflection.
 */
export function stationReflectionOpenDay(
  journeyDays: number,
  stationCount: number,
  stationIndex: number,
): number | null {
  const range = splitJourneyIntoStations(journeyDays, Math.max(1, stationCount)).find(
    (r) => r.index === stationIndex,
  )
  return range ? range.toDay + 1 : null
}
