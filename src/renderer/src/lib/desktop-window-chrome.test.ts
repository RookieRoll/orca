import { describe, expect, it } from 'vitest'
import { shouldRenderDesktopWindowChrome } from './desktop-window-chrome'

describe('shouldRenderDesktopWindowChrome', () => {
  it('renders custom chrome for frameless desktop Linux and Windows windows', () => {
    expect(shouldRenderDesktopWindowChrome({ platform: 'linux' })).toBe(true)
    expect(shouldRenderDesktopWindowChrome({ platform: 'win32' })).toBe(true)
  })

  it('keeps macOS on native traffic lights', () => {
    expect(shouldRenderDesktopWindowChrome({ platform: 'darwin' })).toBe(false)
  })
})
