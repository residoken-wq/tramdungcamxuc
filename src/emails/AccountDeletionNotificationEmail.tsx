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

interface AccountDeletionNotificationEmailProps {
  customerId: number
  requestedAt: string
}

export const AccountDeletionNotificationEmail: React.FC<AccountDeletionNotificationEmailProps> = ({
  customerId,
  requestedAt,
}) => {
  return (
    <Html lang="vi">
      <Head />
      <Preview>{`[TDCX] Yêu cầu xóa tài khoản: Khách hàng #${customerId}`}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={brandLabelStyle}>HỆ THỐNG TRẠM DỪNG CẢM XÚC</Text>
            <Heading style={headingStyle}>Yêu cầu xóa tài khoản</Heading>
            <Text style={subheadingStyle}>
              Thông báo yêu cầu xóa tài khoản và dữ liệu cá nhân từ khách hàng
            </Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* Details */}
          <Section style={contentSectionStyle}>
            <Section style={infoCardStyle}>
              <Text style={infoRowStyle}>
                <strong>Mã khách hàng:</strong> #{customerId}
              </Text>
              <Text style={infoRowStyle}>
                <strong>Thời điểm gửi yêu cầu:</strong> {requestedAt}
              </Text>
            </Section>

            <Section style={messageBoxStyle}>
              <Text style={messageLabelStyle}>Nội dung hướng dẫn:</Text>
              <Text style={messageTextStyle}>
                Khách hàng #{customerId} đã gửi yêu cầu xóa tài khoản và toàn bộ dữ liệu cá nhân
                trên website. Hana vui lòng kiểm tra và xử lý trong vòng 72 giờ tại trang Quản trị
                Khách hàng.
              </Text>
              <Text style={noteTextStyle}>
                Lưu ý: Khi thực hiện xóa qua nút &ldquo;Xóa dữ liệu khách&rdquo;, toàn bộ dữ liệu cá
                nhân, quyền sử dụng, kế hoạch và lịch sử học tập sẽ bị xóa vĩnh viễn; các đơn hàng
                của khách hàng sẽ được giữ lại nhưng ẩn danh để phục vụ đối soát.
              </Text>
            </Section>
          </Section>

          <Hr style={dividerStyle} />

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Email tự động từ hệ thống Trạm Dừng Cảm Xúc. Vui lòng không trả lời trực tiếp email
              này.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const mainStyle = {
  backgroundColor: '#FAF7F4',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: '0',
  padding: '40px 0',
}

const containerStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px',
  border: '1px solid #E9DDF9',
}

const headerStyle = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const brandLabelStyle = {
  color: '#BC039E',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '1.5px',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
}

const headingStyle = {
  color: '#280A60',
  fontSize: '22px',
  fontWeight: '700',
  margin: '0 0 8px 0',
  lineHeight: '1.3',
}

const subheadingStyle = {
  color: '#280A60',
  fontSize: '13px',
  margin: '0',
  opacity: 0.8,
}

const dividerStyle = {
  borderColor: '#E9DDF9',
  borderStyle: 'solid',
  borderWidth: '1px 0 0 0',
  margin: '20px 0',
}

const contentSectionStyle = {
  marginBottom: '24px',
}

const infoCardStyle = {
  backgroundColor: '#FAF7F4',
  borderRadius: '12px',
  padding: '16px 20px',
  marginBottom: '16px',
  border: '1px solid #E9DDF9',
}

const infoRowStyle = {
  color: '#280A60',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '4px 0',
}

const messageBoxStyle = {
  backgroundColor: '#FDE6F6',
  borderRadius: '12px',
  padding: '16px 20px',
  border: '1px solid #EF3B83',
}

const messageLabelStyle = {
  color: '#BC039E',
  fontSize: '13px',
  fontWeight: '700',
  margin: '0 0 8px 0',
}

const messageTextStyle = {
  color: '#280A60',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
}

const noteTextStyle = {
  color: '#280A60',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0',
  opacity: 0.85,
}

const footerStyle = {
  textAlign: 'center' as const,
}

const footerTextStyle = {
  color: '#280A60',
  fontSize: '11px',
  lineHeight: '1.5',
  margin: '0',
  opacity: 0.6,
}

export default AccountDeletionNotificationEmail
