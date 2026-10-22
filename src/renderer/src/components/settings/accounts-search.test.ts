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

import { getAccountsAntigravitySearchEntries, getAccountsPaneSearchEntries } from './accounts-search'

describe('getAccountsPaneSearchEntries', () => {
  it('keeps retained native account settings discoverable', () => {
    const entries = getAccountsPaneSearchEntries()
    const titles = entries.map((entry) => entry.title)
    expect(titles).toContain('Antigravity Accounts')
    expect(titles).not.toContain('OpenCode Go Workspace ID')
    expect(titles).not.toContain('Cursor Usage')
    expect(titles).not.toContain('GLM Coding Plan')
    expect(entries.find((entry) => entry.title === 'Antigravity Accounts')?.keywords).toEqual(
      expect.arrayContaining(['antigravity', 'agy', 'google', 'accounts'])
    )
    expect(entries.find((entry) => entry.title === 'Antigravity Accounts')?.keywords).not.toContain(
      'usage'
    )
    expect(getAccountsAntigravitySearchEntries()).toHaveLength(1)
  })
})
