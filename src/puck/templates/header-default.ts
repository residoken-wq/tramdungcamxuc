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
        // QA PK-33: Container has no padding prop; spacing goes through _style (16px / 24px sides).
        _style: {
          padding: { desktop: { top: 'sm', bottom: 'sm', left: 'md', right: 'md' } },
        },
        width: 'boxed',
        contentWidth: 'xl',
        layout: {
          direction: { desktop: 'row', mobile: 'row' },
          justify: { desktop: 'between', mobile: 'between' },
          align: { desktop: 'center', mobile: 'center' },
          wrap: { desktop: 'nowrap', mobile: 'nowrap' },
          gap: { desktop: 'md', mobile: 'sm' },
        },
        items: [
          {
            type: 'SiteLogo',
            props: {
              id: 'header-logo',
              size: 'md',
              align: 'left',
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
              _style: {
                hideOn: ['tablet', 'mobile'],
              },
            },
          },
          {
            type: 'HeaderCTA',
            props: {
              id: 'header-cta',
              variant: 'primary',
              size: 'md',
              _style: {
                hideOn: ['tablet', 'mobile'],
              },
            },
          },
        ],
      },
    },
  ],
}
