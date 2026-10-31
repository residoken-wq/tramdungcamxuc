'use client'

import React from 'react'
import { usePuck } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { switchLeftPanelTab } from './LeftPanel'

export type EditorToolbarProps = {
  pageSlug: string
  currentStatus: string
}

export function EditorToolbar({ pageSlug, currentStatus }: EditorToolbarProps) {
  const { appState, dispatch, history } = usePuck()

  const currentWidth = appState?.ui?.viewports?.current?.width ?? 1440
  const isLeftSidebarOpen = appState?.ui?.leftSideBarVisible ?? true

  const canUndo = Boolean(history?.hasPast)
  const canRedo = Boolean(history?.hasFuture)

  const isPublished = currentStatus === 'published'
  const previewHref = pageSlug === '/' ? '/' : `/${pageSlug.replace(/^\//, '')}`

  const handleSelectViewport = (width: number) => {
    dispatch({
      type: 'setUi',
      ui: (prev) => ({
        viewports: {
          ...prev.viewports,
          current: {
            width,
            height: 'auto',
          },
        },
      }),
    })
  }

  const handleToggleSidebar = () => {
    dispatch({
      type: 'setUi',
      ui: (prev) => ({
        leftSideBarVisible: !prev.leftSideBarVisible,
      }),
    })
  }

  return (
    <footer
      aria-label="Thanh công cụ trình dựng"
      className="bg-white border-t border-deep-navy/10 px-3 py-1.5 flex items-center justify-between text-xs text-deep-navy shadow-sm z-30 shrink-0 select-none"
    >
      {/* Left group: Toggle Sidebar + Navigator shortcut */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleToggleSidebar}
          aria-pressed={isLeftSidebarOpen}
          aria-label={
            isLeftSidebarOpen
              ? vi.eb03?.toolbar?.collapseSidebar || 'Thu gọn thanh bên'
              : vi.eb03?.toolbar?.expandSidebar || 'Mở thanh bên'
          }
          title={
            isLeftSidebarOpen
              ? vi.eb03?.toolbar?.collapseSidebar || 'Thu gọn thanh bên'
              : vi.eb03?.toolbar?.expandSidebar || 'Mở thanh bên'
          }
          className={`p-1.5 rounded-lg border transition cursor-pointer ${
            isLeftSidebarOpen
              ? 'border-deep-navy/20 bg-warm-ivory text-deep-navy hover:bg-soft-pink/40'
              : 'border-deep-navy/10 bg-white text-deep-navy/70 hover:text-deep-navy hover:bg-soft-pink/30'
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
            <path strokeLinecap="round" strokeWidth="2" d="M9 3v18" />
          </svg>
        </button>

        {/* Structure / Navigator shortcut */}
        <button
          type="button"
          onClick={() => switchLeftPanelTab('outline')}
          aria-label={vi.eb03?.toolbar?.structure || 'Cấu trúc'}
          title={vi.eb03?.toolbar?.structure || 'Cấu trúc'}
          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg font-ui text-xs font-semibold border border-deep-navy/15 bg-white hover:bg-soft-pink/40 transition cursor-pointer text-deep-navy"
        >
          <svg
            className="w-4 h-4 text-deep-navy"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          <span className="hidden sm:inline">{vi.eb03?.toolbar?.structure || 'Cấu trúc'}</span>
        </button>
      </div>

      {/* Center group: Device viewport switcher (375 / 768 / 1440) */}
      <div
        role="group"
        aria-label="Chọn kích thước màn hình"
        className="flex items-center bg-warm-ivory/80 p-0.5 rounded-lg border border-deep-navy/10 gap-0.5"
      >
        {/* Mobile 375 */}
        <button
          type="button"
          onClick={() => handleSelectViewport(375)}
          aria-pressed={currentWidth === 375}
          aria-label={vi.eb03?.viewports?.mobile || 'Điện thoại (375px)'}
          title={vi.eb03?.viewports?.mobile || 'Điện thoại (375px)'}
          className={`p-1.5 rounded-md transition cursor-pointer flex items-center justify-center ${
            currentWidth === 375
              ? 'bg-deep-navy text-white shadow-xs font-bold'
              : 'text-deep-navy/60 hover:text-deep-navy hover:bg-white/80'
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <rect x="7" y="2" width="10" height="20" rx="2" strokeWidth="2" />
            <path strokeLinecap="round" strokeWidth="2" d="M11 18h2" />
          </svg>
        </button>

        {/* Tablet 768 */}
        <button
          type="button"
          onClick={() => handleSelectViewport(768)}
          aria-pressed={currentWidth === 768}
          aria-label={vi.eb03?.viewports?.tablet || 'Máy tính bảng (768px)'}
          title={vi.eb03?.viewports?.tablet || 'Máy tính bảng (768px)'}
          className={`p-1.5 rounded-md transition cursor-pointer flex items-center justify-center ${
            currentWidth === 768
              ? 'bg-deep-navy text-white shadow-xs font-bold'
              : 'text-deep-navy/60 hover:text-deep-navy hover:bg-white/80'
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <rect x="4" y="3" width="16" height="18" rx="2" strokeWidth="2" />
            <circle cx="12" cy="17" r="0.5" fill="currentColor" />
          </svg>
        </button>

        {/* Desktop 1440 */}
        <button
          type="button"
          onClick={() => handleSelectViewport(1440)}
          aria-pressed={currentWidth === 1440}
          aria-label={vi.eb03?.viewports?.desktop || 'Máy tính (1440px)'}
          title={vi.eb03?.viewports?.desktop || 'Máy tính (1440px)'}
          className={`p-1.5 rounded-md transition cursor-pointer flex items-center justify-center ${
            currentWidth === 1440
              ? 'bg-deep-navy text-white shadow-xs font-bold'
              : 'text-deep-navy/60 hover:text-deep-navy hover:bg-white/80'
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2" />
            <line x1="8" y1="21" x2="16" y2="21" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="17" x2="12" y2="21" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Right group: Undo, Redo, View Public Page */}
      <div className="flex items-center gap-1.5">
        {/* Undo */}
        <button
          type="button"
          onClick={() => history?.back()}
          disabled={!canUndo}
          aria-label={vi.eb03?.toolbar?.undo || 'Hoàn tác'}
          title={vi.eb03?.toolbar?.undo || 'Hoàn tác (Ctrl+Z)'}
          className="p-1.5 rounded-lg border border-deep-navy/15 bg-white text-deep-navy hover:bg-soft-pink/40 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 10h10a5 5 0 015 5v2M3 10l5-5M3 10l5 5"
            />
          </svg>
        </button>

        {/* Redo */}
        <button
          type="button"
          onClick={() => history?.forward()}
          disabled={!canRedo}
          aria-label={vi.eb03?.toolbar?.redo || 'Làm lại'}
          title={vi.eb03?.toolbar?.redo || 'Làm lại (Ctrl+Shift+Z)'}
          className="p-1.5 rounded-lg border border-deep-navy/15 bg-white text-deep-navy hover:bg-soft-pink/40 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 10H11a5 5 0 00-5 5v2M21 10l-5-5M21 10l5 5"
            />
          </svg>
        </button>

        <div className="w-px h-4 bg-deep-navy/15 mx-0.5" />

        {/* View Public Page */}
        {isPublished ? (
          <a
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={vi.eb03?.toolbar?.viewPage || 'Xem trang'}
            title={vi.eb03?.toolbar?.viewPage || 'Xem trang (mở tab mới)'}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-ui text-xs font-semibold border border-deep-navy/20 bg-white hover:bg-warm-ivory text-deep-navy transition"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span className="hidden sm:inline">{vi.eb03?.toolbar?.viewPage || 'Xem trang'}</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            aria-label={vi.eb03?.toolbar?.publishToView || 'Xuất bản để xem'}
            title={vi.eb03?.toolbar?.publishToView || 'Xuất bản để xem'}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-ui text-xs font-semibold border border-deep-navy/10 bg-warm-ivory text-deep-navy/40 cursor-not-allowed opacity-60"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
              />
            </svg>
            <span className="hidden sm:inline">{vi.eb03?.toolbar?.viewPage || 'Xem trang'}</span>
          </button>
        )}
      </div>
    </footer>
  )
}
