'use client'

import React, { useState } from 'react'
import confetti from 'canvas-confetti'
import {
  Flame,
  Share2,
  Download,
  Upload,
  RotateCcw,
  Check,
  ChevronDown,
  Lock,
  ExternalLink,
  FileSpreadsheet,
} from 'lucide-react'
import type { TrackerDayItem, WeeklyReflections } from '../types'
import { DayCheckInModal } from './DayCheckInModal'
import { StepQuoteHeader } from '../StepQuoteHeader'
import { TimelineProgress } from '../Timeline/TimelineProgress'
import { checkInDay, deleteCheckInDay } from '@/lib/habit/tracker-actions'
import { saveStationReflection } from '@/lib/habit/reflection-actions'
import { exportBackup, exportCsv, restoreBackup, restartJourney } from '@/lib/habit/my-data-actions'
import { planDayDate } from '@/lib/habit/tracker-stats'
import { TrackerSummaryCard } from '@/components/habit/TrackerSummaryCard'
import { CertificateShareButtons } from '@/components/habit/CertificateShareButtons'
import { CertificatePublicToggle } from '@/components/habit/CertificatePublicToggle'
import type { PublicCertificateData, CertificateEligibility } from '@/lib/habit/certificate-types'
import type { CheckinStatus } from '@/lib/habit/rhythm'
import type { Dp01CheckInContent } from '@/lib/habit/dp01-content'
import { vi } from '@/lib/i18n/vi'

export interface InitialCheckinData {
  day: number
  done?: boolean
  status?: CheckinStatus | null
  emotion?: string | null
  note?: string | null
}

export interface InitialReflectionData {
  id: number
  stationIndex: number
  answers: { question: string; answer: string }[]
  updatedAt?: string
}

export interface Dashboard28DaysProps {
  planId: number
  identityStatement?: string | null
  identityRole?: string | null
  identityAction?: string | null
  atomicHabit?: string | null
  selectedMentor?: string | null
  mentorTime?: string | null
  selectedDays?: string[] | null
  startDate?: string | Date | null
  journeyDays?: number
  stationNames?: string[] | null
  stationQuestions?: { question: string }[][] | null
  initialReflections?: InitialReflectionData[] | null
  currentDay: number
  initialCheckins: InitialCheckinData[]
  readOnly?: boolean
  isTrialOrExpired?: boolean
  buyUrl?: string
  initialCertificate?: PublicCertificateData | null
  eligibility?: CertificateEligibility | null
  customerName?: string | null
  privacyNote?: string | null
  afterJourneyTitle?: string | null
  afterJourneyText?: string | null
  coachBookingUrl?: string | null
  quote?: { quoteText?: string | null; quoteAuthor?: string | null } | null
  checkInContent?: Dp01CheckInContent
}

