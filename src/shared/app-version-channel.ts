import { isValidAppVersion } from './app-version'

export type AppVersionChannel = 'stable' | 'rc' | 'hourly' | 'daily' | 'adhoc'

export const MAIN_RELEASE_REPO = 'stablyai/orca'

const HOURLY_VERSION = /^\d+\.\d+\.\d+-hourly\.\d{12}$/
const DAILY_VERSION = /^\d+\.\d+\.\d+-daily\.\d{12}$/
const ADHOC_VERSION = /^\d+\.\d+\.\d+-adhoc\.\d{14}$/

function normalizeTagToVersion(version: string): string {
  return version.replace(/^v/i, '')
}

export function getVersionChannel(version: string): AppVersionChannel | null {
  const normalized = normalizeTagToVersion(version)
  if (!isValidAppVersion(normalized)) {
    return null
  }
  if (HOURLY_VERSION.test(normalized)) {
    return 'hourly'
  }
  if (DAILY_VERSION.test(normalized)) {
    return 'daily'
  }
  if (ADHOC_VERSION.test(normalized)) {
    return 'adhoc'
  }
  return normalized.includes('-') ? 'rc' : 'stable'
}
