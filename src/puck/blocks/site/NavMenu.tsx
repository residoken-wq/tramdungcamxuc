import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { NavMenuView } from '@/components/site/nav/NavMenuView'
import type { NavItem } from '@/components/site/Navbar'
import { vi } from '@/lib/i18n/vi'

export interface NavMenuProps {
  align?: 'left' | 'center' | 'right'
  breakpoint?: 'md' | 'lg'
  items?: NavItem[]
}

export const NavMenuBlock: ComponentConfig<NavMenuProps> = {
  label: vi.eb10.navMenuLabel,
  fields: {
    align: {
      type: 'select',
      label: 'Căn lề (Desktop)',
      options: [
        { label: 'Trái', value: 'left' },
        { label: 'Giữa', value: 'center' },
        { label: 'Phải', value: 'right' },
      ],
    },
    breakpoint: {
      type: 'select',
      label: 'Chuyển sang menu mobile ở',
      options: [
        { label: 'Màn hình vừa (md - 768px)', value: 'md' },
        { label: 'Màn hình lớn (lg - 1024px)', value: 'lg' },
      ],
    },
  },
  defaultProps: {
    align: 'center',
    breakpoint: 'lg',
    items: [],
  },
  render: ({ align = 'center', breakpoint = 'lg', items = [] }) => {
    return (
      <div className="relative w-full flex items-center">
        <NavMenuView
          items={items}
          align={align}
          breakpoint={breakpoint}
          showAccountLink={false}
          showCta={false}
          showFeaturedItem={false}
        />
      </div>
    )
  },
}
