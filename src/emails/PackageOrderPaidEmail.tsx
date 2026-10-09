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

export interface PackageOrderPaidEmailProps {
  name: string
  paymentRef: string
  amount: number
  packageName: string
  components?: Array<{ label: string; quantity?: number | null }>
  hasDigitalTools?: boolean
  toolsUrl?: string
  coachingBookingUrl?: string | null
  upcomingWorkshops?: Array<{ title: string; timeString: string }>
  communityZaloUrl?: string | null
}

export const PackageOrderPaidEmail: React.FC<PackageOrderPaidEmailProps> = ({
  name,
  paymentRef,
  amount,
  packageName,
  components = [],
  hasDigitalTools = false,
  toolsUrl = 'https://tramdungcamxuc.com',
  coachingBookingUrl,
  upcomingWorkshops = [],
  communityZaloUrl,
}) => {
  const i18n = vi.payment.email.packagePaid
  const formattedAmount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)

  return (
    <Html lang="vi">
      <Head />
      <Preview>{i18n.subject(packageName)}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={brandLabelStyle}>{i18n.brandLabel}</Text>
            <Heading style={headingStyle}>{i18n.title}</Heading>
            <Text style={subheadingStyle}>{i18n.greeting(name)}</Text>
            <Text style={paragraphStyle}>{i18n.welcomeText(packageName)}</Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* Chi tiết đơn hàng */}
          <Section style={contentSectionStyle}>
            <Section style={highlightBoxStyle}>
              <Text style={highlightItemStyle}>
                <strong>{i18n.orderRefLabel}</strong> {paymentRef}
              </Text>
              <Text style={highlightItemStyle}>
                <strong>{i18n.packageLabel}</strong> {packageName}
              </Text>
              <Text style={highlightItemStyle}>
                <strong>{i18n.amountLabel}</strong> {formattedAmount}
              </Text>
              <Text style={highlightItemStyle}>
                <strong>{i18n.statusLabel}</strong> {i18n.statusPaid}
              </Text>
            </Section>

            {/* Danh sách cấu phần của gói */}
            {components.length > 0 && (
              <Section style={sectionBoxStyle}>
                <Text style={sectionTitleStyle}>{i18n.componentsHeading}</Text>
                {components.map((c, idx) => (
                  <Text key={idx} style={listItemStyle}>
                    • <strong>{c.label}</strong>
                    {typeof c.quantity === 'number' && c.quantity > 1
                      ? ` (${c.quantity} phiên)`
                      : ''}
                  </Text>
                ))}
              </Section>
            )}

            {/* Công cụ số đã kích hoạt */}
            {hasDigitalTools && (
              <Section style={sectionBoxStyle}>
                <Text style={sectionTitleStyle}>{i18n.digitalToolsHeading}</Text>
                <Text style={paragraphStyle}>{i18n.digitalToolsDesc}</Text>
                <Section style={buttonContainerStyle}>
                  <Button style={buttonStyle} href={toolsUrl}>
                    {i18n.digitalToolsButton}
                  </Button>
                </Section>
                <Text style={noteSubtextStyle}>{i18n.digitalToolsNote}</Text>
              </Section>
            )}

            {/* Đặt lịch Coaching 1:1 */}
            {coachingBookingUrl && (
              <Section style={sectionBoxStyle}>
                <Text style={sectionTitleStyle}>{i18n.coachingHeading}</Text>
                <Text style={paragraphStyle}>{i18n.coachingDesc}</Text>
                <Section style={buttonContainerStyle}>
                  <Button style={buttonStyle} href={coachingBookingUrl}>
                    {i18n.coachingButton}
                  </Button>
                </Section>
              </Section>
            )}

            {/* Lịch workshop sắp tới */}
            {upcomingWorkshops.length > 0 && (
              <Section style={sectionBoxStyle}>
                <Text style={sectionTitleStyle}>{i18n.workshopsHeading}</Text>
                <Text style={paragraphStyle}>{i18n.workshopsDesc}</Text>
                {upcomingWorkshops.map((ws, idx) => (
                  <Text key={idx} style={listItemStyle}>
                    📅 <strong>{ws.title}</strong> – {ws.timeString}
                  </Text>
                ))}
              </Section>
            )}

            {/* Nhóm Zalo cộng đồng */}
            {communityZaloUrl && (
              <Section style={sectionBoxStyle}>
                <Text style={sectionTitleStyle}>{i18n.communityHeading}</Text>
                <Text style={paragraphStyle}>{i18n.communityDesc}</Text>
                <Section style={buttonContainerStyle}>
                  <Button style={secondaryButtonStyle} href={communityZaloUrl}>
                    {i18n.communityButton}
                  </Button>
                </Section>
              </Section>
            )}
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
  margin: '4px 0',
  lineHeight: '1.5',
}

const sectionBoxStyle: React.CSSProperties = {
  backgroundColor: '#FAF7F4',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '16px 0',
  border: '1px solid #E9DDF9',
}

const sectionTitleStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '15px',
  fontWeight: 700,
  margin: '0 0 8px 0',
}

const paragraphStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 12px 0',
}

const listItemStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '4px 0',
}

const buttonContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  margin: '14px 0 8px 0',
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

const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: '#280A60',
  borderRadius: '9999px',
  color: '#FFFFFF',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '12px 28px',
}

const noteSubtextStyle: React.CSSProperties = {
  color: '#71717A',
  fontSize: '11px',
  fontStyle: 'italic',
  margin: '8px 0 0 0',
  textAlign: 'center',
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
