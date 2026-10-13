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

export interface WorkshopReminderEmailProps {
  name: string
  workshopTitle: string
  workshopTimeFormatted: string
  accountUrl?: string
}

export const WorkshopReminderEmail: React.FC<WorkshopReminderEmailProps> = ({
  name,
  workshopTitle,
  workshopTimeFormatted,
  accountUrl = 'https://tramdungcamxuc.com/tai-khoan',
}) => {
  const i18n = vi.workshop.reminderEmail

  return (
    <Html lang="vi">
      <Head />
      <Preview>{i18n.subject(workshopTitle)}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={brandLabelStyle}>{i18n.brandLabel}</Text>
            <Heading style={headingStyle}>{i18n.title}</Heading>
            <Text style={subheadingStyle}>{i18n.greeting(name || 'bạn')}</Text>
            <Text style={paragraphStyle}>{i18n.intro(workshopTitle)}</Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* Workshop Details Highlight */}
          <Section style={contentSectionStyle}>
            <Section style={highlightBoxStyle}>
              <Text style={highlightItemStyle}>
                <strong>Tên workshop:</strong> {workshopTitle}
              </Text>
              <Text style={highlightItemStyle}>
                <strong>{i18n.workshopTimeLabel}</strong> {workshopTimeFormatted}
              </Text>
            </Section>

            {/* Note & CTA Button */}
            <Section style={sectionBoxStyle}>
              <Text style={paragraphStyle}>{i18n.accountNotice}</Text>
              <Section style={buttonContainerStyle}>
                <Button style={buttonStyle} href={accountUrl}>
                  {i18n.accountButton}
                </Button>
              </Section>
            </Section>
          </Section>

          <Hr style={dividerStyle} />

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              {i18n.footerSignOff}
              <br />
              <strong>{i18n.footerAuthor}</strong>
            </Text>
            <Text style={footerSubtextStyle}>{i18n.footerAutoNotice}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const mainStyle: React.CSSProperties = {
  backgroundColor: '#FAF7F4',
  fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: '40px 0',
}

const containerStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  border: '1px solid #E9DDF9',
  padding: '32px',
  maxWidth: '580px',
  margin: '0 auto',
}

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '20px',
}

const brandLabelStyle: React.CSSProperties = {
  color: '#BC039E',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '1px',
  margin: '0 0 8px 0',
}

const headingStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '24px',
  fontWeight: 700,
  lineHeight: '1.3',
  margin: '0 0 12px 0',
}

const subheadingStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '16px',
  fontWeight: 600,
  margin: '0 0 8px 0',
}

const contentSectionStyle: React.CSSProperties = {
  marginBottom: '24px',
}

const highlightBoxStyle: React.CSSProperties = {
  backgroundColor: '#FDE6F6',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '16px 0 24px 0',
  border: '1px solid #EF3B83',
}

const highlightItemStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '14px',
  margin: '6px 0',
  lineHeight: '1.5',
}

const sectionBoxStyle: React.CSSProperties = {
  backgroundColor: '#FAF7F4',
  borderRadius: '12px',
  padding: '20px',
  margin: '16px 0',
  border: '1px solid #E9DDF9',
}

const paragraphStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
}

const buttonContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  margin: '16px 0 8px 0',
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#EF3B83',
  borderRadius: '9999px',
  color: '#FFFFFF',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '12px 28px',
}

const dividerStyle: React.CSSProperties = {
  borderColor: '#E9DDF9',
  margin: '24px 0',
}

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '24px',
}

const footerTextStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0 0 12px 0',
}

const footerSubtextStyle: React.CSSProperties = {
  color: '#71717A',
  fontSize: '11px',
  lineHeight: '1.5',
  margin: '0',
}
