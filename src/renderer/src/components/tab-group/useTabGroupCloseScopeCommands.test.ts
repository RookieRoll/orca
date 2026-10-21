// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Tab, TabGroup } from '../../../../shared/tab-types'
import { useTabGroupCloseScopeCommands } from './useTabGroupCloseScopeCommands'

const mocks = vi.hoisted(() => {
  const state: {
    groupsByWorktree: Record<string, TabGroup[]>
    unifiedTabsByWorktree: Record<string, Tab[]>
  } = { groupsByWorktree: {}, unifiedTabsByWorktree: {} }
  return { closeEmptyGroup: vi.fn(), state }
})

vi.mock('../../store', () => ({
  useAppStore: Object.assign(
    (selector: (state: { closeEmptyGroup: () => void }) => unknown) => selector(mocks),
    { getState: () => mocks.state }
  )
}))
vi.mock('../confirmation-dialog-context', () => ({
  useConfirmationDialog: () => async () => true
}))
vi.mock('./workspace-emptied-reaction', () => ({
  captureWorkspaceEmptiedReaction: vi.fn(() => vi.fn())
}))

function tab(id: string, isPinned = false): Tab {
  return {
    id,
    entityId: id,
    contentType: 'terminal',
    groupId: 'group-1',
    worktreeId: 'worktree-1',
    label: id,
    customLabel: null,
    color: null,
    sortOrder: 0,
    createdAt: 0,
    isPinned
  }
}

function commands() {
  const group: TabGroup = {
    id: 'group-1',
    worktreeId: 'worktree-1',
    activeTabId: 'selected',
    tabOrder: ['left', 'pinned-left', 'selected', 'right', 'pinned-right', 'missing', 'last']
  }
  const groupTabs = [
    tab('last'),
    tab('selected'),
    tab('pinned-left', true),
    tab('pinned-right', true),
    tab('right'),
    tab('left')
  ]
  mocks.state = {
    groupsByWorktree: { 'worktree-1': [group] },
    unifiedTabsByWorktree: { 'worktree-1': groupTabs }
  }
  const closeMany = vi.fn()
  const hook = renderHook(() =>
    useTabGroupCloseScopeCommands({
      groupId: group.id,
      worktreeId: 'worktree-1',
      closeItem: vi.fn(),
      closeMany
    })
  )
  return { ...hook.result.current, closeMany }
}

beforeEach(() => vi.clearAllMocks())

describe('directional tab close', () => {
  it.each([
    ['left', ['left']],
    ['right', ['right', 'last']]
  ] as const)('closes visible unpinned tabs to the %s in order', async (direction, expectedIds) => {
    const scope = commands()
    await act(async () => {
      if (direction === 'left') scope.closeToLeft('selected')
      else scope.closeToRight('selected')
    })
    expect(scope.closeMany).toHaveBeenCalledExactlyOnceWith(expectedIds)
  })

  it('does not close tabs when the selection is empty', () => {
    const scope = commands()
    scope.closeToLeft('left')
    expect(scope.closeMany).not.toHaveBeenCalled()
  })

  it('ignores stale anchors', () => {
    const scope = commands()
    scope.closeToLeft('stale')
    scope.closeToRight('stale')
    expect(scope.closeMany).not.toHaveBeenCalled()
  })
})
