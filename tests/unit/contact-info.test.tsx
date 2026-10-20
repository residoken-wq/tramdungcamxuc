import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ContactInfo } from '@/components/site/ContactInfo'
import { vi as viStrings } from '@/lib/i18n/vi'

describe('SM-06: ContactInfo component', () => {
  const fullContact = {
    email: 'lienhe@tramdungcamxuc.com',
    hotline: '0901 234 567',
    officeAddress: '123 Đường An Yên, Quận 1, TP. HCM',
    linkedInUrl: 'https://linkedin.com/company/tramdungcamxuc',
    facebookUrl: 'https://facebook.com/tramdungcamxuc',
    youtubeUrl: 'https://youtube.com/@tramdungcamxuc',
    zaloChatUrl: 'https://zalo.me/0901234567',
  }

  it('renders all contact items when fully provided', () => {
    const { container } = render(
      <ContactInfo
        _resolved={{ contact: fullContact }}
        showEmail={true}
        showHotline={true}
        showOfficeAddress={true}
        showSocial={true}
      />,
    )

    expect(screen.getByText('lienhe@tramdungcamxuc.com')).toBeTruthy()
    expect(screen.getByText('0901 234 567')).toBeTruthy()
    expect(screen.getByText('123 Đường An Yên, Quận 1, TP. HCM')).toBeTruthy()

    // Email mailto link
    const emailLink = screen.getByRole('link', { name: /lienhe@tramdungcamxuc\.com/i })
    expect(emailLink.getAttribute('href')).toBe('mailto:lienhe@tramdungcamxuc.com')

    // Hotline tel link with spaces removed
    const phoneLink = screen.getByRole('link', { name: /0901 234 567/i })
    expect(phoneLink.getAttribute('href')).toBe('tel:0901234567')

    // Social links have target="_blank" and rel="noopener noreferrer"
    const fbLink = screen.getByRole('link', { name: viStrings.sm06.contactInfo.facebookLabel })
    expect(fbLink.getAttribute('href')).toBe('https://facebook.com/tramdungcamxuc')
    expect(fbLink.getAttribute('target')).toBe('_blank')
    expect(fbLink.getAttribute('rel')).toBe('noopener noreferrer')

    const zaloLink = screen.getByRole('link', { name: viStrings.sm06.contactInfo.zaloChatLabel })
    expect(zaloLink.getAttribute('href')).toBe('https://zalo.me/0901234567')

    expect(container).toMatchSnapshot()
  })

  it('correctly normalizes dotted hotline into clean tel: link', () => {
    render(
      <ContactInfo
        _resolved={{
          contact: {
            ...fullContact,
            hotline: '0901.234.567',
          },
        }}
      />,
    )

    const phoneLink = screen.getByRole('link', { name: /0901\.234\.567/i })
    expect(phoneLink.getAttribute('href')).toBe('tel:0901234567')
  })

  it('renders partial items when some switches are disabled', () => {
    const { container } = render(
      <ContactInfo
        _resolved={{ contact: fullContact }}
        showEmail={true}
        showHotline={false}
        showOfficeAddress={false}
        showSocial={false}
      />,
    )

    expect(screen.getByText('lienhe@tramdungcamxuc.com')).toBeTruthy()
    expect(screen.queryByText('0901 234 567')).toBeNull()
    expect(screen.queryByText('123 Đường An Yên, Quận 1, TP. HCM')).toBeNull()
    expect(
      screen.queryByRole('link', { name: viStrings.sm06.contactInfo.facebookLabel }),
    ).toBeNull()

    expect(container).toMatchSnapshot()
  })

  it('renders null on public page when contact data is empty', () => {
    const { container } = render(
      <ContactInfo _resolved={{ contact: null }} puck={{ isEditing: false }} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders editor warning placeholder when empty and isEditing is true', () => {
    render(<ContactInfo _resolved={{ contact: null }} puck={{ isEditing: true }} />)

    expect(screen.getByText(viStrings.sm06.contactInfo.editorEmpty)).toBeTruthy()
  })
})
