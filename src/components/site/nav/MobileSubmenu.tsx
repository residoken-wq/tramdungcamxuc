'use client'

import React, { useId } from 'react'
import Link from 'next/link'
import type { NavItem } from '../Navbar'
import { isCurrentPath } from './current'

/**
 * Accordion entry of the mobile drawer. Only one entry is open at a time (the drawer owns the
 * open state); choosing a link closes the drawer.
 */
export function MobileSubmenu({
  item,
  pathname,
  open,
  onToggle,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  open: boolean
  onToggle: () => void
  onNavigate: () => void
}) {
  const panelId = useId()
  const groups = item.groups ?? []
  const hasOwnLink = item.href !== ''

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full min-h-[44px] items-center justify-between rounded-lg px-3 py-2.5 text-left font-ui text-base font-semibold text-deep-navy hover:bg-lavender-mist/40 transition-colors focus-visible:outline-2 focus-visible:outline-deep-navy cursor-pointer"
      >
        <span>{item.label}</span>
        <svg
          className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div id={panelId} hidden={!open} className="space-y-3 pb-2 pl-4">
        {hasOwnLink && (
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={isCurrentPath(pathname, item.href) ? 'page' : undefined}
            className="block min-h-[44px] rounded-lg px-3 py-2.5 font-ui text-sm font-semibold text-deep-navy hover:bg-lavender-mist/40 focus-visible:outline-2 focus-visible:outline-deep-navy"
          >
            {item.label}
          </Link>
        )}
        {groups.map((group, groupIndex) => (
          <div key={`${group.label ?? ''}-${groupIndex}`}>
            {group.label && (
              <p className="px-3 pb-1 font-ui text-xs font-bold uppercase tracking-wider text-bright-magenta">
                {group.label}
              </p>
            )}
            <ul>
              {group.items.map((child, childIndex) => {
                const current = isCurrentPath(pathname, child.href)
                return (
                  <li key={`${child.href}-${childIndex}`}>
                    <Link
                      href={child.href}
                      onClick={onNavigate}
                      aria-current={current ? 'page' : undefined}
                      className={[
                        'block min-h-[44px] rounded-lg px-3 py-2 hover:bg-lavender-mist/40 focus-visible:outline-2 focus-visible:outline-deep-navy',
                        current ? 'bg-soft-pink' : '',
                      ].join(' ')}
                    >
                      <span
                        className={`block font-ui text-sm font-semibold ${child.featured ? 'text-bright-magenta' : 'text-deep-navy'}`}
                      >
                        {child.label}
                      </span>
                      {child.description && (
                        <span className="block font-ui text-xs text-deep-navy/75">
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
  )
}
