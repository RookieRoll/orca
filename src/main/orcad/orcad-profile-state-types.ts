import type { ProfileStateStorageClassification } from '../persistence/profile-state/profile-state-storage-classification'

export type OrcadProfileStateAuthoritySelection = {
  backend: 'sqlite'
  classification: ProfileStateStorageClassification
  authority_mode: 'sqlite-established'
  runtime: 'orcad'
  migrated: boolean
}
