import * as migration_20260807_083416_baseline from './20260807_083416_baseline';
import * as migration_20260809_061804_add_security_events from './20260809_061804_add_security_events';
import * as migration_20260929_000000_backfill_page_versions from './20260929_000000_backfill_page_versions';
import * as migration_20260930_024255_site_settings_and_homepage_fields from './20260930_024255_site_settings_and_homepage_fields';
import * as migration_20260930_025640_add_logo_tagline from './20260930_025640_add_logo_tagline';
import * as migration_20260930_025806_add_affiliation from './20260930_025806_add_affiliation';
import * as migration_20260930_030000_backfill_hanonbonglimsa_site_settings from './20260930_030000_backfill_hanonbonglimsa_site_settings';

export const migrations = [
  {
    up: migration_20260807_083416_baseline.up,
    down: migration_20260807_083416_baseline.down,
    name: '20260807_083416_baseline',
  },
  {
    up: migration_20260809_061804_add_security_events.up,
    down: migration_20260809_061804_add_security_events.down,
    name: '20260809_061804_add_security_events',
  },
  {
    up: migration_20260929_000000_backfill_page_versions.up,
    down: migration_20260929_000000_backfill_page_versions.down,
    name: '20260929_000000_backfill_page_versions',
  },
  {
    up: migration_20260930_024255_site_settings_and_homepage_fields.up,
    down: migration_20260930_024255_site_settings_and_homepage_fields.down,
    name: '20260930_024255_site_settings_and_homepage_fields',
  },
  {
    up: migration_20260930_025640_add_logo_tagline.up,
    down: migration_20260930_025640_add_logo_tagline.down,
    name: '20260930_025640_add_logo_tagline',
  },
  {
    up: migration_20260930_025806_add_affiliation.up,
    down: migration_20260930_025806_add_affiliation.down,
    name: '20260930_025806_add_affiliation',
  },
  {
    up: migration_20260930_030000_backfill_hanonbonglimsa_site_settings.up,
    down: migration_20260930_030000_backfill_hanonbonglimsa_site_settings.down,
    name: '20260930_030000_backfill_hanonbonglimsa_site_settings'
  },
];
