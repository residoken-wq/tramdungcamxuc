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

export interface HabitPlanEmailTechniqueItem {
  name: string
  stage: string
  action: string
}

export interface HabitPlanEmailProps {
  name?: string
  identityStatement: string
  techniques: HabitPlanEmailTechniqueItem[]
  zaloGroupUrl?: string
  revisitUrl?: string
}

export const HabitPlanEmail: React.FC<HabitPlanEmailProps> = ({
  name,
  identityStatement,
  techniques = [],
  zaloGroupUrl,
  revisitUrl = 'https://tramdungcamxuc.com/habit/5-phut',
}) => {
  return (
    <Html lang="vi">
      <Head />
      <Preview>Trạm Dừng Cảm Xúc – Kế hoạch Habit Loop 5 phút của bạn</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={brandLabelStyle}>TRẠM DỪNG CẢM XÚC · HABIT LOOP</Text>
            <Heading style={headingStyle}>Chào {name || 'bạn'},</Heading>
            <Text style={subheadingStyle}>
              Dưới đây là kế hoạch rèn luyện thói quen và câu định danh bản thân bạn vừa thiết kế.
            </Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* Identity Statement */}
          <Section style={contentSectionStyle}>
            <Text style={sectionTitleStyle}>Câu định danh bản thân:</Text>
            <Section style={quoteBoxStyle}>
              <Text style={quoteTextStyle}>&ldquo;{identityStatement}&rdquo;</Text>
            </Section>

            {/* Techniques */}
            {techniques.length > 0 && (
              <>
                <Text style={sectionTitleStyle}>Kỹ thuật &amp; hành động thực chiến đã chọn:</Text>
                <div style={{ margin: '12px 0 20px 0' }}>
                  {techniques.map((item, idx) => (
                    <div key={idx} style={techniqueCardStyle}>
                      <Text style={techniqueHeaderStyle}>
                        <strong>{item.name}</strong> · <span style={{ color: '#BC039E' }}>{item.stage}</span>
                      </Text>
                      <Text style={techniqueActionStyle}>
                        👉 <em>Hành động cụ thể:</em> {item.action}
                      </Text>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Zalo CTA button if present */}
            {zaloGroupUrl && (
              <Section style={{ textAlign: 'center', margin: '24px 0 16px 0' }}>
                <Button href={zaloGroupUrl} style={primaryButtonStyle}>
                  Tham gia nhóm Zalo đồng hành
                </Button>
                <Text style={{ fontSize: '13px', color: '#554271', marginTop: '8px' }}>
                  Cùng chia sẻ tiến trình 21 ngày với cộng đồng thực hành thói quen.
                </Text>
              </Section>
            )}

            {/* Revisit link */}
            <Section style={{ textAlign: 'center', margin: '16px 0' }}>
              <Text style={{ fontSize: '14px', color: '#554271' }}>
                Bạn có thể xem lại hoặc tạo kế hoạch mới bất cứ lúc nào tại:{' '}
                <a href={revisitUrl} style={{ color: '#BC039E', fontWeight: 600 }}>
                  tramdungcamxuc.com/habit/5-phut
                </a>
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
              Email này được gửi tự động từ tramdungcamxuc.com theo đăng ký của bạn.
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
  textAlign: 'center',
  marginBottom: '20px',
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
  fontSize: '22px',
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
  padding: '0 4px',
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#280A60',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  margin: '16px 0 8px 0',
}

const quoteBoxStyle: React.CSSProperties = {
  backgroundColor: '#FDE6F6',
  borderLeft: '4px solid #EF3B83',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '12px 0 20px 0',
}

const quoteTextStyle: React.CSSProperties = {
  fontSize: '16px',
  fontStyle: 'italic',
  fontWeight: 600,
  color: '#280A60',
  margin: 0,
  lineHeight: '1.5',
}

const techniqueCardStyle: React.CSSProperties = {
  backgroundColor: '#FAF7F4',
  border: '1px solid #E9DDF9',
  borderRadius: '8px',
  padding: '12px 16px',
  marginBottom: '8px',
}

const techniqueHeaderStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#280A60',
  margin: '0 0 4px 0',
}

const techniqueActionStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#554271',
  margin: 0,
  lineHeight: '1.4',
}

const primaryButtonStyle: React.CSSProperties = {
  backgroundColor: '#EF3B83',
  borderRadius: '9999px',
  color: '#FFFFFF',
  fontSize: '15px',
  fontWeight: 700,
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '12px 28px',
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
