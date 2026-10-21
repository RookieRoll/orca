import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { expect, it } from 'vitest'
import { parse } from 'yaml'
import { compileAggregateExpression } from './pr-aggregate-gate-context.mjs'

const workflow = parse(readFileSync('.github/workflows/node-server-tests.yml', 'utf8'))
const persistence = workflow.jobs.persistence
const shouldPersist = compileAggregateExpression(persistence.if, ['needs', 'github'])

function context({ qualification, event = 'pull_request', draft = false }) {
  return {
    github: { event_name: event, event: { pull_request: { draft } } },
    needs: {
      changes: { outputs: { qualification } }
    }
  }
}

it.each([
  { qualification: 'true', expected: true },
  { qualification: '', expected: true },
  { qualification: 'false', expected: true },
  { qualification: 'false', draft: true, expected: false },
  { event: 'workflow_dispatch', expected: true },
  { event: 'schedule', expected: true }
])('starts native setup independently while retaining test-only behavior: %j', (scenario) => {
  const ctx = context(scenario)
  expect(persistence.needs).toBe('changes')
  expect(shouldPersist(ctx).coerceString()).toBe(String(scenario.expected))
  expect(shouldPersist(ctx, true).coerceString()).toBe('false')
})

it('starts independent Linux qualification without waiting for another platform', () => {
  for (const name of ['linux_glibc_floor', 'linux_glibc217_compat', 'linux_musl']) {
    const job = workflow.jobs[name]
    expect([job.needs].flat()).not.toContain('persistence')
    expect(job.if).not.toContain('needs.persistence')
    const evaluate = compileAggregateExpression(job.if, ['needs', 'github', 'inputs'])
    const ctx = { ...context({ qualification: 'true' }), inputs: { build_template: true } }
    expect(evaluate(ctx).coerceString()).toBe('true')
    expect(evaluate(ctx, true).coerceString()).toBe('false')
    const draft = {
      ...context({ qualification: '', draft: true, producer: 'skipped' }),
      inputs: { build_template: false }
    }
    expect(evaluate(draft).coerceString()).toBe('false')
  }
})

it('requires every platform and compatibility result before publishing a desktop template', () => {
  const template = workflow.jobs.desktop_template
  const required = [
    'persistence',
    'linux_glibc_floor',
    'linux_glibc217_compat',
    'linux_musl'
  ]
  expect(template.needs).toEqual(required)
  const evaluate = compileAggregateExpression(template.if, ['needs', 'inputs'])
  const needs = Object.fromEntries(required.map((name) => [name, { result: 'success' }]))
  const ctx = { needs, inputs: { build_template: true } }
  expect(evaluate(ctx).coerceString()).toBe('true')
  expect(evaluate(ctx, true).coerceString()).toBe('false')
  for (const name of required) {
    for (const result of ['failure', 'cancelled', 'skipped']) {
      expect(evaluate({ ...ctx, needs: { ...needs, [name]: { result } } }).coerceString()).toBe(
        'false'
      )
    }
  }
})

it('avoids template download-cache transfers while retaining native and verification caches', () => {
  const install = persistence.steps.find((step) => step.id === 'dependencies')
  expect(install.with['native-runtime']).toContain("runner.os == 'Windows' && 'node'")
  expect(install.with['cache-pnpm-verification']).toBeUndefined()
  expect(install.with['persist-native-cache']).toBeUndefined()
  const source = install.with['cache-pnpm-store'].slice(3, -2)
  for (const os of ['Linux', 'macOS', 'Windows']) {
    for (const buildTemplate of [true, false]) {
      expect(
        runInNewContext(source, { inputs: { build_template: buildTemplate }, runner: { os } })
      ).toBe(!buildTemplate && os !== 'Windows')
    }
  }
})

it('prepares native inputs before Linux qualification and always cleans up Alpine', () => {
  const alpine = workflow.jobs.linux_musl.steps
  const prepare = alpine.find((step) => step.name === 'Prepare native Alpine artifact')
  const verify = alpine.find(
    (step) => step.name === 'Verify native Alpine artifact and persistence'
  )
  const cleanup = alpine.find((step) => step.name === 'Clean up the Alpine qualification container')
  expect(prepare.run).not.toContain('out/mobile-web')
  expect(prepare.run).toContain('--detach --name orcad-alpine')
  expect(prepare.run).toContain('docker exec -i orcad-alpine')
  expect(prepare.run).not.toContain('pnpm build:orcad\n')
  expect(verify.run).toContain('docker exec -i orcad-alpine')
  expect(verify.run).toContain('pnpm build:orcad\n')
  expect(verify.run).toContain('pnpm test:node-server --artifact')
  expect(cleanup.if).toBe('always()')
})
