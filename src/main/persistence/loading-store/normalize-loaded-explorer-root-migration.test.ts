import { homedir } from 'node:os'
import { expect, it, vi } from 'vitest'
import { getDefaultPersistedState } from '../../../shared/constants'
import type { PersistedState } from '../../../shared/persisted-state-types'
import { normalizeLoadedUiState } from './normalize-loaded-ui-state'

it.each([undefined, false, null, 1, 'true', {}, true])(
  'persists the root migration unless the raw marker is boolean true (%j)',
  (marker) => {
    const defaults = getDefaultPersistedState(homedir())
    const onboarding = defaults.onboarding!
    const normalizedUI = normalizeLoadedUiState(
      defaults,
      defaults,
      onboarding,
      false,
      false,
      vi.fn()
    )
    const parsed: PersistedState = JSON.parse(
      JSON.stringify({
        ...defaults,
        ui: { ...normalizedUI, _explorerDisplayRootMigrated: marker },
        worktreeMeta: { existing: { sparseDirectories: ['src'] } }
      })
    )
    const markNeedsSave = vi.fn()
    const ui = normalizeLoadedUiState(parsed, defaults, onboarding, false, false, markNeedsSave)
    expect(ui._explorerDisplayRootMigrated).toBe(true)
    expect(ui.explorerDisplayRootByWorktree).toEqual(marker === true ? {} : { existing: '/' })
    expect(markNeedsSave).toHaveBeenCalledTimes(marker === true ? 0 : 1)

    markNeedsSave.mockClear()
    const reloaded = normalizeLoadedUiState(
      { ...parsed, ui },
      defaults,
      onboarding,
      false,
      false,
      markNeedsSave
    )
    expect(reloaded.explorerDisplayRootByWorktree).toEqual(ui.explorerDisplayRootByWorktree)
    expect(markNeedsSave).not.toHaveBeenCalled()
  }
)

it('strips retired updater and pet fields without resetting other UI state', () => {
  const defaults = getDefaultPersistedState(homedir())
  const onboarding = defaults.onboarding!
  const parsed = JSON.parse(
    JSON.stringify({
      ...defaults,
      ui: {
        ...defaults.ui,
        sidebarWidth: 317,
        dismissedUpdateVersion: '1.2.3',
        lastUpdateCheckAt: 1_700_000_000_000,
        releaseChannelOverride: 'rc',
        pendingUpdateNudgeId: 'nudge-1',
        dismissedUpdateNudgeId: 'nudge-2',
        updateReassuranceSeen: true,
        petVisible: false,
        petId: 'codex',
        customPets: [{ id: 'custom' }],
        petSize: 96,
        sidekickVisible: false,
        sidekickId: 'legacy',
        customSidekicks: [{ id: 'legacy' }],
        sidekickSize: 84
      }
    })
  )
  const markNeedsSave = vi.fn()

  const ui = normalizeLoadedUiState(parsed, defaults, onboarding, false, false, markNeedsSave)

  expect(ui.sidebarWidth).toBe(317)
  for (const field of [
    'dismissedUpdateVersion',
    'lastUpdateCheckAt',
    'releaseChannelOverride',
    'pendingUpdateNudgeId',
    'dismissedUpdateNudgeId',
    'updateReassuranceSeen',
    'petVisible',
    'petId',
    'customPets',
    'petSize',
    'sidekickVisible',
    'sidekickId',
    'customSidekicks',
    'sidekickSize'
  ]) {
    expect(ui).not.toHaveProperty(field)
  }
  expect(markNeedsSave).toHaveBeenCalled()
})
