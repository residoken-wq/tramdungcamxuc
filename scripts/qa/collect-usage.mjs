// Gom token AI đã dùng cho dự án Trạm Dừng Cảm Xúc trên MÁY NÀY (Claude Code + Codex).
// Chạy: node collect-usage.mjs <tên-máy>      (vd. node collect-usage.mjs local)
// In ra JSON để dán vào dashboard "Chi phí dự án TDCX". Không gửi dữ liệu đi đâu.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { homedir, hostname } from 'node:os'
import { join } from 'node:path'

const PROJECT = /tramdungcamxuc/i
const machine = (process.argv[2] || hostname()).slice(0, 40)
const rows = new Map() // key: tool|date|model
const add = (tool, ts, model, u) => {
  const date = (ts || '').slice(0, 10) || 'unknown'
  const key = `${tool}|${date}|${model || 'unknown'}`
  const r = rows.get(key) || {
    tool,
    date,
    model: model || 'unknown',
    input: 0,
    cacheWrite: 0,
    cacheRead: 0,
    output: 0,
    calls: 0,
  }
  r.input += u.input || 0
  r.cacheWrite += u.cacheWrite || 0
  r.cacheRead += u.cacheRead || 0
  r.output += u.output || 0
  r.calls += 1
  rows.set(key, r)
}
const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    let st
    try {
      st = statSync(p)
    } catch {
      continue
    }
    if (st.isDirectory()) walk(p, out)
    else if (name.endsWith('.jsonl')) out.push(p)
  }
  return out
}
const lines = (file) => {
  try {
    return readFileSync(file, 'utf8').split('\n')
  } catch {
    return []
  }
}

// Claude Code (CLI + extension in Antigravity/VS Code): ~/.claude/projects/<thư mục mã hóa>/**.jsonl
const claudeRoot = join(homedir(), '.claude', 'projects')
let claudeFiles = 0
if (existsSync(claudeRoot)) {
  for (const dir of readdirSync(claudeRoot).filter((d) => PROJECT.test(d))) {
    for (const file of walk(join(claudeRoot, dir))) {
      claudeFiles++
      const seen = new Map() // message id -> last usage (streamed messages repeat)
      for (const line of lines(file)) {
        if (!line.includes('"usage"')) continue
        let j
        try {
          j = JSON.parse(line)
        } catch {
          continue
        }
        const m = j.message
        if (!m || !m.usage || j.type !== 'assistant') continue
        seen.set(m.id || `${j.uuid}`, { ts: j.timestamp, model: m.model, u: m.usage })
      }
      for (const { ts, model, u } of seen.values()) {
        add('claude', ts, model, {
          input: u.input_tokens,
          cacheWrite: u.cache_creation_input_tokens,
          cacheRead: u.cache_read_input_tokens,
          output: u.output_tokens,
        })
      }
    }
  }
}

// Codex (CLI / VS Code): ~/.codex/sessions/**/*.jsonl, lọc theo cwd của dự án.
const codexRoot = join(process.env.CODEX_HOME || join(homedir(), '.codex'), 'sessions')
let codexFiles = 0
for (const file of walk(codexRoot)) {
  const all = lines(file)
  const meta = all.find((l) => l.includes('"session_meta"')) || ''
  if (!PROJECT.test(meta)) continue
  codexFiles++
  let model = 'unknown'
  let prev = { input: 0, cached: 0, output: 0 }
  for (const line of all) {
    if (line.includes('"turn_context"')) {
      const mm = line.match(/"model":"([^"]+)"/)
      if (mm) model = mm[1]
      continue
    }
    if (!line.includes('"total_token_usage"')) continue
    let j
    try {
      j = JSON.parse(line)
    } catch {
      continue
    }
    const t = j.payload?.info?.total_token_usage
    if (!t) continue
    const cur = {
      input: t.input_tokens || 0,
      cached: t.cached_input_tokens || 0,
      output: t.output_tokens || 0,
    }
    const d = {
      input: cur.input - prev.input,
      cached: cur.cached - prev.cached,
      output: cur.output - prev.output,
    }
    if (d.input < 0 || d.output < 0) {
      prev = cur
      continue
    }
    if (d.input || d.output) {
      // Codex counts cached tokens inside input_tokens: split them out.
      add('codex', j.timestamp, model, {
        input: Math.max(0, d.input - d.cached),
        cacheRead: d.cached,
        output: d.output,
      })
    }
    prev = cur
  }
}

console.log(
  JSON.stringify({
    kind: 'tdcx-usage',
    version: 1,
    machine,
    collectedAt: new Date().toISOString(),
    sources: { claudeFiles, codexFiles },
    rows: [...rows.values()].sort((a, b) => (a.date + a.tool).localeCompare(b.date + b.tool)),
  }),
)
