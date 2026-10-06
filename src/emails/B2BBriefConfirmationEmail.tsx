import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface B2BBriefConfirmationEmailProps {
  name: string
  company: string
  teamSize?: string
  timeline?: string
}

export const B2BBriefConfirmationEmail: React.FC<B2BBriefConfirmationEmailProps> = ({
  name,
  company,
  teamSize,
  timeline,
}) => {
  return (
    <Html lang="vi">
      <Head />
      <Preview>Trạm Dừng Cảm Xúc – Xác nhận yêu cầu tư vấn giải pháp doanh nghiệp</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={brandLabelStyle}>TRẠM DỪNG CẢM XÚC · DOANH NGHIỆP</Text>
            <Heading style={headingStyle}>Kính gửi Anh/Chị {name || ''},</Heading>
            <Text style={subheadingStyle}>
              Xác nhận tiếp nhận thông tin từ {company || 'quý doanh nghiệp'}.
            </Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* Body Content */}
          <Section style={contentSectionStyle}>
            <Text style={paragraphStyle}>
              Trạm Dừng Cảm Xúc xin chân thành cảm ơn quý doanh nghiệp đã quan tâm và gửi yêu cầu tư vấn
              về các chương trình đào tạo trí tuệ cảm xúc (EQ), thói quen và văn hóa tổ chức.
            </Text>
            <Section style={detailBoxStyle}>
              <Text style={detailRowStyle}>
                <strong>Đơn vị:</strong> {company}
              </Text>
              {teamSize && (
                <Text style={detailRowStyle}>
                  <strong>Quy mô đội ngũ:</strong> {teamSize}
                </Text>
              )}
              {timeline && (
                <Text style={detailRowStyle}>
                  <strong>Thời gian dự kiến:</strong> {timeline}
                </Text>
              )}
            </Section>
            <Text style={paragraphStyle}>
              Chuyên gia tư vấn của Trạm Dừng Cảm Xúc sẽ nghiên cứu nhu cầu và liên hệ trực tiếp với quý
              doanh nghiệp trong vòng <strong>24 – 48 giờ làm việc</strong> để trao đổi chi tiết và đề xuất giải pháp phù hợp.
            </Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Trân trọng hợp tác,
              <br />
              <strong>Đội ngũ Giải pháp Doanh nghiệp · Trạm Dừng Cảm Xúc</strong>
            </Text>
            <Text style={footerSubtextStyle}>
              Email gửi tự động từ tramdungcamxuc.com.
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
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '1.5px',
  color: '#BC039E',
  textTransform: 'uppercase',
  margin: '0 0 12px 0',
}

const headingStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#280A60',
  margin: '0 0 8px 0',
  lineHeight: '1.3',
}

const subheadingStyle: React.CSSProperties = {
  fontSize: '15px',
  color: '#554271',
  margin: 0,
  lineHeight: '1.5',
}

const dividerStyle: React.CSSProperties = {
  borderColor: '#E9DDF9',
  margin: '24px 0',
}

const contentSectionStyle: React.CSSProperties = {
  padding: '0 8px',
}

const paragraphStyle: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#280A60',
  margin: '0 0 16px 0',
}

const detailBoxStyle: React.CSSProperties = {
  backgroundColor: '#E9DDF9',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '16px 0',
}

const detailRowStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#280A60',
  margin: '4px 0',
  lineHeight: '1.5',
}

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  paddingTop: '8px',
}

const footerTextStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#280A60',
  margin: '0 0 16px 0',
}

const footerSubtextStyle: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '1.4',
  color: '#84759B',
  margin: 0,
}

export default B2BBriefConfirmationEmail
