import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ContactForms } from '@/components/site/ContactForms'
import { vi as viStrings } from '@/lib/i18n/vi'

describe('SM-06: ContactForms component', () => {
  const mockResolved = {
    services: [
      { id: 1, name: '[MẪU] Khai vấn Cá nhân 1:1', slug: 'khai-van-ca-nhan' },
      { id: 2, name: '[MẪU] Đồng hành Cảm xúc', slug: 'dong-hanh-cam-xuc' },
    ],
    programs: [
      { id: 101, name: '[MẪU] Tập Thương Cảm Xúc Doanh Nghiệp', slug: 'tap-thuong-cam-xuc-dn' },
    ],
    leadStatusOptions: [
      { id: 'opt1', label: '[MẪU] Đang căng thẳng, quá tải' },
      { id: 'opt2', label: '[MẪU] Cần định hướng lại thói quen' },
    ],
  }

  it('renders columns layout with both B2C and B2B forms side by side', () => {
    const { container } = render(<ContactForms layout="columns" _resolved={mockResolved} />)

    // Heading titles for both sections
    expect(screen.getByText(viStrings.sm06.contactForms.defaultB2CTitle)).toBeTruthy()
    expect(screen.getByText(viStrings.sm06.contactForms.defaultB2BTitle)).toBeTruthy()

    // Service dropdown in B2C
    expect(screen.getByText('[MẪU] Khai vấn Cá nhân 1:1')).toBeTruthy()

    // Status dropdown in B2C
    expect(screen.getByText('[MẪU] Đang căng thẳng, quá tải')).toBeTruthy()

    // Program dropdown in B2B
    expect(screen.getByText('[MẪU] Tập Thương Cảm Xúc Doanh Nghiệp')).toBeTruthy()

    expect(container).toMatchSnapshot()
  })

  it('renders tabs layout with tablist and switches tabs via click', () => {
    const { container } = render(<ContactForms layout="tabs" _resolved={mockResolved} />)

    const tabPersonal = screen.getByRole('tab', { name: viStrings.sm06.contactForms.tabPersonal })
    const tabBusiness = screen.getByRole('tab', { name: viStrings.sm06.contactForms.tabBusiness })

    expect(tabPersonal).toBeTruthy()
    expect(tabBusiness).toBeTruthy()

    const personalPanel = container.querySelector('[id$="-panel-personal"]')
    const businessPanel = container.querySelector('[id$="-panel-business"]')

    expect(personalPanel).toBeTruthy()
    expect(businessPanel).toBeTruthy()

    // Initially Personal tab is selected and visible; Business is hidden
    expect(tabPersonal.getAttribute('aria-selected')).toBe('true')
    expect(tabBusiness.getAttribute('aria-selected')).toBe('false')
    expect(personalPanel?.hasAttribute('hidden')).toBe(false)
    expect(businessPanel?.hasAttribute('hidden')).toBe(true)

    // Click Business tab
    fireEvent.click(tabBusiness)

    expect(tabPersonal.getAttribute('aria-selected')).toBe('false')
    expect(tabBusiness.getAttribute('aria-selected')).toBe('true')
    expect(personalPanel?.hasAttribute('hidden')).toBe(true)
    expect(businessPanel?.hasAttribute('hidden')).toBe(false)

    expect(container).toMatchSnapshot()
  })

  it('supports keyboard navigation (ArrowRight, ArrowLeft) between tabs', () => {
    const { container } = render(<ContactForms layout="tabs" _resolved={mockResolved} />)

    const tabPersonal = screen.getByRole('tab', { name: viStrings.sm06.contactForms.tabPersonal })
    const tabBusiness = screen.getByRole('tab', { name: viStrings.sm06.contactForms.tabBusiness })
    const personalPanel = container.querySelector('[id$="-panel-personal"]')
    const businessPanel = container.querySelector('[id$="-panel-business"]')

    // Focus on personal tab, press ArrowRight
    tabPersonal.focus()
    fireEvent.keyDown(tabPersonal, { key: 'ArrowRight' })

    expect(tabBusiness.getAttribute('aria-selected')).toBe('true')
    expect(tabPersonal.getAttribute('aria-selected')).toBe('false')
    expect(personalPanel?.hasAttribute('hidden')).toBe(true)
    expect(businessPanel?.hasAttribute('hidden')).toBe(false)

    // Press ArrowLeft
    fireEvent.keyDown(tabBusiness, { key: 'ArrowLeft' })

    expect(tabPersonal.getAttribute('aria-selected')).toBe('true')
    expect(tabBusiness.getAttribute('aria-selected')).toBe('false')
    expect(personalPanel?.hasAttribute('hidden')).toBe(false)
    expect(businessPanel?.hasAttribute('hidden')).toBe(true)
  })

  it('preserves form field values when toggling between tabs', () => {
    const { container } = render(<ContactForms layout="tabs" _resolved={mockResolved} />)

    const tabPersonal = screen.getByRole('tab', { name: viStrings.sm06.contactForms.tabPersonal })
    const tabBusiness = screen.getByRole('tab', { name: viStrings.sm06.contactForms.tabBusiness })

    // Fill B2C name input
    const b2cNameInput = container.querySelector<HTMLInputElement>('input[id$="-b2c-name"]')!
    expect(b2cNameInput).toBeTruthy()
    fireEvent.change(b2cNameInput, { target: { value: 'Nguyễn Văn Test' } })
    expect(b2cNameInput.value).toBe('Nguyễn Văn Test')

    // Switch to Business tab
    fireEvent.click(tabBusiness)

    // Fill B2B company input
    const b2bCompanyInput = container.querySelector<HTMLInputElement>('input[id$="-b2b-company"]')!
    expect(b2bCompanyInput).toBeTruthy()
    fireEvent.change(b2bCompanyInput, { target: { value: 'Công ty Test Corp' } })
    expect(b2bCompanyInput.value).toBe('Công ty Test Corp')

    // Switch back to Personal tab
    fireEvent.click(tabPersonal)

    // Check B2C name is still preserved
    expect(b2cNameInput.value).toBe('Nguyễn Văn Test')

    // Switch back to Business tab
    fireEvent.click(tabBusiness)

    // Check B2B company is still preserved
    expect(b2bCompanyInput.value).toBe('Công ty Test Corp')
  })
})
