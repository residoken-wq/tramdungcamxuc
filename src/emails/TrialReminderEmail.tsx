import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export interface TrialReminderEmailProps {
  name: string
  toolName: string
  milestone: 'day_18' | 'day_21'
  daysLeft: number
  formattedPrice: string
  originalPriceFormatted?: string | null
  checkoutUrl: string
  toolUrl: string
}

export const TrialReminderEmail: React.FC<TrialReminderEmailProps> = ({
  name,
  toolName,
  milestone,
  daysLeft,
  formattedPrice,
  originalPriceFormatted,
  checkoutUrl,
  toolUrl,
}) => {
  const isDay21 = milestone === 'day_21'

  const previewText = isDay21
    ? `Trạm Dừng Cảm Xúc – Ngày dùng thử cuối cùng: ${toolName}`
    : `Trạm Dừng Cảm Xúc – Chỉ còn 3 ngày dùng thử ${toolName}`

  const headingText = isDay21
    ? 'Hôm nay là ngày dùng thử cuối cùng!'
    : 'Chỉ còn 3 ngày dùng thử miễn phí!'

  const statusLabel = isDay21 ? 'Ngày cuối cùng' : `Còn ${daysLeft} ngày`

  return (
    <Html lang="vi">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={brandLabelStyle}>TRẠM DỪNG CẢM XÚC · NHẮC HẠN DÙNG THỬ</Text>
            <Heading style={headingStyle}>{headingText}</Heading>
            <Text style={subheadingStyle}>
              Chào {name || 'bạn'}, {toolName} đồng hành cùng bạn trên hành trình thấu hiểu cảm xúc.
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
                <strong>Thời hạn dùng thử:</strong> {statusLabel}
              </Text>
              <Text style={highlightItemStyle}>
                <strong>Giá sở hữu trọn đời:</strong> {formattedPrice}
                {originalPriceFormatted && (
                  <span style={strikethroughStyle}> ({originalPriceFormatted})</span>
                )}
              </Text>
              <Text style={highlightItemStyle}>
                <strong>Dữ liệu của bạn:</strong> Được bảo lưu nguyên vẹn và an toàn
              </Text>
            </Section>

            {isDay21 ? (
              <Text style={paragraphStyle}>
                Hôm nay là ngày cuối cùng trong hành trình 21 ngày trải nghiệm. Hành trình này đã
                giúp bạn đặt những bước chân đầu tiên cho sự vững vàng nội tâm. Hãy đăng ký sở hữu
                trọn đời để giữ mạch thực hành và mở khóa đầy đủ tiện ích mà không bị gián đoạn.
              </Text>
            ) : (
              <Text style={paragraphStyle}>
                Chỉ còn 3 ngày nữa là phiên dùng thử miễn phí của bạn sẽ khép lại. 21 ngày là khoảng
                thời gian quý giá để hình thành một thói quen mới. Để không gián đoạn nhịp thực hành
                mỗi ngày, bạn có thể nâng cấp ngay với mức giá ưu đãi đặc biệt bên dưới.
              </Text>
            )}

            {/* CTA Button */}
            <Section style={buttonContainerStyle}>
              <Button style={buttonStyle} href={checkoutUrl}>
                Mua để dùng tiếp ({formattedPrice})
              </Button>
              <Section style={{ marginTop: '16px', textAlign: 'center' }}>
                <Link href={toolUrl} style={secondaryLinkStyle}>
                  Vào thực hành hôm nay &rarr;
                </Link>
              </Section>
            </Section>
          </Section>

          <Hr style={dividerStyle} />

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerSignOffStyle}>Thương mến,</Text>
            <Text style={footerAuthorStyle}>Hana Lương &amp; Đội ngũ Trạm Dừng Cảm Xúc</Text>
            <Text style={footerNoticeStyle}>
              Email thông báo tự động từ tramdungcamxuc.com dành cho tài khoản đang dùng thử công cụ
              số.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default TrialReminderEmail

const mainStyle: React.CSSProperties = {
  backgroundColor: '#FAF7F4', // warm-ivory
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  padding: '40px 0',
}

const containerStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '24px',
  border: '1px solid rgba(40, 10, 96, 0.08)',
  margin: '0 auto',
  maxWidth: '600px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(40, 10, 96, 0.04)',
}

const headerStyle: React.CSSProperties = {
  backgroundColor: '#E9DDF9', // lavender-mist
  padding: '36px 32px 28px',
  textAlign: 'center',
}

const brandLabelStyle: React.CSSProperties = {
  color: '#BC039E', // bright-magenta
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '1.5px',
  margin: '0 0 10px',
  textTransform: 'uppercase',
}

const headingStyle: React.CSSProperties = {
  color: '#280A60', // deep-navy
  fontSize: '24px',
  fontWeight: 700,
  lineHeight: '1.3',
  margin: '0 0 10px',
}

const subheadingStyle: React.CSSProperties = {
  color: 'rgba(40, 10, 96, 0.8)',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: 0,
}

const dividerStyle: React.CSSProperties = {
  borderColor: 'rgba(40, 10, 96, 0.08)',
  borderWidth: '1px',
  margin: 0,
}

const contentSectionStyle: React.CSSProperties = {
  padding: '32px',
}

const highlightBoxStyle: React.CSSProperties = {
  backgroundColor: '#FDE6F6', // soft-pink
  borderRadius: '16px',
  padding: '20px 24px',
  marginBottom: '24px',
}

const highlightItemStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '6px 0',
}

const strikethroughStyle: React.CSSProperties = {
  textDecoration: 'line-through',
  color: 'rgba(40, 10, 96, 0.5)',
}

const paragraphStyle: React.CSSProperties = {
  color: 'rgba(40, 10, 96, 0.85)',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 24px',
}

const buttonContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '28px',
  marginBottom: '12px',
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#BC039E', // bright-magenta
  borderRadius: '9999px',
  color: '#FFFFFF',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: 600,
  padding: '14px 32px',
  textDecoration: 'none',
  boxShadow: '0 4px 12px rgba(188, 3, 158, 0.25)',
}

const secondaryLinkStyle: React.CSSProperties = {
  color: '#EF3B83', // accent-pink
  fontSize: '13px',
  fontWeight: 600,
  textDecoration: 'none',
}

const footerStyle: React.CSSProperties = {
  backgroundColor: '#FAF7F4', // warm-ivory
  padding: '28px 32px',
  textAlign: 'center',
}

const footerSignOffStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '14px',
  fontStyle: 'italic',
  margin: '0 0 4px',
}

const footerAuthorStyle: React.CSSProperties = {
  color: '#280A60',
  fontSize: '14px',
  fontWeight: 600,
  margin: '0 0 16px',
}

const footerNoticeStyle: React.CSSProperties = {
  color: 'rgba(40, 10, 96, 0.5)',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: 0,
}
