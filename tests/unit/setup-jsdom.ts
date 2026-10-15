// @ts-expect-error No type declarations for jsdom in this project
import { JSDOM } from 'jsdom'


const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost',
})

const win = dom.window
const globalAny = globalThis as Record<string, unknown>
const nodeGlobal = global as unknown as Record<string, unknown>

globalAny.window = win
globalAny.document = win.document
globalAny.self = win
nodeGlobal.window = win
nodeGlobal.document = win.document
nodeGlobal.self = win

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
    nodeGlobal[prop] = win[prop]
    globalAny[prop] = win[prop]
  }
}
