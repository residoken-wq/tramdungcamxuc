import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { vi } from '@/lib/i18n/vi'

export interface TrackerNudgeEmailProps {
  name: string
  trackerUrl: string
}

export const TrackerNudgeEmail: React.FC<TrackerNudgeEmailProps> = ({ name, trackerUrl }) => {
  const t = vi.tracker.nudgeEmail
  const displayName = name ? name.trim() : 'bạn'

  return (
    <Html lang="vi">
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={brandLabelStyle}>TRẠM DỪNG CẢM XÚC</Text>
            <Heading style={headingStyle}>{t.heading}</Heading>
          </Section>

          <Hr style={dividerStyle} />

          <Section style={contentSectionStyle}>
            <Text style={greetingStyle}>Chào {displayName},</Text>
            <Text style={paragraphStyle}>{t.body1}</Text>
            <Text style={paragraphStyle}>{t.body2}</Text>

            <Section style={buttonContainerStyle}>
              <Button style={buttonStyle} href={trackerUrl}>
                {t.actionButton}
              </Button>
            </Section>
          </Section>

          <Hr style={dividerStyle} />

          <Section style={footerStyle}>
            <Text style={footerSignOffStyle}>{t.signOff}</Text>
            <Text style={footerAuthorStyle}>{t.author}</Text>
            <Text style={footerNoticeStyle}>{t.footerNote}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default TrackerNudgeEmail

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
  margin: 0,
}

const dividerStyle: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid rgba(40, 10, 96, 0.08)',
  margin: 0,
}

const contentSectionStyle: React.CSSProperties = {
  padding: '32px 32px 28px',
}

const greetingStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '15px',
  fontWeight: 600,
  margin: '0 0 16px',
}

const paragraphStyle: React.CSSProperties = {
  color: 'rgba(40, 10, 96, 0.85)',
  fontSize: '14px',
  lineHeight: '1.65',
  margin: '0 0 16px',
}

const buttonContainerStyle: React.CSSProperties = {
  margin: '28px 0 12px',
  textAlign: 'center',
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#EF3B83', // accent-pink
  borderRadius: '9999px',
  color: '#FFFFFF',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 700,
  padding: '14px 32px',
  textDecoration: 'none',
  boxShadow: '0 2px 8px rgba(239, 59, 131, 0.25)',
}

const footerStyle: React.CSSProperties = {
  backgroundColor: '#FAF7F4', // warm-ivory
  padding: '24px 32px',
  textAlign: 'center',
}

const footerSignOffStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '13px',
  fontStyle: 'italic',
  margin: '0 0 4px',
}

const footerAuthorStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '13px',
  fontWeight: 700,
  margin: '0 0 12px',
}

const footerNoticeStyle: React.CSSProperties = {
  color: 'rgba(40, 10, 96, 0.5)',
  fontSize: '11px',
  margin: 0,
}
