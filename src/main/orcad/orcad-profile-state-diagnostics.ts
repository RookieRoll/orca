import type { OrcadProfileStateAuthoritySelection } from './orcad-profile-state-types'

export type OrcadProfileStateDiagnosticSink = (line: string) => void

export function formatOrcadProfileStateAuthorityDiagnostic(
  selection: OrcadProfileStateAuthoritySelection
): string {
  return `[orcad-profile-state] ${JSON.stringify({
    event: 'authority_selected',
    backend: selection.backend,
    classification: selection.classification,
    authority_mode: selection.authority_mode,
    runtime: selection.runtime,
    migrated: selection.migrated
  })}`
}

export function logOrcadProfileStateAuthorityDiagnostic(
  selection: OrcadProfileStateAuthoritySelection,
  sink: OrcadProfileStateDiagnosticSink = (line) => console.error(line)
): void {
  try {
    sink(formatOrcadProfileStateAuthorityDiagnostic(selection))
  } catch {
    // A closed stderr or custom supervisor sink cannot turn successful startup into a failure.
  }
}
