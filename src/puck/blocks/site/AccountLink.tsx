import React from 'react'
import Link from 'next/link'
import type { ComponentConfig } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import type { NavbarCustomer } from '@/components/site/Navbar'

export interface AccountLinkProps {
  version?: number
  showIcon?: boolean
}

export const AccountLinkBlock: ComponentConfig<AccountLinkProps> = {
  label: vi.eb10.accountLinkLabel,
  fields: {
    showIcon: {
      type: 'radio',
      label: 'Biểu tượng người dùng',
      options: [
        { label: 'Hiện', value: true },
        { label: 'Ẩn', value: false },
      ],
    },
  },
  defaultProps: {
    version: 1,
    showIcon: true,
  },
  render: ({ showIcon = true, puck }) => {
    // Read logged-in customer strictly from Puck metadata (passed from layout via Render metadata)
    const customer = puck?.metadata?.customer as NavbarCustomer | null | undefined

    const href = customer ? '/tai-khoan' : '/tai-khoan/dang-nhap'
    const label =
      customer?.name?.trim() || (customer ? customer.email.split('@')[0] : vi.auth.accountNavLabel)

    return (
      <div className="flex items-center">
        <Link
          href={href}
          className="font-ui text-sm font-semibold transition-colors duration-150 py-1 border-b-2 border-transparent text-deep-navy hover:text-bright-magenta hover:border-bright-magenta/40 focus-visible:outline-2 focus-visible:outline-deep-navy rounded-sm flex items-center gap-1.5"
        >
          {showIcon && (
            <svg
              className="w-4 h-4 text-bright-magenta flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          )}
          <span className="max-w-[140px] truncate">{label}</span>
        </Link>
      </div>
    )
  },
}
