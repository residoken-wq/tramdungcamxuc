#!/usr/bin/env node
// Measures an agent's real working time on one task (docs/tasks/WORKFLOW.md, mục "Đo thời gian").
//
//   node scripts/task-time.mjs start <MÃ>    # once, before the first command of the task
//   <command> ; node scripts/task-time.mjs lap   # appended to every command the agent runs
//   node scripts/task-time.mjs report        # at the end: prints the summary for the report/PR
//
// Rule: time spent inside commands counts fully; a gap between two commands counts fully when it
// is ≤ IDLE_LIMIT_S (agent thinking/editing), otherwise it is treated as waiting for an approval
// or a stuck session and counts APPROVAL_CREDIT_S only.
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const IDLE_LIMIT_S = 60
const APPROVAL_CREDIT_S = 5
const DIR = '.task-time'
const CURRENT = join(DIR, 'current')

const [, , cmd, arg] = process.argv
const now = () => Date.now()

function currentTask() {
  if (!existsSync(CURRENT)) {
    console.error('task-time: chưa chạy "node scripts/task-time.mjs start <MÃ>"')
    process.exit(0) // never break the agent's command chain
  }
  return readFileSync(CURRENT, 'utf8').trim()
}

function log(task) {
  return join(DIR, `${task}.jsonl`)
}

export function summarize(events, idleLimitS = IDLE_LIMIT_S, creditS = APPROVAL_CREDIT_S) {
  const times = events.map((e) => e.t).sort((a, b) => a - b)
  let activeMs = 0
  let stalls = 0
  for (let i = 1; i < times.length; i++) {
    const gap = times[i] - times[i - 1]
    if (gap <= idleLimitS * 1000) activeMs += gap
    else {
      activeMs += creditS * 1000
      stalls++
    }
  }
  const wallMs = times.length > 1 ? times[times.length - 1] - times[0] : 0
  return { activeMs, wallMs, stalls, laps: Math.max(0, times.length - 1) }
}

const fmt = (ms) => {
  const m = Math.round(ms / 60000)
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} phút`
}

const isCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (!isCli) {
  // Imported (tests): expose summarize() only.
} else if (cmd === 'start') {
  if (!arg) {
    console.error('Dùng: node scripts/task-time.mjs start <MÃ>')
    process.exit(1)
  }
  mkdirSync(DIR, { recursive: true })
  writeFileSync(CURRENT, arg)
  appendFileSync(log(arg), JSON.stringify({ t: now(), e: 'start' }) + '\n')
  console.log(`task-time: bắt đầu đo ${arg}`)
} else if (cmd === 'lap') {
  if (existsSync(CURRENT)) {
    appendFileSync(log(currentTask()), JSON.stringify({ t: now(), e: 'lap' }) + '\n')
  }
} else if (cmd === 'report') {
  const task = arg || currentTask()
  if (!existsSync(log(task))) {
    console.log(`task-time: không có dữ liệu cho ${task}`)
    process.exit(0)
  }
  const events = readFileSync(log(task), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l))
  const s = summarize(events)
  const started = new Date(Math.min(...events.map((e) => e.t))).toISOString()
  console.log(
    `THỜI GIAN THỰC ${task}: ${fmt(s.activeMs)} (${(s.activeMs / 3600000).toFixed(2)} h) · ` +
      `tổng thời gian trôi ${fmt(s.wallMs)} · ${s.stalls} lần chờ approve/kẹt (> ${IDLE_LIMIT_S}s, tính ${APPROVAL_CREDIT_S}s/lần) · ` +
      `${s.laps} lệnh · bắt đầu ${started}`,
  )
} else if (cmd === 'list') {
  if (existsSync(DIR))
    for (const f of readdirSync(DIR)) if (f.endsWith('.jsonl')) console.log(f.slice(0, -6))
} else {
  console.error('Dùng: start <MÃ> | lap | report [MÃ] | list')
  process.exit(1)
}
