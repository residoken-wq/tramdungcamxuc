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

interface ExperienceOrderExpiredEmailProps {
  name: string
  reorderUrl?: string
}

export const ExperienceOrderExpiredEmail: React.FC<ExperienceOrderExpiredEmailProps> = ({
  name,
  reorderUrl = 'https://tramdungcamxuc.com/coaching/growth-mirror',
}) => {
  return (
    <Html lang="vi">
      <Head />
      <Preview>Trạm Dừng Cảm Xúc – Nhắc hẹn phiên trải nghiệm Growth Mirror</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={brandLabelStyle}>TRẠM DỪNG CẢM XÚC · GROWTH MIRROR</Text>
            <Heading style={headingStyle}>Nhắc hẹn phiên trải nghiệm</Heading>
            <Text style={subheadingStyle}>
              Chào {name || 'bạn'}, đơn đăng ký phiên trải nghiệm Growth Mirror của bạn đã hết hạn
              sau 24 giờ.
            </Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* Body Content */}
          <Section style={contentSectionStyle}>
            <Text style={paragraphStyle}>
              Vì phiên trải nghiệm chưa nhận được thanh toán trong vòng 24 giờ, hệ thống đã tạm thời
              đóng yêu cầu để dành khung giờ cho các bạn khác.
            </Text>
            <Text style={paragraphStyle}>
              Nếu bạn vẫn đang ở một bước chuyển và mong muốn được lắng nghe, thấu hiểu và định hình
              lại lộ trình của mình, Hana luôn sẵn sàng chào đón bạn.
            </Text>

            <Section style={buttonContainerStyle}>
              <Button style={buttonStyle} href={reorderUrl}>
                Đăng ký lại phiên trải nghiệm
              </Button>
            </Section>
          </Section>

          <Hr style={dividerStyle} />

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Trân trọng và ấm áp,
              <br />
              <strong>Hana Lương (ICF ACC) &amp; Trạm Dừng Cảm Xúc</strong>
            </Text>
            <Text style={footerSubtextStyle}>
              Bạn nhận được email này vì đã đồng ý nhận thông tin từ Trạm Dừng Cảm Xúc.
            </Text>
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
  maxWidth: '560px',
  margin: '0 auto',
}

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '24px',
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
  margin: '0 0 12px 0',
}

const subheadingStyle: React.CSSProperties = {
  color: '#4B5563',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
}

const dividerStyle: React.CSSProperties = {
  borderColor: '#E9DDF9',
  margin: '24px 0',
}

const contentSectionStyle: React.CSSProperties = {
  marginBottom: '24px',
}

const paragraphStyle: React.CSSProperties = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.7',
  margin: '0 0 16px 0',
}

const buttonContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  margin: '28px 0',
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#280A60',
  color: '#FFFFFF',
  borderRadius: '9999px',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  padding: '14px 28px',
  display: 'inline-block',
}

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
}

const footerTextStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 12px 0',
}

const footerSubtextStyle: React.CSSProperties = {
  color: '#9CA3AF',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0',
}
