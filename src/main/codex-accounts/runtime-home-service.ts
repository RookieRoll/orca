import type { Store } from '../persistence'
import { CodexRuntimeHomeLaunch } from './runtime-home-service-launch'

export type {
  CodexRateLimitHomeResolution
} from './runtime-home-service-types'

export class CodexRuntimeHomeService extends CodexRuntimeHomeLaunch {
  constructor(store: Store) {
    super(store)
  }
}
