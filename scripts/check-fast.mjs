#!/usr/bin/env node
/**
 * Fast pre-push check for a task branch, with short output so an agent spends few tokens on it.
 *
 *   pnpm check:fast              # typecheck + ESLint (changed files, errors only)
 *                                # + unit tests the branch added/changed (+ source-scanning tests)
 *   pnpm check:fast --affected   # unit tests: same selection CI makes for a PR (slower)
 *   pnpm check:fast --no-types   # skip typecheck
 *   pnpm check:fast tests/unit/x.test.ts   # also run these test files
 *
 * It does NOT build and does NOT run e2e: CI does that on the PR.
 * Base: merge-base of HEAD and origin/main (run `git fetch origin main` first).
 * Output: only a summary per step; on failure the failing part (max ~150 lines).
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const isWin = process.platform === 'win32'
const argv = process.argv.slice(2)
const flags = new Set(argv.filter((a) => a.startsWith('--')))
const extraTests = argv.filter((a) => !a.startsWith('--'))
const MAX_LINES = 150
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*m/g

function run(label, cmd, cmdArgs, opts = {}) {
  const t0 = Date.now()
  const safeArgs = isWin
    ? cmdArgs.map((a) => (typeof a === 'string' && /[\s()^&|<>]/.test(a) ? `"${a}"` : a))
    : cmdArgs
  const res = spawnSync(cmd, safeArgs, {
    encoding: 'utf8',
    shell: isWin,
    maxBuffer: 256 * 1024 * 1024,
    env: { ...process.env, TZ: 'UTC', PGTZ: 'UTC', NO_COLOR: '1', FORCE_COLOR: '0', ...opts.env },
  })
  const s = ((Date.now() - t0) / 1000).toFixed(0)
  const ok = res.status === 0
  const lines = `${res.stdout ?? ''}\n${res.stderr ?? ''}`.replace(ANSI, '').split('\n')
  const keep = opts.summary ? lines.filter((l) => opts.summary.test(l)) : []
  console.log(
    `${ok ? '✔' : '✘'} ${label} (${s}s)${keep.length ? ' – ' + keep.map((l) => l.trim()).join(' · ') : ''}`,
  )
  if (!ok) {
    const start = opts.failStart ? lines.findIndex((l) => opts.failStart.test(l)) : -1
    const body = (start >= 0 ? lines.slice(start) : lines).filter((l) => l.trim())
    console.log(body.slice(0, MAX_LINES).join('\n'))
    if (body.length > MAX_LINES) console.log(`… (${body.length - MAX_LINES} dòng nữa)`)
  }
  return ok
}

function git(...a) {
  const res = spawnSync('git', a, { encoding: 'utf8', shell: isWin })
  return res.status === 0 ? res.stdout.trim() : ''
}

const base = git('merge-base', 'HEAD', 'origin/main')
if (!base) {
  console.error('Không tìm thấy origin/main. Chạy `git fetch origin main` rồi thử lại.')
  process.exit(2)
}

// Committed + uncommitted + untracked changes against the base.
const changed = [
  ...new Set(
    [
      git('diff', '--name-only', `${base}...HEAD`),
      git('diff', '--name-only', 'HEAD'),
      git('ls-files', '--others', '--exclude-standard'),
    ]
      .join('\n')
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f && existsSync(f)),
  ),
]
const lintable = changed.filter((f) => /\.(ts|tsx|mjs|js)$/.test(f) && !f.startsWith('docs/'))
console.log(`Base ${base.slice(0, 7)} · ${changed.length} file đổi`)

const VITEST_SUMMARY = /^\s*(Test Files|Tests)\s/
const VITEST_FAIL = /(FAIL|Failed Tests|⎯⎯ Failed)/
const results = []

if (!flags.has('--no-types')) {
  results.push(run('Typecheck', 'pnpm', ['exec', 'tsc', '--noEmit']))
}

if (lintable.length) {
  // --quiet: errors only (the repo has ~190 known warnings that only cost tokens to read).
  results.push(
    run(
      `ESLint ${lintable.length} file (chỉ lỗi)`,
      'pnpm',
      ['exec', 'eslint', '--quiet', ...lintable],
      {
        env: { NODE_OPTIONS: '--no-deprecation' },
      },
    ),
  )
}

const vitest = ['exec', 'vitest', 'run', '--silent', '--reporter=dot']
if (flags.has('--affected')) {
  // Same selection as CI: tests whose import graph reaches a changed file.
  results.push(
    run(
      'Unit test bị ảnh hưởng (như CI)',
      'pnpm',
      [...vitest, '--changed', base, '--passWithNoTests'],
      {
        summary: VITEST_SUMMARY,
        failStart: VITEST_FAIL,
      },
    ),
  )
} else {
  const ownTests = changed.filter((f) => /^tests\/unit\/.*\.test\.tsx?$/.test(f))
  const files = [...new Set([...ownTests, ...extraTests])]
  if (files.length) {
    results.push(
      run(`Unit test của task (${files.length} file)`, 'pnpm', [...vitest, ...files], {
        summary: VITEST_SUMMARY,
        failStart: VITEST_FAIL,
      }),
    )
  } else {
    console.log('– Không có file unit test nào đổi')
  }
}

// Tests that read source files from disk (contrast, fonts, tokens…): imports cannot see those.
const unitDir = join(process.cwd(), 'tests/unit')
const scanners = readdirSync(unitDir)
  .filter((f) => /\.test\.tsx?$/.test(f))
  .filter((f) => /readFileSync|readdirSync/.test(readFileSync(join(unitDir, f), 'utf8')))
  .map((f) => `tests/unit/${f}`)
if (!flags.has('--affected') && scanners.length && changed.some((f) => f.startsWith('src/'))) {
  results.push(
    run(`Unit test đọc mã nguồn (${scanners.length} file)`, 'pnpm', [...vitest, ...scanners], {
      summary: VITEST_SUMMARY,
      failStart: VITEST_FAIL,
    }),
  )
}

const failed = results.filter((ok) => !ok).length
console.log(failed ? `✘ ${failed} bước đỏ` : '✔ Xanh – push được. CI chạy unit bị ảnh hưởng + e2e.')
process.exit(failed ? 1 : 0)
