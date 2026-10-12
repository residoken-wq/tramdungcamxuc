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

export interface DigitalToolOrderPaidEmailProps {
  name: string
  paymentRef: string
  amount: number
  toolName: string
  accessDurationDays?: number | null
  toolUrl: string
}

export const DigitalToolOrderPaidEmail: React.FC<DigitalToolOrderPaidEmailProps> = ({
  name,
  paymentRef,
  amount,
  toolName,
  accessDurationDays,
  toolUrl,
}) => {
  const formattedAmount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)

  const isLifetime = !accessDurationDays || accessDurationDays <= 0
  const durationText = isLifetime ? 'Dùng vĩnh viễn' : `${accessDurationDays} ngày`

  return (
    <Html lang="vi">
      <Head />
      <Preview>
        Trạm Dừng Cảm Xúc – Kích hoạt công cụ số {toolName} ({durationText})
      </Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={brandLabelStyle}>TRẠM DỪNG CẢM XÚC · CÔNG CỤ SỐ</Text>
            <Heading style={headingStyle}>Kích hoạt thành công!</Heading>
            <Text style={subheadingStyle}>
              Chào {name || 'bạn'}, Trạm đã xác nhận thanh toán và kích hoạt quyền truy cập cho bạn.
            </Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* Order Details */}
          <Section style={contentSectionStyle}>
            <Section style={highlightBoxStyle}>
              <Text style={highlightItemStyle}>
                <strong>Mã đơn hàng:</strong> {paymentRef}
              </Text>
              <Text style={highlightItemStyle}>
                <strong>Công cụ:</strong> {toolName}
              </Text>
              <Text style={highlightItemStyle}>
                <strong>Thời hạn quyền truy cập:</strong> {durationText}
              </Text>
              <Text style={highlightItemStyle}>
                <strong>Số tiền đã thanh toán:</strong> {formattedAmount}
              </Text>
              <Text style={highlightItemStyle}>
                <strong>Trạng thái:</strong> Đang hiệu lực
              </Text>
            </Section>

            <Text style={paragraphStyle}>
              Quyền sử dụng công cụ đã được liên kết trực tiếp vào tài khoản của bạn. Bạn có thể mở
              công cụ để tiếp tục hành trình chăm sóc cảm xúc và xây dựng thói quen vững vàng mỗi
              ngày.
            </Text>

            {/* CTA Button */}
            <Section style={buttonContainerStyle}>
              <Button style={buttonStyle} href={toolUrl}>
                Mở {toolName} ngay
              </Button>
              <Text style={noteStyle}>
                Bạn cũng có thể xem lại quyền truy cập bất cứ lúc nào trong mục &quot;Tài khoản của
                tôi&quot;.
              </Text>
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
              Email xác nhận tự động từ tramdungcamxuc.com. Nếu có câu hỏi cần hỗ trợ, bạn có thể
              trả lời trực tiếp email này.
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

const highlightBoxStyle: React.CSSProperties = {
  backgroundColor: '#FDE6F6',
  border: '1px solid #EF3B83',
  borderRadius: '12px',
  padding: '16px 20px',
  marginBottom: '20px',
}

const highlightItemStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '4px 0',
}

const buttonContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  margin: '28px 0',
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#EF3B83',
  color: '#FFFFFF',
  borderRadius: '9999px',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  padding: '14px 28px',
  display: 'inline-block',
}

const noteStyle: React.CSSProperties = {
  color: '#6B7280',
  fontSize: '12px',
  marginTop: '10px',
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
