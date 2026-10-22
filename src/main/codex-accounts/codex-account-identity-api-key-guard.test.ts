import { describe, expect, it } from 'vitest'
import { readCodexAuthIdentity } from './codex-auth-identity'

/** Encodes a JWT whose payload carries the given claims; only the payload segment is read. */
function idTokenWithClaims(claims: Record<string, unknown>): string {
  const payload = Buffer.from(JSON.stringify(claims), 'utf-8').toString('base64url')
  return `header.${payload}.signature`
}

describe('readCodexAuthIdentity account-id fallback', () => {
  it('falls through to the auth claim for providerAccountId when tokens.account_id is blank', () => {
    // Why: a blank token field must not end the fallback chain — an empty string is not nullish.
    const contents = JSON.stringify({
      tokens: {
        account_id: '   ',
        id_token: idTokenWithClaims({
          'https://api.openai.com/auth': { chatgpt_account_id: 'claim-account' }
        })
      }
    })

    expect(readCodexAuthIdentity(contents)).toMatchObject({
      providerAccountId: 'claim-account',
      // workspaceAccountId's chain skips the auth claim and ends at the top-level one.
      workspaceAccountId: null
    })
  })

  it('falls through to the top-level claim for workspaceAccountId when tokens.account_id is blank', () => {
    const contents = JSON.stringify({
      tokens: {
        account_id: '',
        id_token: idTokenWithClaims({ chatgpt_account_id: 'top-level-account' })
      }
    })

    expect(readCodexAuthIdentity(contents)).toMatchObject({
      providerAccountId: 'top-level-account',
      workspaceAccountId: 'top-level-account'
    })
  })
})
