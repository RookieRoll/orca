import { useState } from 'react'
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import { AgentIcon } from '@/lib/agent-catalog'
import { translate } from '@/i18n/i18n'
import type { ZcodePlanSite } from '../../../../shared/zcode-plan-sites'
import { cn } from '@/lib/utils'
import { useAppStore } from '../../store'
import { useNow } from '../../hooks/use-now'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { SearchableSetting } from './SearchableSetting'
import { collectZcodeUsageWindows, ZcodeUsageWindowView } from './zcode-plan-usage-windows'
import { useZcodePlanCredentials } from './use-zcode-plan-credentials'
import { ZcodeCliSetupSection } from './ZcodeCliSetupSection'
import {
  usageCredentialAccessNotice,
  type UsageCredentialHost
} from './usage-credential-host'
import type { UsageHostSettingsModel } from './use-usage-host-settings'

const SEARCH_KEYWORDS = [
  'glm',
  'zai',
  'z.ai',
  'zhipu',
  'bigmodel',
  'coding plan',
  'usage',
  'rate limit',
  'zcode'
]

function siteLabel(site: ZcodePlanSite): string {
  if (site === 'bigmodel') {
    return translate(
      'auto.components.settings.ZcodePlanAccountsSection.site.bigmodel',
      'Zhipu · BigModel (open.bigmodel.cn)'
    )
  }
  return translate('auto.components.settings.ZcodePlanAccountsSection.site.zai', 'Z.AI (z.ai)')
}

