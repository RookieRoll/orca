import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { GitLabRateLimitPanel } from '@/components/gitlab/gitlab-rate-limit-display'

type StoreState = {
  settings: { activeRuntimeEnvironmentId: string | null }
  openSettingsPage: () => void
  openSettingsTarget: (target: { pane: string; repoId: string | null }) => void
}

const mocks = vi.hoisted(() => ({
  store: {
    current: {
      settings: { activeRuntimeEnvironmentId: null },
      openSettingsPage: vi.fn(),
      openSettingsTarget: vi.fn()
    } as StoreState
  }
}))

vi.mock('@/store', () => ({
  useAppStore: (selector: (state: StoreState) => unknown) => selector(mocks.store.current)
}))

describe('GitLab rate-limit panel account scope', () => {
  it('shows the remote server scope for GitLab API budget', () => {
    mocks.store.current = {
      settings: { activeRuntimeEnvironmentId: null },
      openSettingsPage: vi.fn(),
      openSettingsTarget: vi.fn()
    }

    const markup = renderToStaticMarkup(
      <GitLabRateLimitPanel target={{ kind: 'environment', environmentId: 'runtime-1' }} />
    )

    expect(markup).toContain('Budget scope: Remote server: runtime-1')
    expect(markup).toContain(
      'GitLab API budget is fetched from the CLI on this remote server. Choose another host in the Host menu at the top of Settings to see its budget.'
    )
  })
})
