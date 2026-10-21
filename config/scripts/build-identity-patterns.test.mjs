import { describe, expect, it } from 'vitest'
import { BUILD_IDENTITY_RE, MINIFIED_BUILD_IDENTITY_RE } from './build-identity-patterns.mjs'

describe('build identity patterns', () => {
  it.each(['const', 'let', 'var'])('accepts %s declarations', (declaration) => {
    expect(`${declaration} BUILD_IDENTITY = "rc"`).toMatch(BUILD_IDENTITY_RE)
  })

  it('rejects assignments and invalid values', () => {
    expect('BUILD_IDENTITY = "rc"').not.toMatch(BUILD_IDENTITY_RE)
    expect('const BUILD_IDENTITY = "dev"').not.toMatch(BUILD_IDENTITY_RE)
    expect('const BUILD_IDENTITY = null').not.toMatch(BUILD_IDENTITY_RE)
  })

  it('accepts minified identity declarations', () => {
    expect('var dde=`stable`,pde=(dde===`stable`)').toMatch(MINIFIED_BUILD_IDENTITY_RE)
  })

  it('rejects a minified bundle without an official identity', () => {
    expect('var a=!0,b=`dev`,c=null').not.toMatch(MINIFIED_BUILD_IDENTITY_RE)
  })
})