export function ZcodePlanAccountsSection({
  host,
  usageSettings
}: {
  host: UsageCredentialHost
  usageSettings: UsageHostSettingsModel
}): React.JSX.Element {
  const refreshRateLimits = useAppStore((s) => s.refreshRateLimits)
  const storeZcodeUsage = useAppStore((s) => s.rateLimits.zcode)
  const hostLabel = host.label
  // Why: this computer's poll says nothing about another host's plan.
  const zcodeUsage = hostLabel === null ? storeZcodeUsage : null
  const { status, access } = useZcodePlanCredentials(zcodeUsage?.updatedAt, host.owner)
  const [refreshing, setRefreshing] = useState(false)
  const now = useNow(60_000)

  const hostStatusAvailable = access === 'ready'
  const accessNotice = usageCredentialAccessNotice(host, access)
  const site = usageSettings.settings?.zcodePlanSite ?? (hostLabel === null ? 'zai' : undefined)
  const siteEditable = hostStatusAvailable && usageSettings.settings !== null
  const detailsUnavailable = status?.detailsUnavailable === true
  const apiKeyConfigured = status?.apiKeyConfigured === true

  const handleSiteChange = (value: string): void => {
    if (!siteEditable || (value !== 'zai' && value !== 'bigmodel') || value === site) {
      return
    }
    // Why: the host invalidates and refreshes on this settings change, so no refresh is needed here.
    void usageSettings.update({ zcodePlanSite: value })
  }

  const handleRefreshUsage = async (): Promise<void> => {
    setRefreshing(true)
    try {
      await refreshRateLimits()
    } finally {
      setRefreshing(false)
    }
  }

  const usage = zcodeUsage ?? null
  const usageWindows = collectZcodeUsageWindows(usage)
  const staleUsageError = usage?.status === 'error' ? (usage.error ?? null) : null

  return (
    <section id="accounts-zcode" className="space-y-4 scroll-mt-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <AgentIcon agent="zcode" size={16} />
            {translate(
              'auto.components.settings.ZcodePlanAccountsSection.title',
              'GLM Coding Plan'
            )}
          </h3>
        </div>
      </div>

      <div
        className={cn(
          'flex items-start gap-3 rounded-lg border bg-muted/20 p-3',
          apiKeyConfigured ? 'border-border/60' : 'border-border/40'
        )}
      >
        <ShieldCheck
          className={cn(
            'mt-0.5 size-4 shrink-0',
            apiKeyConfigured ? 'text-foreground' : 'text-muted-foreground'
          )}
        />
        <div className="min-w-0 flex-1 space-y-0.5">
          {accessNotice ? (
            <p className="text-xs font-medium">{accessNotice}</p>
          ) : detailsUnavailable ? (
            <p className="text-xs text-muted-foreground">
              {translate(
                'auto.components.settings.ZcodePlanAccountsSection.detailsUnavailable',
                'Plan credential details are only readable on the computer running Orca.'
              )}
            </p>
          ) : apiKeyConfigured ? (
            <>
              <p className="text-xs font-medium">
                {translate(
                  'auto.components.settings.ZcodePlanAccountsSection.keyStored',
                  'API key configured · {{value0}}',
                  { value0: siteLabel(site ?? 'zai') }
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {hostLabel === null
                  ? translate(
                      'auto.components.settings.ZcodePlanAccountsSection.keyStoredHelp',
                      'Stored locally and sent only to the selected site for usage refreshes. It takes priority over the ZCode CLI sign-in.'
                    )
                  : translate(
                      'auto.components.settings.ZcodePlanAccountsSection.keyStoredOnHostHelp',
                      'Stored on {{host}} and sent from there only to the selected site for usage refreshes. It takes priority over the ZCode CLI sign-in.',
                      { host: hostLabel }
                    )}
              </p>
            </>
          ) : status?.zcodeCliConfigured ? (
            <p className="text-xs font-medium">
              {translate(
                'auto.components.settings.ZcodePlanAccountsSection.usingCli',
                'Using the ZCode CLI sign-in'
              )}
            </p>
          ) : (
            <p className="text-xs font-medium">
              {translate(
                'auto.components.settings.ZcodePlanAccountsSection.notConfigured',
                'No GLM Coding Plan linked'
              )}
            </p>
          )}
          {staleUsageError ? <p className="text-xs text-destructive">{staleUsageError}</p> : null}
        </div>
        {hostLabel === null ? (
          <Button
            variant="outline"
            size="xs"
            disabled={refreshing}
            onClick={() => void handleRefreshUsage()}
            className="shrink-0"
          >
            {refreshing ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <RefreshCw className="size-3" />
            )}
            {translate(
              'auto.components.settings.ZcodePlanAccountsSection.refreshUsage',
              'Refresh usage'
            )}
          </Button>
        ) : null}
      </div>

      <SearchableSetting
        title={translate(
          'auto.components.settings.ZcodePlanAccountsSection.siteTitle',
          'Plan site'
        )}
        description={translate(
          'auto.components.settings.ZcodePlanAccountsSection.siteDescription',
          'Pick the console your Coding Plan belongs to: Z.AI for the international site, Zhipu BigModel for the mainland site.'
        )}
        keywords={SEARCH_KEYWORDS}
        className="space-y-2"
      >
        <Label htmlFor="zcode-plan-site">
          {translate('auto.components.settings.ZcodePlanAccountsSection.siteTitle', 'Plan site')}
        </Label>
        <Select value={site ?? ''} onValueChange={handleSiteChange} disabled={!siteEditable}>
          <SelectTrigger id="zcode-plan-site" size="sm" className="w-full">
            <SelectValue
              placeholder={translate(
                'auto.components.settings.ZcodePlanAccountsSection.siteUnavailable',
                'Host plan site unavailable'
              )}
            />
          </SelectTrigger>
          <SelectContent>
            {(['zai', 'bigmodel'] as const).map((option) => (
              <SelectItem key={option} value={option}>
                {siteLabel(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SearchableSetting>

      {hostLabel === null ? <ZcodeCliSetupSection /> : null}

      {usageWindows.length > 0 ? (
        <SearchableSetting
          title={translate(
            'auto.components.settings.ZcodePlanAccountsSection.usageTitle',
            'Plan usage'
          )}
          description={translate(
            'auto.components.settings.ZcodePlanAccountsSection.usageDescription',
            'Live quota windows for the linked Coding Plan, refreshed with the status bar usage cycle.'
          )}
          keywords={SEARCH_KEYWORDS}
        >
          <div className="space-y-1">
            {usageWindows.map((row) => (
              <ZcodeUsageWindowView key={row.kind} row={row} now={now} />
            ))}
            {usage?.planType ? (
              <p className="text-xs text-muted-foreground">
                {translate(
                  'auto.components.settings.ZcodePlanAccountsSection.planLevel',
                  'Plan: {{value0}}',
                  { value0: usage.planType }
                )}
              </p>
            ) : null}
          </div>
        </SearchableSetting>
      ) : null}
    </section>
  )
}
