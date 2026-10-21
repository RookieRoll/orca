import { z } from 'zod'

export const TERMINAL_PANE_SPLIT_SOURCES = [
  'contextual_tour',
  'keyboard',
  'context_menu',
  'command',
  'unknown'
] as const

export const terminalPaneSplitSourceSchema = z.enum(TERMINAL_PANE_SPLIT_SOURCES)
export type TerminalPaneSplitSource = z.infer<typeof terminalPaneSplitSourceSchema>
