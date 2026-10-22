// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, it, vi } from 'vitest'
import { GeneralVersionSettingsSection } from './GeneralVersionSettingsSection'

afterEach(() => {
  cleanup()
  Reflect.deleteProperty(window, 'api')
})

it('shows the installed application version', async () => {
  Object.defineProperty(window, 'api', {
    configurable: true,
    value: { app: { getVersion: vi.fn().mockResolvedValue('1.4.199') } }
  })

  render(<GeneralVersionSettingsSection />)

  expect(await screen.findByText('Current version: 1.4.199')).toBeTruthy()
})
