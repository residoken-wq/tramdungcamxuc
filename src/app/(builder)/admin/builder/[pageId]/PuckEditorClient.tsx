'use client'

import React from 'react'
import { Puck, type Data } from '@puckeditor/core'
import { puckConfig } from '@/puck/config'

type PuckEditorClientProps = {
  initialData: Data
  pageTitle: string
}

export function PuckEditorClient({ initialData, pageTitle }: PuckEditorClientProps) {
  const [data, setData] = React.useState<Data>(initialData)

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="bg-deep-navy text-white px-4 py-2 flex items-center justify-between text-sm">
        <span>Trạm Dừng Cảm Xúc - Visual Builder [SPIKE]: {pageTitle}</span>
      </div>
      <div className="flex-1 min-h-0">
        <Puck
          config={puckConfig}
          data={data}
          onPublish={async (savedData) => {
            setData(savedData)
          }}
        />
      </div>
    </div>
  )
}
