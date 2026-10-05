import React from 'react'
import type { Config } from '@puckeditor/core'

export type SpikeComponentProps = {
  SpikeBlock: {
    text: string
  }
}

export const puckConfig: Config<SpikeComponentProps> = {
  components: {
    SpikeBlock: {
      label: 'Khối thử nghiệm Spike',
      fields: {
        text: {
          type: 'text',
          label: 'Văn bản',
        },
      },
      render: ({ text }) => (
        <div className="rounded-lg bg-soft-pink p-4 text-deep-navy">
          <p>{text || '[MẪU] Nội dung thử nghiệm'}</p>
        </div>
      ),
    },
  },
}

export default puckConfig
