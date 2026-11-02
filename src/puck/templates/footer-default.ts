import type { Data } from '@puckeditor/core'

export const footerDefaultTemplate: Data = {
  root: {
    props: {
      title: 'Chân trang mặc định',
    },
  },
  content: [
    {
      type: 'Container',
      props: {
        id: 'footer-container',
        width: 'boxed',
        contentWidth: 'xl',
        padding: 'md',
        layout: {
          direction: 'column',
          justify: 'start',
          align: 'stretch',
          gap: 'md',
        },
        items: [
          {
            type: 'SiteLogo',
            props: {
              id: 'footer-logo',
              size: 'md',
            },
          },
          {
            type: 'Tagline',
            props: {
              id: 'footer-tagline',
              align: 'left',
              showHeartLine: true,
            },
          },
          {
            type: 'SocialLinks',
            props: {
              id: 'footer-social',
              align: 'left',
            },
          },
          {
            type: 'LegalFooter',
            props: {
              id: 'footer-legal',
              showLegalLinks: true,
              showSellerInfo: true,
            },
          },
        ],
      },
    },
  ],
}
