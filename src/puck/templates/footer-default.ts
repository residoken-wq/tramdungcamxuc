import type { Data } from '@puckeditor/core'

export const footerDefaultTemplate: Data<any, any> = {
  root: {
    props: {
      title: 'Chân trang mặc định',
      footerBg: 'warm-ivory',
    },
  },
  content: [
    {
      type: 'Container',
      props: {
        id: 'footer-container',
        // QA PK-33: top/bottom breathing room (the footer root already pads the sides).
        _style: {
          padding: {
            desktop: { top: 'xl', bottom: 'lg' },
            mobile: { top: 'lg', bottom: 'lg' },
          },
        },
        width: 'boxed',
        contentWidth: 'xl',
        layout: {
          direction: { desktop: 'row', tablet: 'column', mobile: 'column' },
          justify: { desktop: 'between', mobile: 'start' },
          align: { desktop: 'start', mobile: 'stretch' },
          gap: { desktop: 'xl', mobile: 'lg' },
        },
        items: [
          {
            type: 'Container',
            props: {
              id: 'footer-col-brand',
              width: 'full',
              layout: {
                direction: { desktop: 'column' },
                gap: { desktop: 'md' },
                align: { desktop: 'start' },
              },
              items: [
                {
                  type: 'SiteLogo',
                  props: {
                    id: 'footer-logo',
                    size: 'md',
                    align: 'left',
                  },
                },
                {
                  type: 'Tagline',
                  props: {
                    id: 'footer-tagline',
                    align: 'left',
                    showHeartLine: true,
                    tagline: 'Hiểu mình rõ. Hành động bền bỉ. Tỏa sáng bằng thế mạnh riêng.',
                  },
                },
                {
                  type: 'SocialLinks',
                  props: {
                    id: 'footer-social',
                    align: 'left',
                  },
                },
              ],
            },
          },
          {
            type: 'Container',
            props: {
              id: 'footer-col-legal',
              width: 'full',
              layout: {
                direction: { desktop: 'column' },
                gap: { desktop: 'md' },
                align: { desktop: 'stretch' },
              },
              items: [
                {
                  type: 'LegalFooter',
                  props: {
                    id: 'footer-legal',
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
}