export function Dashboard28Days({
  planId,
  identityStatement,
  identityRole: propIdentityRole,
  identityAction: propIdentityAction,
  atomicHabit: propAtomicHabit,
  selectedMentor: propMentor,
  mentorTime: propMentorTime,
  selectedDays: propSelectedDays,
  startDate,
  journeyDays = 28,
  stationNames,
  stationQuestions,
  initialReflections,
  currentDay,
  initialCheckins,
  readOnly = false,
  isTrialOrExpired = false,
  buyUrl = '/thanh-toan?san-pham=habit-tracker',
  initialCertificate,
  eligibility,
  customerName,
  privacyNote,
  afterJourneyTitle,
  afterJourneyText,
  coachBookingUrl,
  quote,
  checkInContent,
}: Dashboard28DaysProps) {
  // Checkins state
  const [checkins, setCheckins] = useState<InitialCheckinData[]>(initialCheckins)
  const [selectedDayItem, setSelectedDayItem] = useState<TrackerDayItem | null>(null)
  const [copiedSummary, setCopiedSummary] = useState(false)
  const [isFabOpen, setIsFabOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Reflections state
  const defaultStationQuestions = [
    'Điều gì đã diễn ra tốt trong trạm này?',
    'Nút thắt hoặc lực cản lớn nhất bạn gặp phải?',
    'Chặng tới bạn chỉnh quy tắc nào?',
    'Một lời ghi nhận cho chính mình',
  ]

  const initReflectionsMap = (): Record<number, string[]> => {
    const map: Record<number, string[]> = {}
    for (let st = 0; st < 4; st++) {
      const existing = (initialReflections || []).find((r) => r.stationIndex === st)
      if (existing && existing.answers) {
        map[st] = existing.answers.map((a) => a.answer)
      } else {
        map[st] = ['', '', '', '']
      }
    }
    return map
  }

  const [reflectionsData, setReflectionsData] =
    useState<Record<number, string[]>>(initReflectionsMap)
  const [savingStation, setSavingStation] = useState<number | null>(null)
  const [savedStationSuccess, setSavedStationSuccess] = useState<number | null>(null)

  // Days list calculation
  const selectedDaysList =
    propSelectedDays && propSelectedDays.length > 0
      ? propSelectedDays
      : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

  const DAY_NAME_MAP: Record<number, string> = {
    0: 'CN',
    1: 'T2',
    2: 'T3',
    3: 'T4',
    4: 'T5',
    5: 'T6',
    6: 'T7',
  }

  const trackerDays: TrackerDayItem[] = []
  const start = startDate ? new Date(startDate) : new Date('2026-10-10')

  for (let i = 1; i <= journeyDays; i++) {
    const dDate = new Date(start)
    dDate.setDate(start.getDate() + (i - 1))
    const dayOfWeek = DAY_NAME_MAP[dDate.getDay()] || 'T2'
    const isPostDay = selectedDaysList.includes(dayOfWeek)
    const checkin = checkins.find((c) => c.day === i)
    const dateInfo = planDayDate(startDate, i)

    const isDone = Boolean(checkin?.done)
    const isMinimal = checkin?.status === 'minimal'
    const isMissed =
      !isDone && (checkin?.status === 'missed' || (i < currentDay && isPostDay && !checkin))

    trackerDays.push({
      dayNumber: i,
      dayOfWeek,
      dateStr: dateInfo ? dateInfo.short : `${dDate.getDate()}/${dDate.getMonth() + 1}`,
      fullDate: dDate.toISOString(),
      isPostDay,
      completed: isDone,
      isMinimal,
      isMissed,
      postPublished: isDone,
      emoji: checkin?.emotion ? checkin.emotion : undefined,
      moodLabel: undefined,
      emotion: checkin?.emotion ? (checkin.emotion as any) : undefined,
      note: checkin?.note || undefined,
    })
  }

  // 1. Calculate Stats according to 20/10 rules
  const votes = trackerDays.filter((d) => d.completed).length
  const plannedDays = trackerDays.filter((d) => d.isPostDay)
  const plannedAll = plannedDays.length > 0 ? plannedDays.length : journeyDays

  // Calculate current streak
  let currentStreak = 0
  for (let i = currentDay - 1; i >= 0; i--) {
    const d = trackerDays[i]
    if (!d) continue
    if (d.completed) {
      currentStreak++
    } else if (d.isPostDay) {
      break
    }
  }

  const currentDayIndex = Math.min(journeyDays, Math.max(1, currentDay))
  const daysSoFar = trackerDays.slice(0, currentDayIndex)
  const plannedSoFarList = daysSoFar.filter((d) => d.isPostDay)
  const plannedSoFar = plannedSoFarList.length > 0 ? plannedSoFarList.length : currentDayIndex
  const onBeat = daysSoFar.filter((d) => (d.isPostDay ? d.completed : false)).length

  const todayItem = trackerDays[currentDayIndex - 1]
  const isTodayRest = todayItem ? !todayItem.isPostDay : false

  // Stations configuration
  const STATIONS = [
    { id: 1, range: 'Ngày 1 - 7', name: stationNames?.[0] || 'Khởi hành' },
    { id: 2, range: 'Ngày 8 - 14', name: stationNames?.[1] || 'Tạo đà' },
    { id: 3, range: 'Ngày 15 - 21', name: stationNames?.[2] || 'Vượt dốc' },
    { id: 4, range: 'Ngày 22 - 28', name: stationNames?.[3] || 'Về đích' },
  ]

  const getCurrentStationName = () => {
    if (currentDayIndex > 21) return STATIONS[3].name
    if (currentDayIndex > 14) return STATIONS[2].name
    if (currentDayIndex > 7) return STATIONS[1].name
    return STATIONS[0].name
  }
  const currentStationName = getCurrentStationName()

  let rateText = 'Chưa chọn nhịp'
  if (selectedDaysList.length === 7) {
    rateText = 'Mỗi ngày (cả tuần)'
  } else if (selectedDaysList.length > 0) {
    rateText = `${selectedDaysList.length} lần/tuần (${selectedDaysList.join(' · ')})`
  }

  // Handle Day Click
  const handleDayClick = (day: TrackerDayItem) => {
    if (readOnly) return
    setSelectedDayItem(day)
  }

  // Save day check-in
  const handleSaveDay = async (updated: TrackerDayItem) => {
    const status: CheckinStatus = updated.completed
      ? updated.isMinimal
        ? 'minimal'
        : 'voted'
      : updated.isPostDay
        ? 'missed'
        : 'rest'

    // Update local state immediately
    setCheckins((prev) => {
      const next = prev.filter((c) => c.day !== updated.dayNumber)
      next.push({
        day: updated.dayNumber,
        done: updated.completed,
        status,
        emotion: updated.emotion || null,
        note: updated.note || null,
      })
      return next
    })

    // Confetti on station milestones (7, 14, 21, 28)
    if (updated.completed && [7, 14, 21, 28].includes(updated.dayNumber)) {
      try {
        const prefersReducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (!prefersReducedMotion && typeof confetti === 'function') {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#BC039E', '#EF3B83', '#D9F1EA', '#F6E9B8', '#280A60'],
          })
        }
      } catch {
        // ignore
      }
    }

    // Call server action
    try {
      await checkInDay(
        updated.dayNumber,
        updated.completed,
        updated.emotion || null,
        updated.note || null,
        status,
      )
    } catch (err) {
      console.error('Error saving checkin:', err)
    }
  }

  // Delete day check-in
  const handleDeleteDay = async (dayNumber: number) => {
    setCheckins((prev) => prev.filter((c) => c.day !== dayNumber))
    try {
      await deleteCheckInDay(dayNumber)
    } catch (err) {
      console.error('Error deleting checkin:', err)
    }
  }

  // Save station reflection
  const handleSaveReflection = async (stationIndex: number) => {
    const answers = reflectionsData[stationIndex] || ['', '', '', '']
    setSavingStation(stationIndex)
    try {
      const res = await saveStationReflection(stationIndex, answers)
      if (res.success) {
        setSavedStationSuccess(stationIndex)
        setTimeout(() => setSavedStationSuccess(null), 3000)
      }
    } catch (err) {
      console.error('Error saving reflection:', err)
    } finally {
      setSavingStation(null)
    }
  }

  const handleUpdateReflectionField = (
    stationIndex: number,
    questionIndex: number,
    value: string,
  ) => {
    setReflectionsData((prev) => {
      const current = [...(prev[stationIndex] || ['', '', '', ''])]
      current[questionIndex] = value
      return { ...prev, [stationIndex]: current }
    })
  }

  // Export JSON file
  const handleExportJSON = async () => {
    try {
      const res = await exportBackup()
      if (res.success && res.json) {
        const blob = new Blob([res.json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = res.filename || `form-habit-28days-${customerName || 'creator'}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        alert(res.message || 'Không thể tạo bản sao lưu. Vui lòng thử lại!')
      }
    } catch (err) {
      console.error('Export error:', err)
    }
  }

  // Export CSV file
  const handleExportCSV = async () => {
    try {
      const res = await exportCsv()
      if (res.success && res.csv) {
        const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = res.filename || `form-habit-28days-${customerName || 'tracker'}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        alert(res.message || 'Không thể xuất file CSV. Vui lòng thử lại!')
      }
    } catch (err) {
      console.error('CSV export error:', err)
    }
  }

  // Import JSON file
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const res = await restoreBackup(text)
      if (res.success) {
        alert(`Khôi phục thành công ${res.restored} ngày check-in!`)
        window.location.reload()
      } else {
        alert(res.message || 'Tệp sao lưu không hợp lệ.')
      }
    } catch {
      alert('Tệp sao lưu không đúng định dạng JSON.')
    }
  }

  // Copy Summary text for Coach
  const handleCopySummary = () => {
    const summary = `📊 [TIẾN TRÌNH 28 NGÀY: XÂY THÓI QUEN — DỰNG THƯƠNG HIỆU]
Căn tính: ${propIdentityAction || '...'} ➔ ${propIdentityRole || '...'}
Thói quen hạt nhân: ${propAtomicHabit || '...'}
Nhịp điệu: ${rateText}
---
✅ Lá phiếu đã bỏ: ${votes}/${plannedAll} lá phiếu
🔥 Chuỗi liên tiếp: ${currentStreak} ngày
🎯 Đúng nhịp tới hôm nay: ${onBeat}/${plannedSoFar}
🏆 Trạm hiện tại: ${currentStationName}
---
"Đều đặn một điều — mọi điều đều đặn."`

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(summary)
      setCopiedSummary(true)
      setTimeout(() => setCopiedSummary(false), 2000)
    }
  }

  const startDateInfo = planDayDate(startDate, 1)
  const endDateInfo = planDayDate(startDate, journeyDays)
  const startDateLabel = startDateInfo ? `Bắt đầu ${startDateInfo.short}` : 'Bắt đầu'
  const endDateLabel = endDateInfo ? `Về đích ${endDateInfo.short}` : 'Về đích'

  return (
    <div className="space-y-8 pt-2" id="dashboard-28days">
      {/* 1. Header Quote Block */}
      <StepQuoteHeader
        stage="GIAI ĐOẠN 3 · CHUYỂN MÌNH CÙNG THÓI QUEN"
        title={
          propIdentityRole && propIdentityRole.trim() !== ''
            ? `28 ngày thành ${propIdentityRole}`
            : '28 ngày của bạn'
        }
        quote={quote?.quoteText || '“Thói quen là lãi kép của sự tự hoàn thiện.”'}
        author={quote?.quoteAuthor || '— James Clear, Atomic Habits —'}
      />

      {/* 2. Thanh tiến trình 4 trạm */}
      <TimelineProgress
        totalCompleted={votes}
        startDateLabel={startDateLabel}
        endDateLabel={endDateLabel}
      />

      {/* 3. Khối thu gọn/mở rộng: Thói quen bạn đang xây */}
      <details className="rounded-2xl bg-white border border-lavender-mist shadow-soft-md overflow-hidden group">
        <summary className="p-4 sm:p-5 font-ui font-bold text-sm sm:text-base text-deep-navy flex items-center justify-between cursor-pointer list-none hover:bg-warm-ivory/50 transition-colors">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-bright-magenta" />
            <span>Thói quen bạn đang xây</span>
          </div>
          <ChevronDown className="w-4 h-4 text-deep-navy/60 transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-5 pb-5 pt-2 space-y-2.5 text-xs sm:text-sm font-ui border-t border-lavender-mist/60">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <span className="font-bold text-deep-navy/60 sm:w-36 shrink-0">Tuyên ngôn:</span>
            <span className="text-deep-navy font-semibold">
              Tôi sẽ {propIdentityAction || '...'} để trở thành {propIdentityRole || '...'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <span className="font-bold text-deep-navy/60 sm:w-36 shrink-0">
              Thói quen hạt nhân:
            </span>
            <span className="text-deep-navy font-semibold">{propAtomicHabit || '...'}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <span className="font-bold text-deep-navy/60 sm:w-36 shrink-0">Mentor:</span>
            <span className="text-deep-navy font-semibold">
              {propMentor
                ? `Sau khi ${propMentor}${propMentorTime ? ` · lúc ${propMentorTime}` : ''}`
                : '—'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <span className="font-bold text-deep-navy/60 sm:w-36 shrink-0">Nhịp điệu:</span>
            <span className="text-deep-navy font-semibold">{rateText}</span>
          </div>
        </div>
      </details>

      {/* 4. 4 THẺ CHỈ SỐ */}
      <div>
        <p className="text-sm text-deep-navy/60 mb-4 font-ui">
          {isTodayRest
            ? `Hôm nay là ngày ${currentDayIndex} — ngày nghỉ theo nhịp. Chạm vào ô để ghi lại.`
            : `Hôm nay là ngày ${currentDayIndex} — ngày bỏ phiếu. Chạm vào ô để ghi lại.`}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Thẻ 1: Lá phiếu đã bỏ */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-lavender-mist shadow-soft-md">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-deep-navy/60 font-ui block">
              Lá phiếu đã bỏ
            </span>
            <div className="flex items-baseline gap-1.5 my-1.5">
              <span className="font-display text-3xl sm:text-4xl text-deep-navy">{votes}</span>
              <span className="text-xs font-ui font-semibold text-deep-navy/70">
                / {plannedAll}
              </span>
            </div>
            <div className="w-full h-1.5 bg-lavender-mist/50 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-bright-magenta rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (votes / Math.max(1, plannedAll)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Thẻ 2: Chuỗi hiện tại */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-lavender-mist shadow-soft-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-deep-navy/60 font-ui">
                Chuỗi hiện tại
              </span>
              {/* a11y-contrast-ok: SVG icon trang trí */}
              <Flame className="w-4 h-4 text-accent-pink" />
            </div>
            <div className="flex items-baseline gap-1.5 my-1.5">
              <span className="font-display text-3xl sm:text-4xl text-bright-magenta">
                {currentStreak}
              </span>
              <span className="text-xs font-ui font-semibold text-deep-navy/70">ngày</span>
            </div>
            <p className="text-[11px] font-ui text-deep-navy/60 truncate">
              {currentStreak > 0 ? 'Giữ nhịp đều đặn' : 'Khởi đầu hành trình'}
            </p>
          </div>

          {/* Thẻ 3: Đúng nhịp tới hôm nay */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-lavender-mist shadow-soft-md">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-deep-navy/60 font-ui block">
              Đúng nhịp tới hôm nay
            </span>
            <div className="flex items-baseline gap-1.5 my-1.5">
              <span className="font-display text-3xl sm:text-4xl text-deep-navy">{onBeat}</span>
              <span className="text-xs font-ui font-semibold text-deep-navy/70">
                / {plannedSoFar}
              </span>
            </div>
            <p className="text-[11px] font-ui text-deep-navy/60 truncate">
              {onBeat >= plannedSoFar ? 'Đạt chuẩn nhịp cam kết' : 'Tiếp tục tạo đà'}
            </p>
          </div>

          {/* Thẻ 4: Trạm hiện tại */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-lavender-mist shadow-soft-md flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-deep-navy/60 font-ui block">
              Trạm hiện tại
            </span>
            <div className="my-1.5">
              <span className="font-display text-2xl sm:text-3xl text-bright-magenta">
                {currentStationName}
              </span>
            </div>
            <p className="text-[11px] font-ui text-deep-navy/60">
              Ngày {currentDayIndex}/{journeyDays}
            </p>
          </div>
        </div>
      </div>

      {/* 5. KHỐI LƯỚI 28 NGÀY */}
      <div className="bg-white rounded-3xl border border-lavender-mist shadow-soft-md p-5 sm:p-7 space-y-6">
        {/* Header khối */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-lavender-mist/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-bright-magenta" />
              <h2 className="font-ui font-bold text-lg sm:text-xl text-deep-navy">
                Lưới 28 ngày theo dõi
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-deep-navy/60 font-ui mt-0.5">
              Click vào từng ngày để check-in cảm xúc và ghi nhận lá phiếu của bạn
            </p>
          </div>

          {/* Chú giải */}
          <div className="flex-1 lg:pl-6 space-y-2 font-ui">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-2 text-deep-navy/80 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32] shrink-0" />
                <span>Đã bỏ phiếu</span>
              </div>
              <div className="flex items-center gap-2 text-deep-navy/80 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FBC02D] shrink-0" />
                <span>Bản tối giản</span>
              </div>
              <div className="flex items-center gap-2 text-deep-navy/80 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-warm-ivory border border-accent-pink shrink-0" />
                <span>Lỡ nhịp</span>
              </div>
              <div className="flex items-center gap-2 text-deep-navy/80 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-deep-navy/20 shrink-0" />
                <span>Ngày nghỉ theo nhịp</span>
              </div>
            </div>
            <p className="text-xs text-deep-navy/60 mt-2 italic pt-1 border-t border-lavender-mist/40">
              Lỡ một ngày là bình thường. Chỉ cần đừng lỡ hai ngày bỏ phiếu liền.
            </p>
          </div>
        </div>

        {/* 4 Trạm */}
        <div className="space-y-6">
          {STATIONS.map((station) => {
            const startIdx = (station.id - 1) * 7
            const stationDays = trackerDays.slice(startIdx, startIdx + 7)
            const stationCompleted = stationDays.filter((d) => d.completed).length
            const stationPlanned = stationDays.filter((d) => d.isPostDay).length || 7

            const firstDay = stationDays[0]
            const stationStartDayNumber = startIdx + 1
            const isLocked = stationStartDayNumber > currentDay
            const openDateInfo = planDayDate(startDate, stationStartDayNumber)
            const openDateFormatted = openDateInfo ? openDateInfo.full : ''

            return (
              <div
                key={station.id}
                className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 transition-all ${
                  isLocked
                    ? 'bg-warm-ivory/40 border-lavender-mist/60 opacity-60'
                    : 'bg-warm-ivory/60 border-lavender-mist/80'
                }`}
              >
                {/* Station Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white text-deep-navy border border-lavender-mist">
                      {station.range}
                    </span>
                    <h3 className="font-ui font-bold text-sm sm:text-base text-deep-navy flex items-center gap-1.5">
                      <span>{station.name}</span>
                      {isLocked && <Lock className="w-3.5 h-3.5 text-deep-navy/70" />}
                    </h3>
                  </div>

                  {isLocked ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-deep-navy/70 bg-white/90 border border-lavender-mist px-3 py-1 rounded-full font-ui shadow-soft-md">
                      <Lock className="w-3 h-3 text-bright-magenta" />
                      <span>Mở vào ngày {openDateFormatted}</span>
                    </span>
                  ) : (
                    <span className="font-bold text-bright-magenta text-xs px-2.5 py-1 rounded-full bg-soft-pink">
                      {stationCompleted}/{stationPlanned} lá phiếu
                    </span>
                  )}
                </div>

                {isLocked && (
                  <div className="py-2 px-3.5 rounded-2xl bg-white/80 border border-lavender-mist/70 flex items-center gap-2 text-xs font-ui text-deep-navy/70">
                    <Lock className="w-3.5 h-3.5 text-bright-magenta shrink-0" />
                    <span>
                      Trạm tuần tương lai chưa tới. Thời gian mở trạm:{' '}
                      <strong className="text-deep-navy">{openDateFormatted}</strong>.
                    </span>
                  </div>
                )}

                {/* 7 Days Grid */}
                <div
                  className={`grid grid-cols-7 gap-1.5 sm:gap-2.5 ${
                    isLocked ? 'pointer-events-none select-none opacity-50' : ''
                  }`}
                >
                  {stationDays.map((day) => {
                    const isFuture = day.dayNumber > currentDayIndex
                    const isDone = Boolean(day.completed)
                    const isMinimal = Boolean(day.isMinimal)
                    const isMissed = !isDone && Boolean(day.isMissed)
                    const isRestDay = !day.isPostDay

                    const dayAriaLabel = `Ngày ${day.dayNumber}: ${
                      isDone
                        ? isMinimal
                          ? `Bản tối giản, cảm xúc: ${day.emotionLabel || 'Bình an'}`
                          : `Đã hoàn thành, cảm xúc: ${day.emotionLabel || 'Bình an'}`
                        : isFuture || isLocked
                          ? 'Chưa tới'
                          : isMissed
                            ? 'Lỡ nhịp'
                            : 'Bỏ phiếu'
                    }`

                    return (
                      <button
                        key={day.dayNumber}
                        type="button"
                        disabled={isLocked || isFuture || readOnly}
                        onClick={() => !isLocked && !isFuture && handleDayClick(day)}
                        aria-label={dayAriaLabel}
                        className={`aspect-square sm:aspect-auto sm:h-20 p-1.5 sm:p-2 rounded-2xl border flex flex-col justify-between items-center text-center transition-all duration-200 relative group cursor-pointer ${
                          isLocked || isFuture || readOnly
                            ? 'cursor-not-allowed opacity-60'
                            : 'active:scale-95'
                        } ${
                          isDone
                            ? isMinimal
                              ? 'bg-[#FFF8E1] border-[#FBC02D] text-[#F57F17]'
                              : 'bg-[#E8F5E9] border-[#2E7D32] text-[#2E7D32]'
                            : isMissed
                              ? 'bg-warm-ivory border-accent-pink text-deep-navy/70'
                              : 'bg-white border-deep-navy/10 hover:border-bright-magenta/60 hover:bg-soft-pink/20 text-deep-navy/70'
                        }`}
                      >
                        {/* Day indicator */}
                        <div
                          className={`w-full flex items-center justify-between text-[10px] sm:text-xs font-ui font-bold ${
                            isDone && !isMinimal
                              ? 'text-[#2E7D32]'
                              : isDone && isMinimal
                                ? 'text-[#F57F17]'
                                : isMissed
                                  ? 'text-accent-pink'
                                  : 'text-deep-navy/70'
                          }`}
                        >
                          <span>N{day.dayNumber}</span>
                          <span className="hidden sm:inline font-normal opacity-70">
                            {day.dayOfWeek}
                          </span>
                        </div>

                        {/* Mood Emoji or Icon */}
                        <div className="my-0.5">
                          {isDone ? (
                            <span className="text-base sm:text-xl">{day.emoji || '✨'}</span>
                          ) : isMissed ? (
                            <span className="text-base sm:text-xl opacity-75">
                              {day.emoji || '🌧️'}
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-full border border-dashed border-deep-navy/20 flex items-center justify-center text-[10px] text-deep-navy/70 group-hover:border-bright-magenta group-hover:text-bright-magenta transition-colors">
                              +
                            </span>
                          )}
                        </div>

                        {/* Bottom Label */}
                        <div className="w-full flex items-center justify-center">
                          {!isDone && isRestDay ? (
                            <span className="text-[10px] font-ui italic text-deep-navy/70">
                              nghỉ
                            </span>
                          ) : (
                            <span
                              className={`text-[9px] font-ui hidden sm:inline ${
                                isDone || isMissed ? 'opacity-60' : 'text-deep-navy/70'
                              }`}
                            >
                              {day.dateStr}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 6. KHỐI NHÌN LẠI MỖI TRẠM */}
      <div className="bg-white rounded-3xl border border-lavender-mist shadow-soft-md p-5 sm:p-7 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-bright-magenta" />
            <h2 className="font-ui font-bold text-lg sm:text-xl text-deep-navy">
              Nhìn lại mỗi trạm
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-deep-navy/60 font-ui mt-0.5">
            Dành 5 phút cuối mỗi trạm để lắng nghe chính mình và tinh chỉnh hệ thống
          </p>
        </div>

        <div className="space-y-4">
          {STATIONS.map((station, stIdx) => {
            const startIdx = stIdx * 7
            const stationDays = trackerDays.slice(startIdx, startIdx + 7)
            const stationCompleted = stationDays.filter((d) => d.completed).length

            const stationStartDayNumber = startIdx + 1
            const isLocked = stationStartDayNumber > currentDay
            const openDateInfo = planDayDate(startDate, stationStartDayNumber)
            const openDateFormatted = openDateInfo ? openDateInfo.full : ''

            const questions =
              stationQuestions?.[stIdx] && stationQuestions[stIdx].length > 0
                ? stationQuestions[stIdx].map((q) => q.question)
                : defaultStationQuestions

            const answers = reflectionsData[stIdx] || ['', '', '', '']
            const isSaving = savingStation === stIdx
            const isSaved = savedStationSuccess === stIdx

            return (
              <div
                key={station.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isLocked
                    ? 'bg-warm-ivory/60 border-deep-navy/10'
                    : 'bg-warm-ivory/50 border-lavender-mist'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white text-deep-navy border border-lavender-mist">
                      {station.range}
                    </span>
                    <h3 className="font-ui font-bold text-sm sm:text-base text-deep-navy flex items-center gap-1.5">
                      <span>{station.name}</span>
                      {isLocked && <Lock className="w-3.5 h-3.5 text-deep-navy/70" />}
                    </h3>
                  </div>

                  <span className="text-xs font-semibold text-deep-navy/60 font-ui">
                    {stationCompleted}/7 ngày hoàn thành
                  </span>
                </div>

                {isLocked ? (
                  <div className="p-4 rounded-2xl bg-white border border-deep-navy/10 text-center text-xs text-deep-navy/60 font-ui">
                    Trạm này sẽ mở khi tới thời gian: <strong>{openDateFormatted}</strong>.
                  </div>
                ) : (
                  <div className="space-y-4 font-ui">
                    {questions.map((qText, qIdx) => (
                      <div key={qIdx} className="space-y-1">
                        <label
                          htmlFor={`station-${stIdx}-q-${qIdx}`}
                          className="text-xs sm:text-sm font-semibold text-deep-navy block"
                        >
                          {qText}
                        </label>
                        <textarea
                          id={`station-${stIdx}-q-${qIdx}`}
                          rows={2}
                          value={answers[qIdx] || ''}
                          disabled={readOnly}
                          onChange={(e) => handleUpdateReflectionField(stIdx, qIdx, e.target.value)}
                          placeholder="Ghi lại chiêm nghiệm..."
                          className="w-full p-3 rounded-2xl bg-white border border-lavender-mist text-xs sm:text-sm text-deep-navy focus:border-bright-magenta focus:outline-none resize-y"
                        />
                      </div>
                    ))}

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        disabled={readOnly || isSaving}
                        onClick={() => handleSaveReflection(stIdx)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-bright-magenta hover:bg-bright-magenta/90 text-white text-xs font-bold shadow-soft-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {isSaving ? (
                          <span>Đang lưu...</span>
                        ) : isSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã lưu!</span>
                          </>
                        ) : (
                          <span>Lưu bài suy ngẫm</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 7. KHỐI QUẢN LÝ DỮ LIỆU CỦA BẠN (5 NÚT CHỨC NĂNG) */}
      <div className="p-6 rounded-3xl bg-white border border-lavender-mist shadow-soft-md space-y-4">
        <div className="space-y-1">
          <h3 className="font-ui font-bold text-base sm:text-lg text-deep-navy">Dữ liệu của bạn</h3>
          <p className="text-xs sm:text-sm text-deep-navy/70 font-ui leading-relaxed">
            {privacyNote ||
              'Dữ liệu hành trình của bạn được lưu an toàn trên máy chủ của Trạm Dừng Cảm Xúc gắn với tài khoản của bạn. Bạn có thể xuất bản sao lưu bất kỳ lúc nào để lưu trữ riêng.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-ui pt-3 border-t border-lavender-mist/60">
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Nút Tải bản sao lưu (.json) */}
            <button
              type="button"
              onClick={handleExportJSON}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-deep-navy/20 hover:border-deep-navy text-deep-navy font-semibold bg-warm-ivory hover:bg-white transition-all active:scale-95 cursor-pointer shadow-soft-md"
            >
              <Download className="w-3.5 h-3.5 text-bright-magenta" />
              <span>Tải bản sao lưu (.json)</span>
            </button>

            {/* 2. Nút Tải bảng 28 ngày (.csv) */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-deep-navy/20 hover:border-deep-navy text-deep-navy font-semibold bg-warm-ivory hover:bg-white transition-all active:scale-95 cursor-pointer shadow-soft-md"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-deep-navy" />
              <span>Tải bảng 28 ngày (.csv)</span>
            </button>

            {/* 3. Nút Khôi phục từ file */}
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-deep-navy/20 hover:border-deep-navy text-deep-navy font-semibold bg-warm-ivory hover:bg-white transition-all active:scale-95 cursor-pointer shadow-soft-md">
              <Upload className="w-3.5 h-3.5 text-deep-navy/70" />
              <span>Khôi phục từ file</span>
              <input
                type="file"
                accept="application/json,.json"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>

            {/* 4. Nút Sao chép kết quả gửi Coach */}
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-deep-navy/20 hover:border-deep-navy text-deep-navy font-semibold bg-warm-ivory hover:bg-white transition-all active:scale-95 cursor-pointer shadow-soft-md"
            >
              {copiedSummary ? (
                <Check className="w-3.5 h-3.5 text-deep-navy" />
              ) : (
                <Share2 className="w-3.5 h-3.5 text-bright-magenta" />
              )}
              <span>{copiedSummary ? 'Đã sao chép!' : 'Sao chép kết quả gửi Coach'}</span>
            </button>
          </div>

          {/* 5. Nút Bắt đầu lại */}
          <button
            type="button"
            onClick={async () => {
              if (window.confirm('Bạn có chắc chắn muốn bắt đầu lại hành trình 28 ngày?')) {
                const res = await restartJourney()
                if (res.success && res.redirectTo) {
                  window.location.href = res.redirectTo
                }
              }
            }}
            className="inline-flex items-center gap-1.5 text-deep-navy/70 hover:text-accent-pink px-2 py-1 transition-colors cursor-pointer text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Bắt đầu lại</span>
          </button>
        </div>
      </div>

      {/* 8. KHỐI CHỨNG NHẬN (NẾU ĐỦ ĐIỀU KIỆN HOẶC ĐÃ CÓ CHỨNG NHẬN) */}
      {/* QA DP-01e: also once the journey has ended without reaching the goal ("Đã trải nghiệm"). */}
      {(initialCertificate ||
        eligibility?.eligible ||
        (eligibility?.outcome && eligibility.outcome !== 'in_progress')) && (
        <div className="p-6 rounded-3xl bg-white border border-lavender-mist shadow-soft-md space-y-4">
          <TrackerSummaryCard
            stats={{
              completedDays: votes,
              mostFrequentEmotion: null,
            }}
            journeyDays={plannedAll}
            isTrialOrExpired={false}
            buyUrl="/#growth-mirror"
            eligibility={eligibility}
            initialCertificate={initialCertificate}
            customerName={customerName}
          />
          {initialCertificate && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-lavender-mist/60">
              <CertificatePublicToggle
                code={initialCertificate.code}
                initialIsPublic={initialCertificate.isPublic}
              />
              <CertificateShareButtons
                code={initialCertificate.code}
                customerName={customerName || initialCertificate.customerName || 'Người đồng hành'}
                isPublic={initialCertificate.isPublic}
              />
            </div>
          )}
        </div>
      )}

      {/* 9. NÚT NỔI GÓC DƯỚI BÊN PHẢI (FAB) - CHỈ CÓ ĐỒNG HÀNH SAU 28 NGÀY (H8: BỎ ỦNG HỘ) */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
        {isFabOpen && (
          <div className="mb-3 w-80 sm:w-96 p-5 rounded-2xl bg-white border border-lavender-mist shadow-soft-lg space-y-4 text-deep-navy font-ui">
            <div className="flex items-center justify-between pb-2 border-b border-lavender-mist/60">
              <h4 className="font-bold text-sm text-deep-navy flex items-center gap-1.5">
                <span className="text-bright-magenta">♡</span>
                <span>{afterJourneyTitle || 'Đồng hành cùng Trạm Dừng'}</span>
              </h4>
              <button
                type="button"
                aria-label={vi.dp01.close}
                onClick={() => setIsFabOpen(false)}
                className="text-deep-navy/70 hover:text-deep-navy text-xs font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Đồng hành sau 28 ngày */}
            <div className="space-y-1.5">
              <p className="text-xs text-deep-navy/75 leading-relaxed">
                {afterJourneyText ||
                  'Nếu cần một Habit Coach đồng hành cùng bạn sau hành trình 28 ngày này, đặt một buổi trò chuyện với Hana.'}
              </p>
              {/* QA DP-01e: link only from CMS (siteSettings.habitCoachBookingUrl), no hardcoded URL. */}
              {coachBookingUrl && (
                <a
                  href={coachBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-deep-navy text-white text-xs font-semibold hover:bg-deep-navy/90 transition-all shadow-soft-md"
                >
                  <span>Đặt lịch với Habit Coach</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsFabOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-soft-pink/40 text-deep-navy font-ui font-semibold text-xs sm:text-sm border border-bright-magenta/30 shadow-soft-md hover:shadow-soft-lg transition-all active:scale-95 cursor-pointer"
        >
          <span className="text-bright-magenta text-base font-bold">♡</span>
          <span>Thấy công cụ này hữu ích</span>
        </button>
      </div>

      {/* Check-in Modal */}
      {selectedDayItem && (
        <DayCheckInModal
          key={selectedDayItem.dayNumber}
          dayItem={
            trackerDays.find((d) => d.dayNumber === selectedDayItem.dayNumber) || selectedDayItem
          }
          atomicHabitTitle={propAtomicHabit || 'Thói quen hạt nhân'}
          checkInContent={checkInContent}
          onClose={() => setSelectedDayItem(null)}
          onSave={handleSaveDay}
          onDelete={handleDeleteDay}
        />
      )}
    </div>
  )
}
