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

interface CustomerOtpEmailProps {
  email: string
  code: string
}

export const CustomerOtpEmail: React.FC<CustomerOtpEmailProps> = ({ email, code }) => {
  return (
    <Html lang="vi">
      <Head />
      <Preview>Mã xác thực đăng nhập Trạm Dừng Cảm Xúc: {code}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={brandLabelStyle}>TRẠM DỪNG CẢM XÚC</Text>
            <Heading style={headingStyle}>Mã xác thực đăng nhập</Heading>
            <Text style={subheadingStyle}>
              Dưới đây là mã xác thực OTP 6 số để đăng nhập vào tài khoản của bạn ({email}).
            </Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* OTP Code Box */}
          <Section style={codeBoxSectionStyle}>
            <Text style={codePromptStyle}>Mã đăng nhập của bạn:</Text>
            <Section style={codeCardStyle}>
              <Text style={codeTextStyle}>{code}</Text>
            </Section>
            <Text style={validityNoticeStyle}>
              Mã có hiệu lực trong <strong>10 phút</strong>. Vui lòng không chia sẻ mã này với bất
              kỳ ai.
            </Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* Body Note */}
          <Section style={contentSectionStyle}>
            <Text style={paragraphStyle}>
              Nếu bạn không yêu cầu mã xác thực này, bạn có thể yên tâm bỏ qua email này. Tài khoản
              của bạn vẫn được bảo vệ an toàn.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Thân mến,
              <br />
              <strong>Hana Lương &amp; Đội ngũ Trạm Dừng Cảm Xúc</strong>
            </Text>
            <Text style={footerSubtextStyle}>
              Email tự động từ tramdungcamxuc.com. Điểm tựa bình yên cho hành trình của bạn.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const mainStyle: React.CSSProperties = {
  backgroundColor: '#FAF7F4', // warm-ivory
  fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: '40px 0',
}

const containerStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '20px',
  border: '1px solid #E9DDF9', // lavender-mist
  padding: '36px 32px',
  maxWidth: '540px',
  margin: '0 auto',
}

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '20px',
}

const brandLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '1.5px',
  color: '#BC039E', // bright-magenta
  textTransform: 'uppercase',
  margin: '0 0 10px 0',
}

const headingStyle: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 700,
  color: '#280A60', // deep-navy
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

const codeBoxSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '8px 0',
}

const codePromptStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#280A60',
  margin: '0 0 12px 0',
}

const codeCardStyle: React.CSSProperties = {
  backgroundColor: '#FDE6F6', // soft-pink
  borderRadius: '16px',
  border: '2px dashed #EF3B83', // accent-pink
  padding: '16px 24px',
  display: 'inline-block',
  margin: '0 auto 16px auto',
  textAlign: 'center',
}

const codeTextStyle: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: 800,
  letterSpacing: '8px',
  color: '#280A60', // deep-navy
  margin: 0,
  fontFamily: 'Montserrat, monospace, sans-serif',
}

const validityNoticeStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#554271',
  margin: 0,
  lineHeight: '1.5',
}

const contentSectionStyle: React.CSSProperties = {
  padding: '0 8px',
}

const paragraphStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#554271',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
}

const footerStyle: React.CSSProperties = {
  marginTop: '24px',
  paddingTop: '16px',
  borderTop: '1px solid #E9DDF9',
}

const footerTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#280A60',
  lineHeight: '1.5',
  margin: '0 0 8px 0',
}

const footerSubtextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#84739E',
  lineHeight: '1.4',
  margin: 0,
}
