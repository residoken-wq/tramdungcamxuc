#!/usr/bin/env node
// QA PK-28: how much of Hana's exact wording (docs/design/chuyen-minh-noi-dung.md) is in the
// journey template. Usage: node scripts/qa/chuyen-minh-fidelity.mjs [template] [--missing]
// Lines that are notes for the builder (colours, "Bỏ khi lên web"…) never match, so 100% is not
// reachable; compare with the PK-26 baseline (65%) and read the --missing list.
import { readFileSync } from 'node:fs'

const template =
  process.argv[2] && !process.argv[2].startsWith('--')
    ? process.argv[2]
    : 'src/puck/templates/journey.ts'
const showMissing = process.argv.includes('--missing')

let md = readFileSync('docs/design/chuyen-minh-noi-dung.md', 'utf8')
const start = md.indexOf('## 1')
if (start >= 0) md = md.slice(start)
const ts = readFileSync(template, 'utf8').replace(/\\n/g, ' ')

const norm = (s) =>
  s
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/^[ .;:,]+|[ .;:,]+$/g, '')
const tsn = norm(ts)

const phrases = []
for (let line of md.split('\n')) {
  line = line
    .trim()
    .replace(/^[-*>#]+/, '')
    .trim()
  if (!line || line.startsWith('|--')) continue
  line = line.replace(/[*_`]/g, '')
  const cells =
    line.startsWith('|') || line.includes(' | ') ? line.split(/\s*\|\s*/).filter(Boolean) : [line]
  for (let c of cells) {
    if (c.includes(': ')) c = c.split(': ').slice(1).join(': ')
    for (let p of c.split(/\s+\/\s+|;\s*$/)) {
      p = p.replace(/^[ "“”;]+|[ "“”;]+$/g, '')
      if (p.length >= 10) phrases.push(p)
    }
  }
}
const missing = phrases.filter((p) => !tsn.includes(norm(p)))
const found = phrases.length - missing.length
console.log(`${found}/${phrases.length} = ${Math.floor((100 * found) / phrases.length)}%`)
if (showMissing) for (const m of missing) console.log(' -', m.slice(0, 120))
