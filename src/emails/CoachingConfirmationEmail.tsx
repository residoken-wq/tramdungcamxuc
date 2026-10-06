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

interface CoachingConfirmationEmailProps {
  name: string
  serviceName?: string
}

export const CoachingConfirmationEmail: React.FC<CoachingConfirmationEmailProps> = ({
  name,
  serviceName,
}) => {
  return (
    <Html lang="vi">
      <Head />
      <Preview>Trạm Dừng Cảm Xúc – Xác nhận thông tin tư vấn Coaching 1:1</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={brandLabelStyle}>TRẠM DỪNG CẢM XÚC · COACHING 1:1</Text>
            <Heading style={headingStyle}>Chào {name || 'bạn'},</Heading>
            <Text style={subheadingStyle}>
              Trạm đã nhận được yêu cầu kết nối tư vấn coaching của bạn.
            </Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* Body Content */}
          <Section style={contentSectionStyle}>
            <Text style={paragraphStyle}>
              Cảm ơn bạn đã mở lòng và tin tưởng lựa chọn Trạm Dừng Cảm Xúc là nơi đồng hành trên chặng đường
              phát triển bản thân và cảm xúc.
            </Text>
            {serviceName && (
              <Section style={highlightBoxStyle}>
                <Text style={highlightLabelStyle}>Chương trình quan tâm:</Text>
                <Text style={highlightValueStyle}>{serviceName}</Text>
              </Section>
            )}
            <Text style={paragraphStyle}>
              Hana Lương và đội ngũ Trạm sẽ xem xét thông tin và phản hồi tới bạn qua email hoặc số điện thoại
              trong vòng <strong>24 – 48 giờ làm việc</strong> để sắp xếp lịch hẹn phù hợp.
            </Text>
            <Text style={paragraphStyle}>
              Nếu bạn có bất kỳ câu hỏi nào cần giải đáp thêm, đừng ngần ngại trả lời trực tiếp email này nhé.
            </Text>
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

const highlightBoxStyle: React.CSSProperties = {
  backgroundColor: '#FDE6F6',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '16px 0',
  borderLeft: '4px solid #BC039E',
}

const highlightLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#766B82',
  textTransform: 'uppercase',
  margin: '0 0 4px 0',
  fontWeight: 600,
}

const highlightValueStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#280A60',
  margin: 0,
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

export default CoachingConfirmationEmail
