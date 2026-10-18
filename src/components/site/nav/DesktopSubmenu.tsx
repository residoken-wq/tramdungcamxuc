'use client'

import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { vi } from '@/lib/i18n/vi'
import type { NavItem } from '../Navbar'
import { isCurrentPath } from './current'

const CLOSE_DELAY_MS = 150

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

const itemClass = (active: boolean, featured: boolean) =>
  [
    'font-ui text-sm font-semibold transition-colors duration-150 py-1 border-b-2 rounded-sm',
    'focus-visible:outline-2 focus-visible:outline-deep-navy',
    active ? 'border-bright-magenta/60' : 'border-transparent',
    featured
      ? 'text-bright-magenta hover:text-deep-navy font-bold'
      : 'text-deep-navy hover:text-bright-magenta hover:border-bright-magenta/40',
  ].join(' ')

/**
 * Desktop menu item with a submenu panel. Opens on hover (with a short close delay so the
 * pointer can travel to the panel), on click and on Enter / Space; Esc closes it and returns
 * focus to the trigger; clicking outside closes it.
 */
export function DesktopSubmenu({ item, pathname }: { item: NavItem; pathname: string }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const groups = item.groups ?? []
  const hasOwnLink = item.href !== ''
  const active =
    (hasOwnLink && isCurrentPath(pathname, item.href)) ||
    groups.some((group) => group.items.some((child) => isCurrentPath(pathname, child.href)))

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }
  const close = useCallback((returnFocus: boolean) => {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(true)
    }
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open, close])

  useEffect(() => cancelClose, [])

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => {
        cancelClose()
        setOpen(true)
      }}
      onMouseLeave={scheduleClose}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <div className="flex items-center gap-1">
        {hasOwnLink && (
          <Link
            href={item.href}
            aria-current={isCurrentPath(pathname, item.href) ? 'page' : undefined}
            className={itemClass(active, Boolean(item.featured))}
          >
            {item.label}
          </Link>
        )}
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={hasOwnLink ? vi.navbar.openSubmenu(item.label) : undefined}
          onClick={() => setOpen((prev) => !prev)}
          className={[
            itemClass(active, false),
            'inline-flex items-center gap-1 cursor-pointer',
            hasOwnLink ? 'min-h-[32px] px-1' : '',
          ].join(' ')}
        >
          {!hasOwnLink && item.label}
          <Chevron open={open} />
        </button>
      </div>

      <div
        id={panelId}
        hidden={!open}
        className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3"
      >
        <div
          className={[
            'flex gap-8 rounded-2xl border border-deep-navy/10 bg-white p-6 shadow-soft',
            groups.length > 1 ? 'w-max max-w-[min(90vw,44rem)]' : 'w-72',
          ].join(' ')}
        >
          {groups.map((group, groupIndex) => (
            <div key={`${group.label ?? ''}-${groupIndex}`} className="min-w-[13rem] flex-1">
              {group.label && (
                <p className="mb-3 font-ui text-xs font-bold uppercase tracking-wider text-bright-magenta">
                  {group.label}
                </p>
              )}
              <ul className="space-y-1">
                {group.items.map((child, childIndex) => {
                  const current = isCurrentPath(pathname, child.href)
                  return (
                    <li key={`${child.href}-${childIndex}`}>
                      <Link
                        href={child.href}
                        aria-current={current ? 'page' : undefined}
                        onClick={() => setOpen(false)}
                        className={[
                          'block rounded-xl px-3 py-2 transition-colors duration-150',
                          'hover:bg-lavender-mist/50 focus-visible:outline-2 focus-visible:outline-deep-navy',
                          current ? 'bg-soft-pink' : '',
                        ].join(' ')}
                      >
                        <span
                          className={`block font-ui text-sm font-semibold ${child.featured ? 'text-bright-magenta' : 'text-deep-navy'}`}
                        >
                          {child.label}
                        </span>
                        {child.description && (
                          <span className="mt-0.5 block font-ui font-normal text-xs text-deep-navy/75">
                            {child.description}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
