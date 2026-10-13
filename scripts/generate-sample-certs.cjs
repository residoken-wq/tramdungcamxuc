const { ImageResponse } = require('next/og')
const React = require('react')
const fs = require('fs')
const path = require('path')

async function main() {
  const fontsDir = path.join(process.cwd(), 'src/fonts/og')
  const anton = fs.readFileSync(path.join(fontsDir, 'anton-400.ttf'))
  const montserrat400 = fs.readFileSync(path.join(fontsDir, 'montserrat-400.ttf'))
  const montserrat700 = fs.readFileSync(path.join(fontsDir, 'montserrat-700.ttf'))
  const playfairItalic = fs.readFileSync(path.join(fontsDir, 'playfair-display-italic.ttf'))

  function createCert(is45) {
    return React.createElement(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAF7F4',
          padding: is45 ? 56 : 72,
        },
      },
      React.createElement(
        'div',
        {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FAF7F4',
            backgroundImage:
              'linear-gradient(150deg, #FFFFFF 0%, #FAF7F4 35%, #FDE6F6 75%, #E9DDF9 100%)',
            border: '4px solid #280A60',
            borderRadius: 28,
            padding: is45 ? '48px 44px' : '80px 48px',
            boxShadow: '0 20px 40px rgba(40, 10, 96, 0.08)',
          },
        },
        [
          // Header
          React.createElement(
            'div',
            {
              key: 'header',
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              },
            },
            [
              React.createElement(
                'div',
                {
                  key: 'badge',
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#FDE6F6',
                    borderRadius: 9999,
                    border: '1.5px solid #BC039E',
                    padding: '6px 24px',
                    marginBottom: is45 ? 14 : 24,
                  },
                },
                React.createElement(
                  'span',
                  {
                    style: {
                      fontFamily: 'Montserrat',
                      fontWeight: 700,
                      fontSize: 16,
                      color: '#BC039E',
                      letterSpacing: 2,
                    },
                  },
                  'TRẠM DỪNG CẢM XÚC',
                ),
              ),
              React.createElement(
                'div',
                {
                  key: 't1',
                  style: {
                    fontFamily: 'Anton',
                    fontSize: is45 ? 68 : 76,
                    color: '#280A60',
                    letterSpacing: 4,
                    lineHeight: 1.1,
                  },
                },
                'CHỨNG NHẬN',
              ),
              React.createElement(
                'div',
                {
                  key: 't2',
                  style: {
                    fontFamily: 'Anton',
                    fontSize: is45 ? 32 : 36,
                    color: '#BC039E',
                    letterSpacing: 1.5,
                    marginTop: 6,
                    textAlign: 'center',
                  },
                },
                'HÀNH TRÌNH 21 NGÀY RÈN LUYỆN THÓI QUEN',
              ),
            ],
          ),

          // Recipient
          React.createElement(
            'div',
            {
              key: 'recipient',
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              },
            },
            [
              React.createElement(
                'div',
                {
                  key: 'r1',
                  style: {
                    fontFamily: 'Montserrat',
                    fontWeight: 400,
                    fontSize: 20,
                    color: '#280A60',
                    opacity: 0.8,
                    marginBottom: 8,
                  },
                },
                'Được trân trọng trao cho',
              ),
              React.createElement(
                'div',
                {
                  key: 'r2',
                  style: {
                    fontFamily: 'Montserrat',
                    fontWeight: 700,
                    fontSize: is45 ? 44 : 50,
                    color: '#280A60',
                    textTransform: 'uppercase',
                    letterSpacing: 1.5,
                    textAlign: 'center',
                    maxWidth: 880,
                  },
                },
                'Nguyễn Thị Ánh Tuyết',
              ),
              React.createElement('div', {
                key: 'r3',
                style: {
                  width: 180,
                  height: 3,
                  backgroundColor: '#EF3B83',
                  borderRadius: 9999,
                  marginTop: 14,
                },
              }),
            ],
          ),

          // Statement
          React.createElement(
            'div',
            {
              key: 'statement',
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #E9DDF9',
                borderRadius: 20,
                padding: is45 ? '22px 36px' : '32px 48px',
                maxWidth: 880,
              },
            },
            React.createElement(
              'div',
              {
                style: {
                  fontFamily: 'Playfair Display',
                  fontStyle: 'italic',
                  fontSize: is45 ? 24 : 28,
                  color: '#280A60',
                  textAlign: 'center',
                  lineHeight: 1.45,
                },
              },
              '“Tôi sẽ dành 5 phút mỗi sáng để thấu hiểu cảm xúc và trở thành một phiên bản vững vàng, an yên.”',
            ),
          ),

          // Stats
          React.createElement(
            'div',
            {
              key: 'stats',
              style: {
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#D9F1EA',
                border: '2px solid #280A60',
                borderRadius: 9999,
                padding: is45 ? '10px 32px' : '14px 40px',
              },
            },
            React.createElement(
              'span',
              {
                style: {
                  fontFamily: 'Montserrat',
                  fontWeight: 700,
                  fontSize: is45 ? 22 : 25,
                  color: '#280A60',
                  letterSpacing: 1,
                },
              },
              'ĐÃ HOÀN THÀNH 21/21 NGÀY',
            ),
          ),

          // Footer
          React.createElement(
            'div',
            {
              key: 'footer',
              style: {
                display: 'flex',
                width: '100%',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1.5px solid rgba(40, 10, 96, 0.2)',
                paddingTop: is45 ? 16 : 24,
                paddingLeft: 8,
                paddingRight: 8,
              },
            },
            [
              React.createElement(
                'span',
                {
                  key: 'f1',
                  style: {
                    fontFamily: 'Montserrat',
                    fontWeight: 700,
                    fontSize: 16,
                    color: '#280A60',
                  },
                },
                'NGÀY CẤP: 13/10/2026',
              ),
              React.createElement(
                'span',
                {
                  key: 'f2',
                  style: {
                    fontFamily: 'Montserrat',
                    fontWeight: 700,
                    fontSize: 16,
                    color: '#280A60',
                    letterSpacing: 1,
                  },
                },
                'MÃ XÁC MINH: DEMO-21D',
              ),
              React.createElement(
                'span',
                {
                  key: 'f3',
                  style: {
                    fontFamily: 'Montserrat',
                    fontWeight: 700,
                    fontSize: 16,
                    color: '#BC039E',
                  },
                },
                'tramdungcamxuc.com',
              ),
            ],
          ),
        ],
      ),
    )
  }

  const fonts = [
    { name: 'Anton', data: anton, weight: 400, style: 'normal' },
    { name: 'Montserrat', data: montserrat400, weight: 400, style: 'normal' },
    { name: 'Montserrat', data: montserrat700, weight: 700, style: 'normal' },
    {
      name: 'Playfair Display',
      data: playfairItalic,
      weight: 400,
      style: 'italic',
    },
  ]

  fs.mkdirSync('public/samples', { recursive: true })

  const res45 = new ImageResponse(createCert(true), { width: 1080, height: 1350, fonts })
  fs.writeFileSync('public/samples/sample-cert-4x5.png', Buffer.from(await res45.arrayBuffer()))
  console.log('Saved public/samples/sample-cert-4x5.png')

  const res916 = new ImageResponse(createCert(false), { width: 1080, height: 1920, fonts })
  fs.writeFileSync('public/samples/sample-cert-9x16.png', Buffer.from(await res916.arrayBuffer()))
  console.log('Saved public/samples/sample-cert-9x16.png')
}

main().catch(console.error)
