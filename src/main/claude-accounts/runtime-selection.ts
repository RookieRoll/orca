export type ClaudeAccountSelectionTarget = {
  runtime?: 'host' | 'wsl'
  wslDistro?: string | null
}

export type NormalizedClaudeAccountSelectionTarget = {
  runtime: 'host' | 'wsl'
  wslDistro: string | null
}

export function normalizeClaudeAccountSelectionTarget(
  target?: ClaudeAccountSelectionTarget | null
): NormalizedClaudeAccountSelectionTarget {
  if (target?.runtime === 'wsl') {
    return {
      runtime: 'wsl',
      wslDistro: normalizeWslDistro(target.wslDistro)
    }
  }
  return { runtime: 'host', wslDistro: null }
}

function normalizeWslDistro(wslDistro: string | null | undefined): string | null {
  const trimmed = wslDistro?.trim()
  return trimmed ? trimmed : null
}
