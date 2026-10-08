import * as migration_20261004_050321_initial from './20261004_050321_initial'
import * as migration_20261005_031311_content_collections from './20261005_031311_content_collections'
import * as migration_20261005_123719_access_control from './20261005_123719_access_control'
import * as migration_20261006_090527_leads_forms from './20261006_090527_leads_forms'
import * as migration_20261007_025629_private_files from './20261007_025629_private_files'

export const migrations = [
  {
    up: migration_20261004_050321_initial.up,
    down: migration_20261004_050321_initial.down,
    name: '20261004_050321_initial',
  },
  {
    up: migration_20261005_031311_content_collections.up,
    down: migration_20261005_031311_content_collections.down,
    name: '20261005_031311_content_collections',
  },
  {
    up: migration_20261005_123719_access_control.up,
    down: migration_20261005_123719_access_control.down,
    name: '20261005_123719_access_control',
  },
  {
    up: migration_20261006_090527_leads_forms.up,
    down: migration_20261006_090527_leads_forms.down,
    name: '20261006_090527_leads_forms',
  },
  {
    up: migration_20261007_025629_private_files.up,
    down: migration_20261007_025629_private_files.down,
    name: '20261007_025629_private_files',
  },
]
