import { describe, expect, it } from 'vitest'
import {
  classifyDaemonPtyCwd,
  classifyDaemonSpawnerPath,
  DAEMON_PTY_CWD_CLASSES,
  isMacTccFolderClass,
  MAC_TCC_FOLDER_CLASSES
} from './daemon-adoption-telemetry'

describe('classifyDaemonSpawnerPath', () => {
  const alwaysExists = () => true

  it('classifies the installed app, the ShipIt staging area, and everything else', () => {
    expect(
      classifyDaemonSpawnerPath('/Applications/Orca.app/Contents/MacOS/Orca', alwaysExists, null)
    ).toBe('applications')
    expect(
      classifyDaemonSpawnerPath(
        '/private/Applications/Orca.app/Contents/MacOS/Orca',
        alwaysExists,
        null
      )
    ).toBe('applications')
    expect(
      classifyDaemonSpawnerPath(
        '/Users/a/Library/Caches/com.stablyai.orca.ShipIt/update.abc/Orca.app/Contents/MacOS/Orca',
        alwaysExists,
        null
      )
    ).toBe('updater-cache')
    expect(
      classifyDaemonSpawnerPath(
        '/Users/a/Applications/Orca.app/Contents/MacOS/Orca',
        alwaysExists,
        null
      )
    ).toBe('other')
    expect(
      classifyDaemonSpawnerPath('/tmp/OrcaA.app/Contents/MacOS/Orca', alwaysExists, null)
    ).toBe('other')
  })

  it('reports a deleted spawner as missing and an unrecorded one as unknown', () => {
    expect(
      classifyDaemonSpawnerPath('/Applications/Orca.app/Contents/MacOS/Orca', () => false, null)
    ).toBe('missing')
    expect(classifyDaemonSpawnerPath(null, alwaysExists, null)).toBe('unknown')
  })

  it("classifies Orca's private stable copy from the recorded spawner path", () => {
    const prefix = '/Users/alice/Library/Application Support/Orca/daemon-host/macos/terminal-host-'
    const copy = `${prefix}0f3c/app.noindex/Orca Terminal Host.app/Contents/MacOS/orca-terminal-host`
    expect(classifyDaemonSpawnerPath(copy, alwaysExists, prefix)).toBe('stable-copy')
    expect(classifyDaemonSpawnerPath(copy, () => false, prefix)).toBe('missing')
    expect(classifyDaemonSpawnerPath(copy, alwaysExists, null)).toBe('other')
    expect(
      classifyDaemonSpawnerPath('/Applications/Orca.app/Contents/MacOS/Orca', alwaysExists, prefix)
    ).toBe('applications')
  })
})

describe('classifyDaemonPtyCwd', () => {
  it('maps the TCC-protected home folders and separates the rest of home from outside it', () => {
    expect(classifyDaemonPtyCwd('/Users/a/Documents/repo', '/Users/a')).toBe('documents')
    expect(classifyDaemonPtyCwd('/Users/a/Desktop', '/Users/a/')).toBe('desktop')
    expect(classifyDaemonPtyCwd('/Users/a/Downloads/x/y', '/Users/a')).toBe('downloads')
    expect(classifyDaemonPtyCwd('/Users/a/projects/repo', '/Users/a')).toBe('other-home')
    expect(classifyDaemonPtyCwd('/Users/a', '/Users/a')).toBe('other-home')
    expect(classifyDaemonPtyCwd('/Volumes/ext/repo', '/Users/a')).toBe('outside-home')
    // A sibling home that merely shares the prefix is not inside this home.
    expect(classifyDaemonPtyCwd('/Users/ab/Documents', '/Users/a')).toBe('outside-home')
  })
})

// The reset remedy is offered for exactly these classes, so main and the fix dialog must agree.
describe('isMacTccFolderClass', () => {
  it('admits the three folders with a per-app TCC row and no others', () => {
    for (const cwdClass of DAEMON_PTY_CWD_CLASSES) {
      expect(isMacTccFolderClass(cwdClass)).toBe(MAC_TCC_FOLDER_CLASSES.some((c) => c === cwdClass))
    }
    expect([...MAC_TCC_FOLDER_CLASSES]).toEqual(['documents', 'desktop', 'downloads'])
  })
})
