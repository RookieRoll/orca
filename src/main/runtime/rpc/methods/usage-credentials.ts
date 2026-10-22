import { defineMethod } from '../core'
import { getMiniMaxCredentialsStatus } from '../../../minimax/minimax-credential-commands'
import { getZcodePlanCredentialsStatus } from '../../../zcode/zcode-plan-credential-commands'

// Paired clients can inspect whether this host has usage credentials without receiving their values.
export const USAGE_CREDENTIAL_METHODS = [
  defineMethod({
    name: 'accounts.minimaxCredentialsStatus',
    permission: 'workspace',
    params: null,
    handler: async (_, { runtime }) => {
      runtime.requireUsageRateLimits()
      return getMiniMaxCredentialsStatus()
    }
  }),
  defineMethod({
    name: 'accounts.zcodePlanCredentialsStatus',
    permission: 'workspace',
    params: null,
    handler: async (_, { runtime }) => {
      runtime.requireUsageRateLimits()
      return getZcodePlanCredentialsStatus()
    }
  })
] as const
