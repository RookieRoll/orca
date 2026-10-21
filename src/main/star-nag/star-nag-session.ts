import type { StarNagPromptMode, StarNagPromptSource } from '../../shared/star-nag-contract'

export type StarNagPromptSession = {
  source: StarNagPromptSource
  mode: StarNagPromptMode
  starAttemptPromise?: Promise<boolean>
}
