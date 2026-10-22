import { useEffect } from 'react'
import type { JSX, ReactNode } from 'react'
import { useAppStore } from '@/store'
import { ClaudeIcon, OpenAIIcon } from '@/components/status-bar/icons'
import { cn } from '@/lib/utils'
import { getFeatureWallUsageProviderConnection } from '../feature-wall-usage-tracking'
import { translate } from '@/i18n/i18n'

function ConnectionPill(props: { connected: boolean; label: string }): JSX.Element {
  const { connected, label } = props
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium',
        connected
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
          : 'border-border bg-background text-muted-foreground'
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          connected ? 'bg-emerald-500' : 'bg-muted-foreground'
        )}
      />
      {label}
    </span>
  )
}

function ProviderRow(props: {
  icon: ReactNode
  name: string
  description: string
  connected: boolean
  connectionLabel: string
}): JSX.Element {
  const { icon, name, description, connected, connectionLabel } = props
  return (
    <div className="rounded-lg border border-border bg-muted/20">
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold leading-tight text-foreground">{name}</h3>
            <ConnectionPill connected={connected} label={connectionLabel} />
          </div>
          <p className="mt-0.5 truncate text-[11.5px] leading-snug text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

export function UsageAccountsCard(): JSX.Element {
  const rateLimits = useAppStore((s) => s.rateLimits)
  const fetchRateLimits = useAppStore((s) => s.fetchRateLimits)

  // Why: read only the usage snapshots already exposed by the host.
  useEffect(() => {
    void fetchRateLimits()
  }, [fetchRateLimits])

  const claudeConnection = getFeatureWallUsageProviderConnection({
    provider: rateLimits.claude
  })
  const codexConnection = getFeatureWallUsageProviderConnection({
    provider: rateLimits.codex
  })

  return (
    <div className="flex flex-col gap-2.5">
      <ProviderRow
        icon={<ClaudeIcon size={16} />}
        name="Claude"
        description={translate(
          'auto.components.feature.wall.agents.orchestration.UsageAccountsCard.d90d2e1f6d',
          'Track session and weekly usage.'
        )}
        connected={claudeConnection.connected}
        connectionLabel={claudeConnection.label}
      />
      <ProviderRow
        icon={<OpenAIIcon size={16} />}
        name="Codex"
        description={translate(
          'auto.components.feature.wall.agents.orchestration.UsageAccountsCard.6986b36708',
          'Show usage from the Codex CLI sign-in on this computer.'
        )}
        connected={codexConnection.connected}
        connectionLabel={codexConnection.label}
      />
    </div>
  )
}
