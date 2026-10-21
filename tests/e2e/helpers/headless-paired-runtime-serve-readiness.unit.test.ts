import { describe, expect, it } from 'vitest'
import {
  HeadlessPairedRuntimeStartupDiagnosticBuffer,
  formatHeadlessPairedRuntimeStartupDiagnostics,
  parseHeadlessPairedRuntimePairingOffer
} from './headless-paired-runtime-serve-readiness'

describe('headless paired runtime startup diagnostics', () => {
  it('redacts pairing URLs before truncation can remove their prefix', () => {
    const pairingUrl = `orca://${'secret'.repeat(1_500)}`
    const diagnostic = new HeadlessPairedRuntimeStartupDiagnosticBuffer()

    diagnostic.append(Buffer.from(`prefix${pairingUrl}\n`))

    expect(diagnostic.read()).toBe('prefixorca://[redacted]\n')
    expect(diagnostic.read()).not.toContain('secret')
  })

  it('redacts pairing URLs split across chunks', () => {
    const diagnostic = new HeadlessPairedRuntimeStartupDiagnosticBuffer()
    diagnostic.append(Buffer.from('orca://p'))
    diagnostic.append(Buffer.from('airing-secret\nready'))

    expect(formatHeadlessPairedRuntimeStartupDiagnostics(diagnostic.read(), '')).toBe(
      'stdout:\norca://[redacted]\nready'
    )
  })

  it('drops oversized unfinished lines instead of retaining a pairing fragment', () => {
    const diagnostic = new HeadlessPairedRuntimeStartupDiagnosticBuffer()
    diagnostic.append(Buffer.from(`orca://${'secret'.repeat(1_500)}`))
    diagnostic.append(Buffer.from('still-secret\nsafe'))

    expect(diagnostic.read()).toBe('safe')
  })
})

describe('headless paired runtime readiness', () => {
  it.each(['null', 'true', '0', '"ready"', '[]'])(
    'ignores JSON primitives and non-object readiness payloads: %s',
    (payload) => {
      expect(parseHeadlessPairedRuntimePairingOffer(payload)).toBeNull()
    }
  )

  it('accepts desktop-only pairing readiness', () => {
    expect(
      parseHeadlessPairedRuntimePairingOffer(
        JSON.stringify({
          type: 'orca_server_ready',
          pairing: { available: true, url: 'orca://pairing-secret' }
        })
      )
    ).toEqual({ pairingUrl: 'orca://pairing-secret' })
  })

})
