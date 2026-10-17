'use client'

import React, { useState } from 'react'
import type { MediaOption } from '@/lib/cms/product-wizard.server'
import { vi } from '@/lib/i18n/vi'

export function slugifyVietnamese(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

interface Step2BasicProps {
  name: string
  slug: string
  web: 'site' | 'habit' | 'eq'
  shortDescription?: string | null
  journeyStep?: 'pause' | 'feel' | 'name' | 'choose' | 'practice' | null
  coverImage?: number | string | null
  coverImageAlt?: string | null
  mediaList: MediaOption[]
  onChange: (fields: {
    name?: string
    slug?: string
    web?: 'site' | 'habit' | 'eq'
    shortDescription?: string | null
    journeyStep?: 'pause' | 'feel' | 'name' | 'choose' | 'practice' | null
    coverImage?: number | string | null
    coverImageAlt?: string | null
  }) => void
}

export function Step2Basic({
  name,
  slug,
  web,
  shortDescription,
  journeyStep,
  coverImage,
  coverImageAlt,
  mediaList,
  onChange,
}: Step2BasicProps) {
  const [hasManuallyEditedSlug, setHasManuallyEditedSlug] = useState(Boolean(slug && slug !== slugifyVietnamese(name)))

  const handleNameChange = (newName: string) => {
    if (!hasManuallyEditedSlug) {
      onChange({ name: newName, slug: slugifyVietnamese(newName) })
    } else {
      onChange({ name: newName })
    }
  }

  const handleRegenerateSlug = () => {
    const generated = slugifyVietnamese(name)
    setHasManuallyEditedSlug(false)
    onChange({ slug: generated })
  }

  const selectedMedia = mediaList.find((m) => String(m.id) === String(coverImage))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-ui text-lg font-bold text-deep-navy">
          {vi.cms.wizard.steps.step2.title}
        </h2>
        <p className="text-sm text-deep-navy/70">
          {vi.cms.wizard.steps.step2.description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Tên sản phẩm */}
        <div className="md:col-span-2">
          <label className="block font-ui text-sm font-bold text-deep-navy mb-1.5">
            {vi.cms.wizard.labels.name} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={vi.cms.wizard.labels.namePlaceholder}
            className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2.5 text-sm text-deep-navy focus:border-bright-magenta focus:outline-none focus:ring-2 focus:ring-soft-pink"
            required
          />
          <p className="mt-1 text-xs text-deep-navy/60">
            {vi.cms.productForm.descriptions.name}
          </p>
        </div>

        {/* Đường dẫn (Slug) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-ui text-sm font-bold text-deep-navy">
              {vi.cms.wizard.labels.slug} <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleRegenerateSlug}
              className="text-xs font-semibold text-bright-magenta hover:underline"
            >
              {vi.cms.wizard.buttons.regenerateSlug}
            </button>
          </div>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setHasManuallyEditedSlug(true)
              onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })
            }}
            placeholder={vi.cms.wizard.labels.slugPlaceholder}
            className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2.5 font-mono text-sm text-deep-navy focus:border-bright-magenta focus:outline-none focus:ring-2 focus:ring-soft-pink"
            required
          />
          <p className="mt-1 text-xs text-deep-navy/60">
            {vi.cms.productForm.descriptions.slug}
          </p>
        </div>

        {/* Khu vực web */}
        <div>
          <label className="block font-ui text-sm font-bold text-deep-navy mb-1.5">
            {vi.cms.wizard.labels.web} <span className="text-red-500">*</span>
          </label>
          <select
            value={web}
            onChange={(e) => onChange({ web: e.target.value as 'site' | 'habit' | 'eq' })}
            className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2.5 text-sm text-deep-navy focus:border-bright-magenta focus:outline-none focus:ring-2 focus:ring-soft-pink"
          >
            <option value="site">Trang chính (tramdungcamxuc.com)</option>
            <option value="habit">Thói quen (/habit)</option>
            <option value="eq">EQ Buddy (/eq-buddy)</option>
          </select>
          <p className="mt-1 text-xs text-deep-navy/60">
            {vi.cms.productForm.sidebar.web}
          </p>
        </div>

        {/* Giới thiệu ngắn */}
        <div className="md:col-span-2">
          <label className="block font-ui text-sm font-bold text-deep-navy mb-1.5">
            {vi.cms.wizard.labels.shortDescription}
          </label>
          <textarea
            rows={3}
            value={shortDescription || ''}
            onChange={(e) => onChange({ shortDescription: e.target.value })}
            placeholder={vi.cms.wizard.labels.shortDescriptionPlaceholder}
            className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2.5 text-sm text-deep-navy focus:border-bright-magenta focus:outline-none focus:ring-2 focus:ring-soft-pink"
          />
          <p className="mt-1 text-xs text-deep-navy/60">
            {vi.cms.productForm.descriptions.shortDescription}
          </p>
        </div>

        {/* Bước hành trình */}
        <div>
          <label className="block font-ui text-sm font-bold text-deep-navy mb-1.5">
            {vi.cms.wizard.labels.journeyStep}
          </label>
          <select
            value={journeyStep || ''}
            onChange={(e) =>
              onChange({
                journeyStep: (e.target.value as 'pause' | 'feel' | 'name' | 'choose' | 'practice') || null,
              })
            }
            className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2.5 text-sm text-deep-navy focus:border-bright-magenta focus:outline-none focus:ring-2 focus:ring-soft-pink"
          >
            <option value="">-- Không phân loại theo bước --</option>
            <option value="pause">Bước 1: Dừng lại (Pause)</option>
            <option value="feel">Bước 2: Cảm nhận (Feel)</option>
            <option value="name">Bước 3: Gọi tên (Name)</option>
            <option value="choose">Bước 4: Lựa chọn (Choose)</option>
            <option value="practice">Bước 5: Thực hành (Practice)</option>
          </select>
          <p className="mt-1 text-xs text-deep-navy/60">
            {vi.cms.productForm.descriptions.journeyStep}
          </p>
        </div>

        {/* Chọn ảnh bìa từ Media */}
        <div className="md:col-span-2 rounded-2xl border border-lavender-mist/70 bg-warm-ivory/40 p-4">
          <label className="block font-ui text-sm font-bold text-deep-navy mb-1.5">
            {vi.cms.wizard.labels.coverImage}
          </label>
          <p className="text-xs text-deep-navy/60 mb-3">
            {vi.cms.productForm.descriptions.coverImage}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <select
              value={coverImage ? String(coverImage) : ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) || e.target.value : null
                const mediaDoc = mediaList.find((m) => String(m.id) === String(val))
                onChange({
                  coverImage: val,
                  coverImageAlt: mediaDoc?.alt || coverImageAlt || name,
                })
              }}
              className="flex-1 rounded-xl border border-lavender-mist bg-white px-4 py-2.5 text-sm text-deep-navy focus:border-bright-magenta focus:outline-none focus:ring-2 focus:ring-soft-pink"
            >
              <option value="">-- Chọn ảnh bìa từ Thư viện ảnh --</option>
              {mediaList.map((media) => (
                <option key={media.id} value={media.id}>
                  {media.filename || `Ảnh #${media.id}`} {media.alt ? `(${media.alt})` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedMedia && (
            <div className="mt-4 flex items-center gap-4 rounded-xl border border-lavender-mist bg-white p-3">
              <img
                src={selectedMedia.url}
                alt={selectedMedia.alt || name}
                className="h-16 w-16 rounded-lg object-cover border border-lavender-mist"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-deep-navy truncate">
                  {selectedMedia.filename || `Ảnh #${selectedMedia.id}`}
                </div>
                <div className="text-xs text-deep-navy/60 truncate">
                  Alt text: {selectedMedia.alt || 'Chưa có mô tả'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
