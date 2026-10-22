import { describe, expect, it, vi } from 'vitest'

vi.mock('@/i18n/i18n', () => ({
  translate: (_key: string, fallback: string) => fallback
}))

vi.mock('@/i18n/localized-catalog', () => ({
  createLocalizedCatalog:
    <T>(loader: () => T) =>
    () =>
      loader()
}))

vi.mock('./settings-search-keywords', () => ({
  translateSearchKeyword: (_key: string, fallback: string) => [fallback]
}))

import { getStatusBarToggles } from './appearance-status-bar-search'

describe('getStatusBarToggles', () => {
  it('keeps the retained status items searchable', () => {
    expect(getStatusBarToggles().map((entry) => entry.id)).toEqual([
      'ssh',
      'resource-usage',
      'ports'
    ])
    expect(getStatusBarToggles().find((entry) => entry.id === 'resource-usage')).toMatchObject({
      title: 'Resource Manager',
      description: 'Show CPU, memory, terminal sessions, and workspace disk usage in the status bar.'
    })
  })
})
