'use client'

import React from 'react'
import { vi } from '@/lib/i18n/vi'
import { vietnamTimeToUtcIso, utcIsoToVietnamDateTime } from '@/lib/cms/workshop-wizard-schema'

interface Step2ScheduleProps {
  vnDate: string
  vnTime: string
  joinUrl: string
  onChange: (fields: {
    vnDate?: string
    vnTime?: string
    joinUrl?: string
  }) => void
}

export function Step2Schedule({
  vnDate,
  vnTime,
  joinUrl,
  onChange,
}: Step2ScheduleProps) {
  const utcIso = vietnamTimeToUtcIso(vnDate, vnTime)
  const convertedInfo = utcIso ? utcIsoToVietnamDateTime(utcIso) : null

  // Kiểm tra xem giờ VN 0h-7h có làm đổi ngày theo UTC hay không
  let crossesMidnightBoundary = false
  let utcDatePart = ''
  let utcTimePart = ''

  if (utcIso) {
    const utcDateObj = new Date(utcIso)
    const yyyy = utcDateObj.getUTCFullYear()
    const mm = String(utcDateObj.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(utcDateObj.getUTCDate()).padStart(2, '0')
    const hh = String(utcDateObj.getUTCHours()).padStart(2, '0')
    const min = String(utcDateObj.getUTCMinutes()).padStart(2, '0')
    utcDatePart = `${dd}/${mm}/${yyyy}`
    utcTimePart = `${hh}:${min}`

    if (vnDate) {
      const parts = vnDate.split('-')
      if (parts.length === 3 && `${parts[2]}/${parts[1]}/${parts[0]}` !== utcDatePart) {
        crossesMidnightBoundary = true
      }
    }
  }

  const isJoinUrlValid =
    !joinUrl ||
    joinUrl.trim().length === 0 ||
    (() => {
      try {
        const u = new URL(joinUrl.trim())
        return u.protocol === 'http:' || u.protocol === 'https:'
      } catch {
        return false
      }
    })()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl uppercase tracking-wider text-deep-navy">
          {vi.cms.workshopWizard.steps.step2.title}
        </h2>
        <p className="mt-1 font-ui text-sm text-deep-navy/70">
          {vi.cms.workshopWizard.steps.step2.description}
        </p>
      </div>

      <div className="space-y-5">
        {/* Hộp nhắc múi giờ */}
        <div className="rounded-2xl border border-lavender-mist/80 bg-warm-ivory/60 p-4 font-ui text-xs text-deep-navy">
          <p className="font-bold text-bright-magenta">
            🕒 {vi.cms.workshopWizard.labels.timezoneNotice}
          </p>
          <p className="mt-1 text-deep-navy/70">
            Hana chỉ cần chọn ngày và giờ bình thường theo múi giờ Việt Nam. Hệ thống tự động chuyển
            sang định dạng chuẩn quốc tế (UTC) khi lưu vào cơ sở dữ liệu.
          </p>
        </div>

        {/* Ngày & Giờ tổ chức */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block font-ui text-xs font-bold text-deep-navy">
              {vi.cms.workshopWizard.labels.date} (Giờ VN) <span className="text-accent-pink">*</span>
            </label>
            <input
              type="date"
              value={vnDate}
              onChange={(e) => onChange({ vnDate: e.target.value })}
              className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2.5 font-ui text-xs text-deep-navy shadow-sm focus:border-bright-magenta focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block font-ui text-xs font-bold text-deep-navy">
              {vi.cms.workshopWizard.labels.time} (Giờ VN) <span className="text-accent-pink">*</span>
            </label>
            <input
              type="time"
              value={vnTime}
              onChange={(e) => onChange({ vnTime: e.target.value })}
              className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2.5 font-ui text-xs text-deep-navy shadow-sm focus:border-bright-magenta focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Hiển thị kết quả quy đổi thời gian */}
        {utcIso && convertedInfo && (
          <div className="rounded-2xl border border-mint-haze bg-mint-haze/40 p-4 font-ui text-xs text-deep-navy space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold">✓ Thời gian hiển thị cho học viên:</span>
              <span className="font-semibold text-bright-magenta">{convertedInfo.formatted}</span>
            </div>
            <div className="flex items-center justify-between text-deep-navy/70">
              <span>Chuẩn quốc tế lưu trong hệ thống:</span>
              <span className="font-mono text-[11px]">{utcIso}</span>
            </div>
            {crossesMidnightBoundary && (
              <div className="mt-2 rounded-xl border border-butter-cream bg-butter-cream/40 p-2.5 text-deep-navy">
                💡 <strong>Múi giờ 0h–7h sáng:</strong> Khung giờ {vnTime} ngày {vnDate} (giờ VN) tương
                ứng với {utcTimePart} ngày {utcDatePart} theo giờ quốc tế UTC. Hệ thống đã xử lý chính
                xác và tự động.
              </div>
            )}
          </div>
        )}

        {/* Liên kết tham gia (Google Meet / Zoom) */}
        <div>
          <label className="mb-1.5 block font-ui text-xs font-bold text-deep-navy">
            {vi.cms.workshopWizard.labels.joinUrl} <span className="text-accent-pink">*</span>
          </label>
          <input
            type="url"
            value={joinUrl}
            onChange={(e) => onChange({ joinUrl: e.target.value })}
            placeholder={vi.cms.workshopWizard.labels.joinUrlPlaceholder}
            className={`w-full rounded-xl border bg-white px-4 py-2.5 font-ui text-xs text-deep-navy shadow-sm focus:outline-none ${
              !isJoinUrlValid
                ? 'border-accent-pink bg-soft-pink/30 focus:border-accent-pink'
                : 'border-lavender-mist focus:border-bright-magenta'
            }`}
            required
          />
          <p className="mt-1 font-ui text-[11px] text-deep-navy/60">
            {vi.cms.workshopWizard.labels.joinUrlHint}
          </p>
          {!isJoinUrlValid && (
            <p className="mt-1 font-ui text-xs text-accent-pink">
              ⚠️ {vi.cms.workshopWizard.errors.invalidJoinUrl}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
