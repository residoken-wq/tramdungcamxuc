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

interface AdminNotificationEmailProps {
  formType: 'lead' | 'coaching' | 'b2b'
  name: string
  email: string
  phone?: string
  need?: string
  message?: string
  serviceName?: string
  company?: string
  teamSize?: string
  targetBehaviors?: string
  timeline?: string
  interestTags?: string[]
  page?: string
  utm?: string
  currentStatus?: string
  contactRole?: string
  interestedProgram?: string
}

const formTypeLabels: Record<string, string> = {
  lead: 'Đăng ký tài nguyên (Lead)',
  coaching: 'Tư vấn Coaching 1:1',
  b2b: 'Yêu cầu Doanh nghiệp (B2B)',
}

export const AdminNotificationEmail: React.FC<AdminNotificationEmailProps> = ({
  formType,
  name,
  email,
  phone,
  need,
  message,
  serviceName,
  company,
  teamSize,
  targetBehaviors,
  timeline,
  interestTags,
  page,
  utm,
  currentStatus,
  contactRole,
  interestedProgram,
}) => {
  const formLabel = formTypeLabels[formType] || formType

  return (
    <Html lang="vi">
      <Head />
      <Preview>[TDCX] Khách tiềm năng mới: {formLabel} – {name || email}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={brandLabelStyle}>HỆ THỐNG TRẠM DỪNG CẢM XÚC</Text>
            <Heading style={headingStyle}>Khách tiềm năng mới</Heading>
            <Text style={subheadingStyle}>
              Hình thức: <strong>{formLabel}</strong>
            </Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* Details Table */}
          <Section style={contentSectionStyle}>
            <Section style={infoCardStyle}>
              <Text style={infoRowStyle}>
                <strong>Họ và tên:</strong> {name || '(Chưa cung cấp)'}
              </Text>
              <Text style={infoRowStyle}>
                <strong>Email:</strong> {email}
              </Text>
              {phone && (
                <Text style={infoRowStyle}>
                  <strong>Số điện thoại:</strong> {phone}
                </Text>
              )}
              {need && (
                <Text style={infoRowStyle}>
                  <strong>Nhu cầu:</strong> {need}
                </Text>
              )}
              {currentStatus && (
                <Text style={infoRowStyle}>
                  <strong>Tình trạng hiện tại:</strong> {currentStatus}
                </Text>
              )}
              {serviceName && (
                <Text style={infoRowStyle}>
                  <strong>Dịch vụ quan tâm:</strong> {serviceName}
                </Text>
              )}
              {company && (
                <Text style={infoRowStyle}>
                  <strong>Doanh nghiệp:</strong> {company}
                </Text>
              )}
              {contactRole && (
                <Text style={infoRowStyle}>
                  <strong>Vai trò người liên hệ:</strong> {contactRole}
                </Text>
              )}
              {interestedProgram && (
                <Text style={infoRowStyle}>
                  <strong>Chương trình quan tâm:</strong> {interestedProgram}
                </Text>
              )}
              {teamSize && (
                <Text style={infoRowStyle}>
                  <strong>Quy mô đội ngũ:</strong> {teamSize}
                </Text>
              )}
              {targetBehaviors && (
                <Text style={infoRowStyle}>
                  <strong>Hành vi mục tiêu:</strong> {targetBehaviors}
                </Text>
              )}
              {timeline && (
                <Text style={infoRowStyle}>
                  <strong>Thời gian dự kiến:</strong> {timeline}
                </Text>
              )}
              {interestTags && interestTags.length > 0 && (
                <Text style={infoRowStyle}>
                  <strong>Thẻ quan tâm:</strong> {interestTags.join(', ')}
                </Text>
              )}
              {message && (
                <Text style={infoRowStyle}>
                  <strong>Lời nhắn:</strong> {message}
                </Text>
              )}
              {page && (
                <Text style={infoRowStyle}>
                  <strong>Trang gửi form:</strong> {page}
                </Text>
              )}
              {utm && (
                <Text style={infoRowStyle}>
                  <strong>Chiến dịch UTM:</strong> {utm}
                </Text>
              )}
            </Section>
          </Section>

          <Hr style={dividerStyle} />

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerSubtextStyle}>
              Vui lòng truy cập trang Quản trị (CMS) tại <strong>/admin/collections/leads</strong> để xem và xử lý.
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
  maxWidth: '580px',
  margin: '0 auto',
}

const headerStyle: React.CSSProperties = {
  textAlign: 'left',
  marginBottom: '20px',
}

const brandLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '1.5px',
  color: '#BC039E',
  textTransform: 'uppercase',
  margin: '0 0 8px 0',
}

const headingStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: '#280A60',
  margin: '0 0 6px 0',
  lineHeight: '1.3',
}

const subheadingStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#554271',
  margin: 0,
}

const dividerStyle: React.CSSProperties = {
  borderColor: '#E9DDF9',
  margin: '20px 0',
}

const contentSectionStyle: React.CSSProperties = {
  padding: '0',
}

const infoCardStyle: React.CSSProperties = {
  backgroundColor: '#FDE6F6',
  borderRadius: '8px',
  padding: '16px 20px',
}

const infoRowStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#280A60',
  margin: '6px 0',
  lineHeight: '1.5',
}

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
}

const footerSubtextStyle: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '1.4',
  color: '#84759B',
  margin: 0,
}

export default AdminNotificationEmail
