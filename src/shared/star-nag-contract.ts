import { z } from 'zod'

export const starNagPromptSourceSchema = z.enum([
  'threshold',
  'force_show',
  'agent_value_moment',
  'onboarding_completed',
  'update_flow',
  'settings',
  'legacy_threshold'
])
export const starNagPromptModeSchema = z.enum(['gh', 'web'])

export type StarNagPromptSource = z.infer<typeof starNagPromptSourceSchema>
export type StarNagPromptMode = z.infer<typeof starNagPromptModeSchema>
