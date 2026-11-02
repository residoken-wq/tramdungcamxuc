import type { Data } from '@puckeditor/core'

export const footerDefaultTemplate: Data = {
  root: {
    props: {
      title: 'Chân trang mặc định',
    },
  },
  zones: {
    'footer-container:items': [
      {
        type: 'SiteLogo',
        props: {
          id: 'footer-logo',
          width: 140,
        },
      },
      {
        type: 'Tagline',
        props: {
          id: 'footer-tagline',
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
      },
    },
  ],
}
