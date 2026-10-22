import type { AutomationService } from '../automations/service'
import { createRuntimeAutomationService } from '../automations/runtime-automation-service'
import { mainProcessState as state } from './main-process-state'

export function initializeMainProcessAutomations(): AutomationService {
  const store = state.store
  const runtime = state.runtime
  if (!store || !runtime) {
    throw new Error('Runtime must be initialized before automations')
  }
  const service = createRuntimeAutomationService({
    store,
    runtime,
    // Why: desktop clients mirror remote-host automations, but only a server process should execute remote_host_service-owned schedules.
    headless: state.isServeMode
  })
  state.automations = service
  return service
}
