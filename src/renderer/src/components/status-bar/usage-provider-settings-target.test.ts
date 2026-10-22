import { describe, expect, it } from 'vitest'
import {
  getUsageProviderAccountsSectionId,
  usageRowSignInOpensSettings
} from './usage-provider-settings-target'

describe('getUsageProviderAccountsSectionId', () => {
  it('routes providers only to settings sections that exist', () => {
    expect(getUsageProviderAccountsSectionId('claude')).toBeNull()
    expect(getUsageProviderAccountsSectionId('codex')).toBeNull()
    expect(getUsageProviderAccountsSectionId('gemini')).toBe('accounts-gemini')
    expect(getUsageProviderAccountsSectionId('opencode-go')).toBe('accounts-opencode-go')
    expect(getUsageProviderAccountsSectionId('minimax')).toBe('accounts-minimax')
    expect(getUsageProviderAccountsSectionId('grok')).toBe('accounts-grok')
    expect(getUsageProviderAccountsSectionId('cursor')).toBe('accounts-cursor')
    expect(getUsageProviderAccountsSectionId('zcode')).toBe('accounts-zcode')
  })

  it('does not invent an Accounts section for CLI-owned credentials', () => {
    expect(getUsageProviderAccountsSectionId('antigravity')).toBeNull()
    expect(getUsageProviderAccountsSectionId('kimi')).toBeNull()
  })
})

describe('usageRowSignInOpensSettings', () => {
  it('does not route CLI-owned credentials to removed account settings', () => {
    expect(usageRowSignInOpensSettings('claude')).toBe(false)
    expect(usageRowSignInOpensSettings('codex')).toBe(false)
    expect(usageRowSignInOpensSettings('kimi')).toBe(false)
  })
})
