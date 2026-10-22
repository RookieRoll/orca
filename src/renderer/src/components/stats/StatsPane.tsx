import { useEffect } from 'react'
import { Bot, Clock, GitPullRequest } from 'lucide-react'
import { useAppStore } from '../../store'
import { StatCard } from './StatCard'
import { getIntlLocale, translate } from '@/i18n/i18n'

function formatDuration(ms: number): string {
  if (ms <= 0) {
    return '0m'
  }

  const totalMinutes = Math.floor(ms / 60_000)
  const totalHours = Math.floor(totalMinutes / 60)
  const totalDays = Math.floor(totalHours / 24)
  const remainingHours = totalHours % 24
  const remainingMinutes = totalMinutes % 60

  if (totalDays > 0) {
    return `${totalDays}d ${remainingHours}h`
  }
  if (totalHours > 0) {
    return `${totalHours}h ${remainingMinutes}m`
  }
  return `${totalMinutes}m`
}

function formatTrackingSince(timestamp: number | null): string {
  if (!timestamp) {
    return ''
  }
  const date = new Date(timestamp)
  return translate('auto.components.stats.StatsPane.trackingSince', 'Tracking since {{value0}}', {
    value0: date.toLocaleDateString(getIntlLocale(), {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  })
}

export function StatsPane(): React.JSX.Element {
  const summary = useAppStore((s) => s.statsSummary)
  const fetchStatsSummary = useAppStore((s) => s.fetchStatsSummary)

  useEffect(() => {
    void fetchStatsSummary()
  }, [fetchStatsSummary])

  return (
    <div className="space-y-5">
      {summary ? (
        <div className="space-y-3">
          {summary.totalAgentsSpawned === 0 && summary.totalPRsCreated === 0 ? (
            <div className="flex min-h-[8rem] items-center justify-center rounded-lg border border-dashed border-border/60 bg-card/30 text-sm text-muted-foreground">
              {translate(
                'auto.components.stats.StatsPane.73ed07859c',
                'Start your first agent to begin tracking'
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  label={translate('auto.components.stats.StatsPane.9dbec9e675', 'Agents spawned')}
                  value={summary.totalAgentsSpawned.toLocaleString()}
                  icon={<Bot className="size-4" />}
                />
                <StatCard
                  label={translate(
                    'auto.components.stats.StatsPane.1c96f433e2',
                    'Time agents worked'
                  )}
                  value={formatDuration(summary.totalAgentTimeMs)}
                  icon={<Clock className="size-4" />}
                />
                <StatCard
                  label={translate('auto.components.stats.StatsPane.a58aba506f', 'PRs created')}
                  value={summary.totalPRsCreated.toLocaleString()}
                  icon={<GitPullRequest className="size-4" />}
                />
              </div>
              {formatTrackingSince(summary.firstEventAt) && (
                <p className="px-1 text-xs text-muted-foreground">
                  {formatTrackingSince(summary.firstEventAt)}
                </p>
              )}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
