import { describe, expect, it } from 'vitest'
import {
  STATUS_BAR_DENSITY_LEVELS,
  pickStatusBarDensityLevel,
  recordStatusBarDensityWidth
} from './status-bar-density'

const TIGHTEST = STATUS_BAR_DENSITY_LEVELS.length - 1
const w = (natural: number) => ({ natural })

describe('STATUS_BAR_DENSITY_LEVELS', () => {
  it('hides labels before reducing status segments to icons', () => {
    const firstCompact = STATUS_BAR_DENSITY_LEVELS.findIndex((level) => level.compact)
    const firstIconOnly = STATUS_BAR_DENSITY_LEVELS.findIndex((level) => level.segmentsIconOnly)
    expect(firstCompact).toBeGreaterThan(-1)
    expect(firstCompact).toBeLessThan(firstIconOnly)
  })
})

describe('pickStatusBarDensityLevel', () => {
  it('keeps the roomiest level that fits', () => {
    expect(pickStatusBarDensityLevel([w(700), w(600), w(500)], 800)).toBe(0)
    expect(pickStatusBarDensityLevel([w(700), w(600), w(500)], 550)).toBe(2)
  })

  it('probes an unmeasured level before settling on a tighter one', () => {
    expect(pickStatusBarDensityLevel([w(700), undefined, w(500)], 650)).toBe(1)
    expect(pickStatusBarDensityLevel([], 650)).toBe(0)
  })

  it('falls back to the tightest level when nothing fits', () => {
    expect(pickStatusBarDensityLevel([w(700), w(600), w(500)], 200)).toBe(TIGHTEST)
  })

  it('tolerates sub-pixel rounding at the boundary', () => {
    expect(pickStatusBarDensityLevel([w(600.6)], 600)).toBe(0)
  })
})

describe('recordStatusBarDensityWidth', () => {
  it('fills in a level without disturbing the others', () => {
    expect(recordStatusBarDensityWidth([w(700), undefined, w(500)], 1, w(600))).toEqual([
      w(700),
      w(600),
      w(500)
    ])
  })

  it('forgets other levels when a level re-measures differently', () => {
    expect(recordStatusBarDensityWidth([w(700), w(600), w(500)], 1, w(640))).toEqual([
      undefined,
      w(640)
    ])
  })

  it('keeps other levels on a sub-pixel re-measure', () => {
    expect(recordStatusBarDensityWidth([w(700), w(600), w(500)], 1, w(600.5))).toEqual([
      w(700),
      w(600.5),
      w(500)
    ])
  })
})
