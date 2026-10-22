// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Crosshair } from 'lucide-react'

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenuItem: ({
    children,
    onSelect,
    role,
    'aria-checked': ariaChecked
  }: {
    children: React.ReactNode
    onSelect: () => void
    role?: string
    'aria-checked'?: boolean
  }) => (
    <button role={role} aria-checked={ariaChecked} onClick={onSelect}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuShortcut: ({ children }: { children: React.ReactNode }) => <span>{children}</span>
}))

import { BrowserChromeFoldedMenuItems } from './browser-chrome-folded-tools'

afterEach(cleanup)

describe('BrowserChromeFoldedMenuItems', () => {
  it('runs folded actions directly', () => {
    const onSelect = vi.fn()
    render(
      <BrowserChromeFoldedMenuItems
        tools={[{ stage: 'external', label: 'Open', icon: Crosshair, onSelect }]}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it('preserves active state for folded toggle tools', () => {
    render(
      <BrowserChromeFoldedMenuItems
        tools={[
          {
            stage: 'draw',
            label: 'Draw',
            icon: Crosshair,
            onSelect: vi.fn(),
            active: true
          }
        ]}
      />
    )

    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Draw' }).getAttribute('aria-checked')
    ).toBe('true')
  })

  it('gives toggle tools their own section, split from the actions by a divider', () => {
    const { container } = render(
      <BrowserChromeFoldedMenuItems
        tools={[
          { stage: 'draw', label: 'Draw', icon: Crosshair, onSelect: vi.fn(), active: false },
          { stage: 'external', label: 'Open', icon: Crosshair, onSelect: vi.fn() }
        ]}
      />
    )

    // Rendered order: Draw, divider, Open, closing divider.
    expect(Array.from(container.querySelectorAll('button, hr')).map((el) => el.tagName)).toEqual([
      'BUTTON',
      'HR',
      'BUTTON',
      'HR'
    ])
  })
})
