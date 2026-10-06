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

interface LeadConfirmationEmailProps {
  name: string
  resourceName?: string
}

export const LeadConfirmationEmail: React.FC<LeadConfirmationEmailProps> = ({
  name,
  resourceName = 'Tài nguyên tâm lý & thói quen',
}) => {
  return (
    <Html lang="vi">
      <Head />
      <Preview>Trạm Dừng Cảm Xúc – Xác nhận gửi tài nguyên</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={brandLabelStyle}>TRẠM DỪNG CẢM XÚC</Text>
            <Heading style={headingStyle}>Chào {name || 'bạn'},</Heading>
            <Text style={subheadingStyle}>
              Cảm ơn bạn đã kết nối và đăng ký nhận {resourceName}.
            </Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* Body Content */}
          <Section style={contentSectionStyle}>
            <Text style={paragraphStyle}>
              Trạm Dừng Cảm Xúc rất vui được đồng hành cùng bạn trên hành trình thấu hiểu và chăm sóc
              sức khỏe cảm xúc của mình.
            </Text>
            <Text style={paragraphStyle}>
              Tài nguyên bạn quan tâm đã được ghi nhận vào hệ thống. Đội ngũ của Trạm đang chuẩn bị và sẽ gửi
              thông tin chi tiết tới hòm thư này trong thời gian sớm nhất.
            </Text>
            <Section style={quoteBoxStyle}>
              <Text style={quoteTextStyle}>
                &ldquo;Dừng lại một nhịp, lắng nghe chính mình để chuyển hóa từ bên trong.&rdquo;
              </Text>
            </Section>
          </Section>

          <Hr style={dividerStyle} />

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Thân mến,
              <br />
              <strong>Hana Lương &amp; Đội ngũ Trạm Dừng Cảm Xúc</strong>
            </Text>
            <Text style={footerSubtextStyle}>
              Email này được gửi tự động từ tramdungcamxuc.com.
              Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email.
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

const quoteBoxStyle: React.CSSProperties = {
  backgroundColor: '#FDE6F6',
  borderLeft: '4px solid #EF3B83',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '20px 0',
}

const quoteTextStyle: React.CSSProperties = {
  fontSize: '14px',
  fontStyle: 'italic',
  color: '#280A60',
  margin: 0,
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

export default LeadConfirmationEmail
