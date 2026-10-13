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
  return (
    <Html lang="vi">
      <Head />
      <Preview>{`Trạm Dừng Cảm Xúc – Kích hoạt dùng thử ${toolName} (${trialDays} ngày)`}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={brandLabelStyle}>TRẠM DỪNG CẢM XÚC · DÙNG THỬ CÔNG CỤ SỐ</Text>
            <Heading style={headingStyle}>Kích hoạt dùng thử thành công!</Heading>
            <Text style={subheadingStyle}>
              Chào {name || 'bạn'}, phiên dùng thử {trialDays} ngày công cụ {toolName} của bạn đã
              sẵn sàng.
            </Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* Details */}
          <Section style={contentSectionStyle}>
            <Section style={highlightBoxStyle}>
              <Text style={highlightItemStyle}>
                <strong>Công cụ:</strong> {toolName}
              </Text>
              <Text style={highlightItemStyle}>
                <strong>Thời hạn dùng thử:</strong> {trialDays} ngày miễn phí
              </Text>
              <Text style={highlightItemStyle}>
                <strong>Hạn sử dụng:</strong> {expiresAtFormatted} (giờ Việt Nam)
              </Text>
              <Text style={highlightItemStyle}>
                <strong>Trạng thái:</strong> Đang dùng thử
              </Text>
            </Section>

            <Text style={paragraphStyle}>
              Hãy dành ra 5 phút mỗi ngày để dừng lại, lắng nghe và thấu hiểu cảm xúc của mình. Bạn
              có thể bắt đầu ngay hôm nay để hình thành thói quen vững vàng.
            </Text>

            {/* CTA Button */}
            <Section style={buttonContainerStyle}>
              <Button style={buttonStyle} href={toolUrl}>
                Vào {toolName} ngay
              </Button>
              <Text style={noteStyle}>
                Bạn cũng có thể xem lại quyền dùng thử bất cứ lúc nào trong mục &quot;Tài khoản của
                tôi&quot;.
              </Text>
            </Section>
          </Section>

          <Hr style={dividerStyle} />

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerSignOffStyle}>Thương mến,</Text>
            <Text style={footerAuthorStyle}>Hana Lương &amp; Đội ngũ Trạm Dừng Cảm Xúc</Text>
            <Text style={footerNoticeStyle}>
              Email thông báo tự động từ tramdungcamxuc.com khi kích hoạt dùng thử công cụ số.
            </Text>
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
