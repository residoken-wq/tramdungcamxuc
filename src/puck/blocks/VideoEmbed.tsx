import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { VideoEmbed, type VideoEmbedProps } from '@/components/site/VideoEmbed'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '@/puck/config'

export type { VideoEmbedProps }

export const VideoEmbedBlock: ComponentConfig<VideoEmbedProps> = {
  label: 'Nhúng Video (YouTube / Vimeo)',
  fields: {
    url: {
      type: 'text',
      label: 'Đường dẫn video (YouTube hoặc Vimeo công khai)',
    },
    title: {
      type: 'text',
      label: 'Tiêu đề video (Trợ năng / Thuộc tính title)',
    },
    caption: {
      type: 'textarea',
      label: 'Lời bình / Ghi chú dưới video (Tùy chọn)',
    },
    bgColor: {
      type: 'select',
      label: 'Màu nền',
      options: [...BRAND_COLOR_OPTIONS],
    },
    padding: {
      type: 'select',
      label: 'Khoảng đệm (Padding)',
      options: [...PADDING_OPTIONS],
    },
  },
  defaultProps: {
    version: 1,
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: '[MẪU] Video chia sẻ cảm xúc',
    caption: '[MẪU] Video ngắn đồng hành cùng bạn nhận diện cảm xúc mỗi ngày.',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: (props) => {
    const isEditing = Boolean(props.puck?.isEditing || props.editMode)
    return <VideoEmbed {...props} isEditing={isEditing} />
  },
}
