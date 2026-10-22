/** Result used by quota polling, where `skip` means no process should be spawned. */
export type CodexRateLimitHomeResolution =
  | { kind: 'ready'; codexHomePath: string | null }
  | { kind: 'skip' }
