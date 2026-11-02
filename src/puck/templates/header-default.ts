import type { Data } from '@puckeditor/core'

export const headerDefaultTemplate: Data = {
  root: {
    props: {
      title: 'Đầu trang mặc định',
      sticky: 'sticky',
    } as { title: string; sticky: string },
  },
  content: [
    {
      type: 'Container',
      props: {
        id: 'header-container',
        width: 'boxed',
        contentWidth: 'xl',
        padding: 'sm',
        layout: {
          direction: 'row',
          justify: 'between',
          align: 'center',
          wrap: 'nowrap',
          gap: 'md',
        },
        items: [
          {
            type: 'SiteLogo',
            props: {
              id: 'header-logo',
              size: 'md',
            },
          },
          {
            type: 'NavMenu',
            props: {
              id: 'header-nav',
              align: 'center',
              breakpoint: 'lg',
            },
          },
          {
            type: 'AccountLink',
            props: {
              id: 'header-account',
              showIcon: true,
            },
          },
          {
            type: 'HeaderCTA',
            props: {
              id: 'header-cta',
              variant: 'primary',
            },
          },
        ],
      },
    },
  ],
}
