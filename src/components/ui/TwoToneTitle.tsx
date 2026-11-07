import React from 'react'
import { textTarget } from '@/puck/style/text-target'

export interface TwoToneTitleProps {
  id?: string
  line1?: string
  line2?: string
  line1ClassName?: string
  line2ClassName?: string
}

export function TwoToneTitle({
  id,
  line1,
  line2,
  line1ClassName = '',
  line2ClassName = '',
}: TwoToneTitleProps) {
  const l1Class = line1ClassName ? `block ${line1ClassName}` : 'block'
  const l2Class = line2ClassName ? `block ${line2ClassName}` : 'block'

  return (
    <>
      <span {...textTarget(id, 'titleLine1')} className={l1Class}>
        {line1}
      </span>
      {line2 ? (
        <>
          {' '}
          <span {...textTarget(id, 'titleLine2')} className={l2Class}>
            {line2}
          </span>
        </>
      ) : null}
    </>
  )
}
