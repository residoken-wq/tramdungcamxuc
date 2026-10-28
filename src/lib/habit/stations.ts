/**
 * Pure station split shared by the server content reader (HB-07) and the tracker view (HB-11).
 * Kept in its own module because `journey-content.server.ts` is server-only.
 */

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
