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

interface ExperienceOrderPaidEmailProps {
  name: string
  paymentRef: string
  amount: number
  bookingUrl?: string | null
}

export const ExperienceOrderPaidEmail: React.FC<ExperienceOrderPaidEmailProps> = ({
  name,
  paymentRef,
  amount,
  bookingUrl,
}) => {
  const formattedAmount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)

  return (
    <Html lang="vi">
      <Head />
      <Preview>
        Trạm Dừng Cảm Xúc – Xác nhận thanh toán &amp; Link đặt lịch phiên trải nghiệm Growth Mirror
      </Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={brandLabelStyle}>TRẠM DỪNG CẢM XÚC · GROWTH MIRROR</Text>
            <Heading style={headingStyle}>Thanh toán thành công!</Heading>
            <Text style={subheadingStyle}>
              Chào {name || 'bạn'}, Trạm đã nhận được chuyển khoản cho phiên trải nghiệm của bạn.
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
                <strong>Dịch vụ:</strong> Phiên trải nghiệm 1:1 Growth Mirror (60–90 phút)
              </Text>
              <Text style={highlightItemStyle}>
                <strong>Số tiền đã thanh toán:</strong> {formattedAmount}
              </Text>
              <Text style={highlightItemStyle}>
                <strong>Trạng thái:</strong> Đã xác nhận
              </Text>
            </Section>

            <Text style={paragraphStyle}>
              Phiên trải nghiệm Growth Mirror là không gian an toàn để bạn nhìn nhận lại bước chuyển
              của bản thân, lắng nghe những cảm xúc thật và làm rõ mục tiêu đồng hành cùng Hana.
            </Text>

            {bookingUrl && (
              <Section style={buttonContainerStyle}>
                <Button style={buttonStyle} href={bookingUrl}>
                  Đặt lịch hẹn cùng Hana ngay
                </Button>
                <Text style={bookingNoteStyle}>
                  Vui lòng bấm nút trên để chọn khung giờ bạn cảm thấy thoải mái và tập trung nhất.
                </Text>
              </Section>
            )}

            {!bookingUrl && (
              <Text style={paragraphStyle}>
                Hana sẽ liên hệ trực tiếp với bạn qua email này hoặc Zalo trong vòng{' '}
                <strong>24 giờ làm việc</strong> để sắp xếp lịch hẹn thuận tiện nhất cho bạn.
              </Text>
            )}

            <Section style={prepBoxStyle}>
              <Text style={prepTitleStyle}>Gợi ý chuẩn bị trước phiên:</Text>
              <Text style={prepItemStyle}>
                • Chọn một góc yên tĩnh, riêng tư và chuẩn bị tai nghe kết nối ổn định.
              </Text>
              <Text style={prepItemStyle}>
                • Chuẩn bị một cuốn sổ tay nhỏ và một ly nước ấm để đón nhận không gian này trọn vẹn
                nhất.
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

const bookingNoteStyle: React.CSSProperties = {
  color: '#6B7280',
  fontSize: '12px',
  marginTop: '10px',
}

const prepBoxStyle: React.CSSProperties = {
  backgroundColor: '#FAF7F4',
  borderRadius: '10px',
  padding: '14px 18px',
  marginTop: '16px',
}

const prepTitleStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '13px',
  fontWeight: 700,
  margin: '0 0 8px 0',
}

const prepItemStyle: React.CSSProperties = {
  color: '#4B5563',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '2px 0',
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
