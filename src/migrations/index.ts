import * as migration_20261004_050321_initial from './20261004_050321_initial';
import * as migration_20261005_031311_content_collections from './20261005_031311_content_collections';

export const migrations = [
  {
    up: migration_20261004_050321_initial.up,
    down: migration_20261004_050321_initial.down,
    name: '20261004_050321_initial',
  },
  {
    up: migration_20261005_031311_content_collections.up,
    down: migration_20261005_031311_content_collections.down,
    name: '20261005_031311_content_collections'
  },
];
