import React from 'react'

type SlotComponent = React.ComponentType<{ className?: string }>

/**
 * EB-06b: Tabs / Accordion are client components (they keep the open tab / item in state). A
 * client component cannot receive functions from the server render, and a Puck slot prop is a
 * component (function). So the block's render turns each slot into an element first; the client
 * widget only gets serialisable React nodes and plain values (no `puck` object).
 */
export function renderItemSlots<T extends { content?: unknown }>(
  items: T[] | undefined,
  className: string,
): (Omit<T, 'content'> & { content: React.ReactNode })[] {
  return (items ?? []).map((item) => {
    const Slot = typeof item?.content === 'function' ? (item.content as SlotComponent) : null
    return { ...item, content: Slot ? <Slot className={className} /> : null }
  })
}

export const SLOT_CLASS = 'flex min-h-[48px] w-full flex-col gap-3'
