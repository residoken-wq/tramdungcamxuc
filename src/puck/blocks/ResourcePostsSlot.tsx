import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { ResourcePostsSlot, type ResourcePostsSlotProps } from '@/components/site/ResourcePostsSlot'

export type { ResourcePostsSlotProps }

export const ResourcePostsSlotBlock: ComponentConfig<ResourcePostsSlotProps> = {
  label: 'Vị trí danh sách bài viết (Resource Posts Slot)',
  fields: {},
  defaultProps: {
    version: 1,
  },
  // Isolate puck prop so no functions are passed to client components
  render: ({ puck, ...props }) => (
    <ResourcePostsSlot {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
