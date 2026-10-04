import * as migration_20261004_050321_initial from './20261004_050321_initial';

export const migrations = [
  {
    up: migration_20261004_050321_initial.up,
    down: migration_20261004_050321_initial.down,
    name: '20261004_050321_initial'
  },
];
