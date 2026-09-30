import * as migration_20260807_083416_baseline from './20260807_083416_baseline';
import * as migration_20260809_061804_add_security_events from './20260809_061804_add_security_events';
import * as migration_20260929_000000_backfill_page_versions from './20260929_000000_backfill_page_versions';

export const migrations = [
  {
    up: migration_20260807_083416_baseline.up,
    down: migration_20260807_083416_baseline.down,
    name: '20260807_083416_baseline',
  },
  {
    up: migration_20260809_061804_add_security_events.up,
    down: migration_20260809_061804_add_security_events.down,
    name: '20260809_061804_add_security_events'
  },
  {
    up: migration_20260929_000000_backfill_page_versions.up,
    down: migration_20260929_000000_backfill_page_versions.down,
    name: '20260929_000000_backfill_page_versions',
  },
];
