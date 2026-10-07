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

export interface ResourceDeliveryFile {
  filename: string
  downloadUrl: string
}

export interface ResourceDeliveryEmailProps {
  name: string
  productName: string
  files: ResourceDeliveryFile[]
  expiresAtFormatted?: string
}

export const ResourceDeliveryEmail: React.FC<ResourceDeliveryEmailProps> = ({
  name,
  productName,
  files,
  expiresAtFormatted,
}) => {
  return (
    <Html lang="vi">
      <Head />
      <Preview>Tài liệu miễn phí: {productName} – Trạm Dừng Cảm Xúc</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={brandLabelStyle}>TRẠM DỪNG CẢM XÚC</Text>
            <Heading style={headingStyle}>Chào {name || 'bạn'},</Heading>
            <Text style={subheadingStyle}>
              Tài liệu &ldquo;{productName}&rdquo; bạn yêu cầu đã sẵn sàng để tải về.
            </Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* Download Links Section */}
          <Section style={contentSectionStyle}>
            <Text style={paragraphStyle}>
              Trạm Dừng Cảm Xúc xin gửi bạn liên kết tải tài nguyên bên dưới. Mỗi liên kết được ký
              bảo mật và có hiệu lực trong vòng <strong>7 ngày</strong>
              {expiresAtFormatted ? ` (đến hết ${expiresAtFormatted})` : ''}.
            </Text>

            <Text style={paragraphStyle}>
              Vui lòng bấm vào nút bên dưới để tải tài liệu trực tiếp về thiết bị của bạn:
            </Text>

            {files.map((file, idx) => (
              <Section key={idx} style={fileBoxStyle}>
                <Text style={fileTitleStyle}>
                  📄 <strong>{file.filename}</strong>
                </Text>
                <Button style={buttonStyle} href={file.downloadUrl}>
                  Tải xuống tài liệu
                </Button>
                <Text style={linkFallbackStyle}>
                  Hoặc truy cập: <span style={linkFallbackUrlStyle}>{file.downloadUrl}</span>
                </Text>
              </Section>
            ))}

            <Section style={noticeBoxStyle}>
              <Text style={noticeTextStyle}>
                💡 <strong>Lưu ý:</strong> Sau 7 ngày, liên kết tải sẽ tự động hết hạn để bảo vệ an
                toàn tài nguyên. Nếu cần tải lại sau thời gian này, bạn có thể quay lại website và
                đăng ký nhận tài nguyên một lần nữa.
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
              Email này được gửi tự động từ tramdungcamxuc.com đến {name || 'bạn'}.
              <br />
              Nếu bạn không yêu cầu tài liệu này, vui lòng bỏ qua email.
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
  margin: '0 0 8px 0',
}

const headingStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#280A60',
  margin: '0 0 12px 0',
}

const subheadingStyle: React.CSSProperties = {
  fontSize: '16px',
  color: '#280A60',
  margin: '0',
  lineHeight: '1.5',
}

const dividerStyle: React.CSSProperties = {
  borderColor: '#E9DDF9',
  borderWidth: '1px',
  margin: '20px 0',
}

const contentSectionStyle: React.CSSProperties = {
  margin: '20px 0',
}

const paragraphStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#280A60',
  margin: '0 0 16px 0',
}

const fileBoxStyle: React.CSSProperties = {
  backgroundColor: '#FAF7F4',
  borderRadius: '12px',
  border: '1px solid #E9DDF9',
  padding: '18px 20px',
  margin: '16px 0',
  textAlign: 'center',
}

const fileTitleStyle: React.CSSProperties = {
  fontSize: '15px',
  color: '#280A60',
  margin: '0 0 14px 0',
  wordBreak: 'break-all',
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#EF3B83',
  color: '#FFFFFF',
  borderRadius: '10px',
  padding: '12px 28px',
  fontSize: '15px',
  fontWeight: 700,
  textDecoration: 'none',
  display: 'inline-block',
  boxShadow: '0 2px 6px rgba(239, 59, 131, 0.25)',
}

const linkFallbackStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'rgba(40, 10, 96, 0.6)',
  marginTop: '12px',
  marginBottom: '0',
  wordBreak: 'break-all',
}

const linkFallbackUrlStyle: React.CSSProperties = {
  color: '#BC039E',
}

const noticeBoxStyle: React.CSSProperties = {
  backgroundColor: '#FDE6F6',
  borderRadius: '10px',
  borderLeft: '4px solid #BC039E',
  padding: '12px 16px',
  marginTop: '20px',
}

const noticeTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#280A60',
  margin: '0',
  lineHeight: '1.5',
}

const footerStyle: React.CSSProperties = {
  marginTop: '24px',
  textAlign: 'center',
}

const footerTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#280A60',
  lineHeight: '1.5',
  margin: '0 0 12px 0',
}

const footerSubtextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'rgba(40, 10, 96, 0.6)',
  lineHeight: '1.4',
  margin: '0',
}
