'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { vi } from '@/lib/i18n/vi'
import { RecordSummary } from '../record-summary'

const t = vi.pk18.mediaPicker

export interface MediaDoc {
  id: string | number
  url?: string
  thumbnailURL?: string
  alt?: string
  filename?: string
  mimeType?: string
  filesize?: number
}

export interface MediaPickerFieldProps {
  value?: string | number | null
  onChange: (id: string) => void
  onSelectMedia?: (media: MediaDoc) => void
  label?: string
  placeholder?: string
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function MediaPickerField({
  value,
  onChange,
  onSelectMedia,
  label,
  placeholder,
}: MediaPickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [items, setItems] = useState<MediaDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)

  // Upload sub-state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadAlt, setUploadAlt] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const triggerButtonRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  const currentId = value != null ? String(value).trim() : ''

  // Fetch images from API
  const fetchImages = async (query: string, pageNum: number, append = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '50')
      params.set('depth', '0')
      params.set('page', String(pageNum))
      params.set('where[mimeType][like]', 'image/')

      const trimmedQuery = query.trim()
      if (trimmedQuery) {
        params.set('where[or][0][alt][like]', trimmedQuery)
        params.set('where[or][1][filename][like]', trimmedQuery)
      }

      const res = await fetch(`/api/media?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) {
        if (!append) setItems([])
        setHasNextPage(false)
        return
      }

      const data = await res.json()
      const docs: MediaDoc[] = data.docs || []
      setHasNextPage(Boolean(data.hasNextPage))
      setPage(pageNum)

      if (append) {
        setItems((prev) => [...prev, ...docs])
      } else {
        setItems(docs)
      }
    } catch {
      if (!append) setItems([])
      setHasNextPage(false)
    } finally {
      setLoading(false)
    }
  }

  // Open modal handler
  const handleOpenModal = () => {
    setIsOpen(true)
    setSearchQuery('')
    setSelectedFile(null)
    setUploadAlt('')
    setUploadError(null)
    fetchImages('', 1, false)
  }

  // Close modal handler
  const handleCloseModal = () => {
    setIsOpen(false)
    setSelectedFile(null)
    setUploadAlt('')
    setUploadError(null)
    triggerButtonRef.current?.focus()
  }

  // Trap focus and close on Esc
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleCloseModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    // Focus search input after open
    const timer = setTimeout(() => {
      searchInputRef.current?.focus()
    }, 50)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timer)
    }
  }, [isOpen])

  // Select item
  const handleSelectItem = (item: MediaDoc) => {
    onChange(String(item.id))
    onSelectMedia?.(item)
    handleCloseModal()
  }

  // Remove selected item
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  // Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchImages(searchQuery, 1, false)
  }

  // Load more
  const handleLoadMore = () => {
    if (!loading && hasNextPage) {
      fetchImages(searchQuery, page + 1, true)
    }
  }

  // File chosen via input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset native input so the same file can be re-selected if canceled
    e.target.value = ''

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setUploadError(t.fileInvalidType)
      setSelectedFile(null)
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(t.fileTooLarge)
      setSelectedFile(null)
      return
    }

    setUploadError(null)
    setSelectedFile(file)
    // Suggest filename without extension as default alt
    const baseName = file.name.replace(/\.[^/.]+$/, '').trim()
    setUploadAlt(baseName)
  }

  // Upload handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    const trimmedAlt = uploadAlt.trim()
    if (!trimmedAlt) {
      setUploadError(t.altRequiredError)
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('_payload', JSON.stringify({ alt: trimmedAlt }))

      // REVIEW-REQUIRED: upload media to /api/media using authenticated admin credentials
      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!res.ok) {
        setUploadError(t.uploadFailed)
        setIsUploading(false)
        return
      }

      const createdDoc: MediaDoc = (await res.json()).doc
      setIsUploading(false)
      setSelectedFile(null)
      setUploadAlt('')

      if (createdDoc && createdDoc.id != null) {
        onChange(String(createdDoc.id))
        onSelectMedia?.(createdDoc)
        handleCloseModal()
      } else {
        setUploadError(t.uploadFailed)
      }
    } catch {
      setIsUploading(false)
      setUploadError(t.uploadFailed)
    }
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <span className="text-xs font-semibold text-deep-navy">{label}</span>}

      {/* Field display with thumbnail & actions */}
      <div className="flex items-center gap-2 p-2 rounded border border-deep-navy/20 bg-white">
        <div className="flex-1 min-w-0 text-xs text-deep-navy">
          {currentId ? (
            <RecordSummary collection="media" id={currentId} />
          ) : (
            <span className="text-deep-navy/70 italic">{placeholder || t.noImageSelected}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            ref={triggerButtonRef}
            type="button"
            onClick={handleOpenModal}
            // QA PK-18c: keep the accessible name the old Puck picker had ("Chọn ảnh từ thư viện
            // media…"); it contains the visible "Chọn ảnh", so label-in-name still holds.
            aria-label={currentId ? undefined : placeholder || undefined}
            className="px-2.5 py-1 text-xs font-medium bg-deep-navy/5 hover:bg-deep-navy/10 text-deep-navy rounded transition-colors"
          >
            {currentId ? t.changeImage : t.chooseImage}
          </button>
          {currentId && (
            <button
              type="button"
              onClick={handleRemove}
              title={t.removeImage}
              aria-label={t.removeImage}
              className="p-1 text-xs text-deep-navy/60 hover:text-accent-pink transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Modal Dialog – QA PK-18c: portal to <body>. Rendered in place it sat inside Puck's
          fields <form>, so its search / upload forms were nested forms and upload never sent. */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-deep-navy/50 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) handleCloseModal()
            }}
          >
            <div
              ref={modalRef}
              className="bg-white rounded-xl shadow-2xl border border-deep-navy/15 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-deep-navy/10 bg-warm-ivory/60">
                <h2 id={titleId} className="font-title text-lg font-bold text-deep-navy">
                  {t.modalTitle}
                </h2>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-lg text-deep-navy/60 hover:text-deep-navy hover:bg-deep-navy/10 transition-colors"
                  aria-label={t.close}
                >
                  ✕
                </button>
              </div>

              {/* Modal Top Bar: Search + Upload trigger */}
              <div className="p-4 border-b border-deep-navy/10 bg-white flex flex-wrap items-center gap-3">
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex-1 min-w-[240px] flex items-center gap-2"
                >
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="flex-1 h-9 px-3 text-xs rounded-lg border border-deep-navy/20 focus:outline-none focus:border-accent-pink"
                  />
                  <button
                    type="submit"
                    className="h-9 px-4 text-xs font-semibold bg-deep-navy text-white rounded-lg hover:bg-deep-navy/90 transition-colors"
                  >
                    {t.searchButton}
                  </button>
                </form>

                {/* Upload button directly adjacent */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 px-4 text-xs font-semibold bg-soft-pink text-deep-navy border border-accent-pink/40 rounded-lg hover:bg-soft-pink/80 transition-colors flex items-center gap-1.5"
                >
                  <span>↑</span>
                  <span>{t.uploadButton}</span>
                </button>
              </div>

              {/* Upload Drawer / Prompt when a file is selected */}
              {selectedFile && (
                <form
                  onSubmit={handleUploadSubmit}
                  className="p-4 bg-soft-pink/40 border-b border-accent-pink/20 flex flex-col gap-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs text-deep-navy font-medium">
                      <span className="font-semibold text-deep-navy">Tệp đã chọn:</span>{' '}
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex-1 w-full">
                      <label className="block text-[11px] font-semibold text-deep-navy mb-1">
                        {t.altLabel}
                      </label>
                      <input
                        type="text"
                        required
                        value={uploadAlt}
                        onChange={(e) => setUploadAlt(e.target.value)}
                        placeholder={t.altPlaceholder}
                        className="w-full h-8 px-2.5 text-xs rounded border border-deep-navy/20 focus:outline-none focus:border-accent-pink bg-white"
                        disabled={isUploading}
                      />
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto pt-4 sm:pt-0">
                      <button
                        type="submit"
                        disabled={isUploading || !uploadAlt.trim()}
                        className="h-8 px-4 text-xs font-semibold bg-deep-navy text-white rounded hover:bg-deep-navy/90 disabled:opacity-50 transition-colors"
                      >
                        {isUploading ? t.uploading : t.uploadConfirm}
                      </button>
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => {
                          setSelectedFile(null)
                          setUploadAlt('')
                          setUploadError(null)
                        }}
                        className="h-8 px-3 text-xs text-deep-navy/70 hover:text-deep-navy rounded transition-colors"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Global or Upload Error message */}
              {uploadError && (
                <div
                  role="alert"
                  className="px-4 py-2 bg-butter-cream text-deep-navy text-xs font-medium border-b border-deep-navy/10"
                >
                  {uploadError}
                </div>
              )}

              {/* Modal Body: Table list of images */}
              <div className="flex-1 overflow-y-auto p-4">
                {loading && items.length === 0 ? (
                  <div className="py-12 text-center text-xs text-deep-navy/60 italic">
                    Đang tải danh sách ảnh...
                  </div>
                ) : items.length === 0 ? (
                  <div className="py-12 text-center text-xs text-deep-navy/60 italic">
                    {t.noResults}
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-deep-navy/15 text-deep-navy font-semibold">
                        <th className="py-2.5 px-3 w-16">{t.colImage}</th>
                        <th className="py-2.5 px-3">{t.colAlt}</th>
                        <th className="py-2.5 px-3 w-48 hidden sm:table-cell">{t.colFilename}</th>
                        <th className="py-2.5 px-3 w-20 text-right">{t.select}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-deep-navy/10">
                      {items.map((item) => {
                        const thumb = item.thumbnailURL || item.url || ''
                        const isSelected = String(item.id) === currentId
                        return (
                          <tr
                            key={item.id}
                            onClick={() => handleSelectItem(item)}
                            className={`cursor-pointer hover:bg-lavender-mist/40 transition-colors ${
                              isSelected ? 'bg-soft-pink/50 font-medium' : ''
                            }`}
                          >
                            <td className="py-2 px-3">
                              {thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={thumb}
                                  alt={item.alt || ''}
                                  className="w-11 h-11 object-cover rounded border border-deep-navy/10"
                                />
                              ) : (
                                <div className="w-11 h-11 bg-deep-navy/5 rounded flex items-center justify-center text-[10px] text-deep-navy/70">
                                  N/A
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-deep-navy">
                              <span className="line-clamp-2">{item.alt || '—'}</span>
                            </td>
                            <td className="py-2 px-3 text-deep-navy/70 hidden sm:table-cell truncate max-w-[200px]">
                              {item.filename || '—'}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSelectItem(item)
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-deep-navy/10 hover:bg-accent-pink hover:text-white text-deep-navy rounded transition-colors"
                              >
                                {t.select}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}

                {/* Load More Button */}
                {hasNextPage && (
                  <div className="mt-4 pt-2 text-center border-t border-deep-navy/10">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleLoadMore}
                      className="px-4 py-1.5 text-xs font-semibold bg-deep-navy/5 hover:bg-deep-navy/10 text-deep-navy rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loading ? '...' : t.loadMore}
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-deep-navy/10 bg-warm-ivory/40 flex justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-1.5 text-xs font-semibold bg-deep-navy/10 hover:bg-deep-navy/20 text-deep-navy rounded-lg transition-colors"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
