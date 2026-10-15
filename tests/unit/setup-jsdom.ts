import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost',
})

const win = dom.window
;(global as any).window = win
;(global as any).document = win.document
;(global as any).self = win
;(globalThis as any).window = win
;(globalThis as any).document = win.document
;(globalThis as any).self = win

try {
  Object.defineProperty(globalThis, 'navigator', {
    value: win.navigator,
    configurable: true,
    writable: true,
  })
  Object.defineProperty(global, 'navigator', {
    value: win.navigator,
    configurable: true,
    writable: true,
  })
} catch {
  // ignore
}

const windowProps = [
  'HTMLElement',
  'HTMLButtonElement',
  'HTMLAnchorElement',
  'Node',
  'Event',
  'CustomEvent',
  'MouseEvent',
  'KeyboardEvent',
] as const

for (const prop of windowProps) {
  if (win[prop] !== undefined) {
    ;(global as any)[prop] = win[prop]
    ;(globalThis as any)[prop] = win[prop]
  }
}
