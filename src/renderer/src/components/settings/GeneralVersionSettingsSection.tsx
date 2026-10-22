import type React from 'react'
import { useEffect, useState } from 'react'
import { SettingsSubsectionHeader } from './SettingsFormControls'
import { translate } from '@/i18n/i18n'

export function GeneralVersionSettingsSection(): React.JSX.Element {
  const [appVersion, setAppVersion] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void window.api.app.getVersion().then((version) => {
      if (!cancelled) {
        setAppVersion(version)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section key="version" className="space-y-4">
      <SettingsSubsectionHeader
        title={translate(
          'auto.components.settings.GeneralUpdateSettingsSection.a6b37929dc',
          'Version'
        )}
        description={translate(
          'auto.components.settings.GeneralUpdateSettingsSection.d91ebfb87e',
          'Current version: {{value0}}',
          { value0: appVersion ?? '...' }
        )}
      />
    </section>
  )
}
