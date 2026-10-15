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

export interface TrialWelcomeEmailProps {
  name: string
  toolName: string
  expiresAtFormatted: string
  trialDays: number
  toolUrl: string
}

export const TrialWelcomeEmail: React.FC<TrialWelcomeEmailProps> = ({
  name,
  toolName,
  expiresAtFormatted,
  trialDays,
  toolUrl,
}) => {
  const strings = vi.email.trialWelcome

  return (
    <Html lang="vi">
      <Head />
      <Preview>{strings.preview(toolName, trialDays)}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={brandLabelStyle}>{strings.brandLabel}</Text>
            <Heading style={headingStyle}>{strings.heading}</Heading>
            <Text style={subheadingStyle}>{strings.subheading(name, trialDays, toolName)}</Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* Details */}
          <Section style={contentSectionStyle}>
            <Section style={highlightBoxStyle}>
              <Text style={highlightItemStyle}>
                <strong>{strings.toolLabel}</strong> {toolName}
              </Text>
              <Text style={highlightItemStyle}>
                <strong>{strings.trialDurationLabel}</strong>{' '}
                {strings.trialDurationValue(trialDays)}
              </Text>
              <Text style={highlightItemStyle}>
                <strong>{strings.expiresAtLabel}</strong> {expiresAtFormatted}{' '}
                {strings.vietnamTimeSuffix}
              </Text>
              <Text style={highlightItemStyle}>
                <strong>{strings.statusLabel}</strong> {strings.statusValue}
              </Text>
            </Section>

            <Text style={paragraphStyle}>{strings.body}</Text>

            {/* CTA Button */}
            <Section style={buttonContainerStyle}>
              <Button style={buttonStyle} href={toolUrl}>
                {strings.ctaButton(toolName)}
              </Button>
              <Text style={noteStyle}>{strings.accountNotice}</Text>
            </Section>
          </Section>

          <Hr style={dividerStyle} />

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerSignOffStyle}>{strings.footerSignOff}</Text>
            <Text style={footerAuthorStyle}>{strings.footerAuthor}</Text>
            <Text style={footerNoticeStyle}>{strings.footerNotice}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default TrialWelcomeEmail

const mainStyle: React.CSSProperties = {
  backgroundColor: '#FAF7F4',
  fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: 0,
  padding: '24px 0',
}

const containerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '32px 24px',
  maxWidth: '580px',
  borderRadius: '16px',
  border: '1px solid #E9DDF9',
}

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '16px',
}

const brandLabelStyle: React.CSSProperties = {
  color: '#BC039E',
  fontSize: '11px',
  fontWeight: 'bold',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  margin: '0 0 8px',
}

const headingStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const subheadingStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: 0,
  opacity: 0.85,
}

const dividerStyle: React.CSSProperties = {
  borderColor: '#E9DDF9',
  margin: '24px 0',
}

const contentSectionStyle: React.CSSProperties = {
  marginBottom: '24px',
}

const highlightBoxStyle: React.CSSProperties = {
  backgroundColor: '#FAF7F4',
  borderRadius: '12px',
  padding: '16px 20px',
  border: '1px solid #E9DDF9',
  marginBottom: '20px',
}

const highlightItemStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '13px',
  lineHeight: '1.8',
  margin: '4px 0',
}

const paragraphStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 20px',
}

const buttonContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  margin: '28px 0 12px',
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#EF3B83',
  color: '#ffffff',
  borderRadius: '9999px',
  padding: '12px 28px',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  display: 'inline-block',
}

const noteStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '12px',
  opacity: 0.65,
  marginTop: '12px',
  marginBottom: 0,
}

const footerStyle: React.CSSProperties = {
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
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const footerNoticeStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '11px',
  opacity: 0.5,
  margin: 0,
}
