import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { vi } from '@/lib/i18n/vi'

export interface TrialReminderEmailProps {
  name: string
  toolName: string
  milestone: 'day_18' | 'day_21'
  daysLeft: number
  /** Giá hiện hành từ CMS (đã định dạng); null khi CMS chưa có giá → không hiện giá */
  formattedPrice: string | null
  originalPriceFormatted?: string | null
  /** true khi sản phẩm mua là dùng vĩnh viễn (accessDurationDays trống) */
  isLifetime?: boolean
  checkoutUrl: string
  toolUrl: string
}

export const TrialReminderEmail: React.FC<TrialReminderEmailProps> = ({
  name,
  toolName,
  milestone,
  daysLeft,
  formattedPrice,
  originalPriceFormatted,
  isLifetime = true,
  checkoutUrl,
  toolUrl,
}) => {
  const t = vi.trial.email.reminder
  const isDay21 = milestone === 'day_21'
  const previewText = isDay21
    ? vi.trial.email.reminder21Subject(toolName)
    : vi.trial.email.reminder18Subject(toolName, daysLeft)
  const headingText = isDay21 ? t.heading21 : t.heading18(daysLeft)
  const statusLabel = isDay21 ? t.statusLastDay : t.statusDaysLeft(daysLeft)

  return (
    <Html lang="vi">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={brandLabelStyle}>{t.brandLabel}</Text>
            <Heading style={headingStyle}>{headingText}</Heading>
            <Text style={subheadingStyle}>{t.greeting(name, toolName)}</Text>
          </Section>

          <Hr style={dividerStyle} />

          <Section style={contentSectionStyle}>
            <Section style={highlightBoxStyle}>
              <Text style={highlightItemStyle}>
                <strong>{t.toolLabel}</strong> {toolName}
              </Text>
              <Text style={highlightItemStyle}>
                <strong>{t.statusLabel}</strong> {statusLabel}
              </Text>
              {formattedPrice && (
                <Text style={highlightItemStyle}>
                  <strong>{isLifetime ? t.priceLabelLifetime : t.priceLabel}</strong>{' '}
                  {formattedPrice}
                  {originalPriceFormatted && (
                    <span style={strikethroughStyle}> ({originalPriceFormatted})</span>
                  )}
                </Text>
              )}
              <Text style={highlightItemStyle}>
                <strong>{t.dataLabel}</strong> {t.dataValue}
              </Text>
            </Section>

            <Text style={paragraphStyle}>{isDay21 ? t.body21 : t.body18(daysLeft)}</Text>

            <Section style={buttonContainerStyle}>
              <Button style={buttonStyle} href={checkoutUrl}>
                {formattedPrice ? t.buyButtonWithPrice(formattedPrice) : t.buyButton}
              </Button>
              <Section style={{ marginTop: '16px', textAlign: 'center' }}>
                <Link href={toolUrl} style={secondaryLinkStyle}>
                  {t.toolLink}
                </Link>
              </Section>
            </Section>
          </Section>

          <Hr style={dividerStyle} />

          <Section style={footerStyle}>
            <Text style={footerSignOffStyle}>{t.signOff}</Text>
            <Text style={footerAuthorStyle}>{t.author}</Text>
            <Text style={footerNoticeStyle}>{t.autoNotice}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default TrialReminderEmail

const mainStyle: React.CSSProperties = {
  backgroundColor: '#FAF7F4', // warm-ivory
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  padding: '40px 0',
}

const containerStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '24px',
  border: '1px solid rgba(40, 10, 96, 0.08)',
  margin: '0 auto',
  maxWidth: '600px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(40, 10, 96, 0.04)',
}

const headerStyle: React.CSSProperties = {
  backgroundColor: '#E9DDF9', // lavender-mist
  padding: '36px 32px 28px',
  textAlign: 'center',
}

const brandLabelStyle: React.CSSProperties = {
  color: '#BC039E', // bright-magenta
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '1.5px',
  margin: '0 0 10px',
  textTransform: 'uppercase',
}

const headingStyle: React.CSSProperties = {
  color: '#280A60', // deep-navy
  fontSize: '24px',
  fontWeight: 700,
  lineHeight: '1.3',
  margin: '0 0 10px',
}

const subheadingStyle: React.CSSProperties = {
  color: 'rgba(40, 10, 96, 0.8)',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: 0,
}

const dividerStyle: React.CSSProperties = {
  borderColor: 'rgba(40, 10, 96, 0.08)',
  borderWidth: '1px',
  margin: 0,
}

const contentSectionStyle: React.CSSProperties = {
  padding: '32px',
}

const highlightBoxStyle: React.CSSProperties = {
  backgroundColor: '#FDE6F6', // soft-pink
  borderRadius: '16px',
  padding: '20px 24px',
  marginBottom: '24px',
}

const highlightItemStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '6px 0',
}

const strikethroughStyle: React.CSSProperties = {
  textDecoration: 'line-through',
  color: 'rgba(40, 10, 96, 0.5)',
}

const paragraphStyle: React.CSSProperties = {
  color: 'rgba(40, 10, 96, 0.85)',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 24px',
}

const buttonContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '28px',
  marginBottom: '12px',
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#BC039E', // bright-magenta
  borderRadius: '9999px',
  color: '#FFFFFF',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: 600,
  padding: '14px 32px',
  textDecoration: 'none',
  boxShadow: '0 4px 12px rgba(188, 3, 158, 0.25)',
}

const secondaryLinkStyle: React.CSSProperties = {
  color: '#EF3B83', // accent-pink
  fontSize: '13px',
  fontWeight: 600,
  textDecoration: 'none',
}

const footerStyle: React.CSSProperties = {
  backgroundColor: '#FAF7F4', // warm-ivory
  padding: '28px 32px',
  textAlign: 'center',
}

const footerSignOffStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '14px',
  fontStyle: 'italic',
  margin: '0 0 4px',
}

const footerAuthorStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '14px',
  fontWeight: 600,
  margin: '0 0 16px',
}

const footerNoticeStyle: React.CSSProperties = {
  color: 'rgba(40, 10, 96, 0.5)',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: 0,
}
