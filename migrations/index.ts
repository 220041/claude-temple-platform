import * as migration_20260807_083416_baseline from './20260807_083416_baseline';
import * as migration_20260809_061804_add_security_events from './20260809_061804_add_security_events';
import * as migration_20260929_000000_backfill_page_versions from './20260929_000000_backfill_page_versions';
import * as migration_20260930_024255_site_settings_and_homepage_fields from './20260930_024255_site_settings_and_homepage_fields';
import * as migration_20260930_025640_add_logo_tagline from './20260930_025640_add_logo_tagline';
import * as migration_20260930_025806_add_affiliation from './20260930_025806_add_affiliation';
import * as migration_20260930_030000_backfill_hanonbonglimsa_site_settings from './20260930_030000_backfill_hanonbonglimsa_site_settings';
import * as migration_20260930_032801_pages_slug_history from './20260930_032801_pages_slug_history';
import * as migration_20260930_033121_main_menu_global from './20260930_033121_main_menu_global';
import * as migration_20260930_034000_backfill_main_menu from './20260930_034000_backfill_main_menu';
import * as migration_20260930_051705_boards_boardkey_to_text from './20260930_051705_boards_boardkey_to_text';
import * as migration_20260930_051834_boards_type_and_approval_fields from './20260930_051834_boards_type_and_approval_fields';
import * as migration_20261001_003821_posts_moderation_status from './20261001_003821_posts_moderation_status';
import * as migration_20261001_044119_site_settings_homepage_toggle from './20261001_044119_site_settings_homepage_toggle';
import * as migration_20261001_045158_home_page_section_order from './20261001_045158_home_page_section_order';
import * as migration_20261001_050634_home_page_versions from './20261001_050634_home_page_versions';

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
    name: '20260930_030000_backfill_hanonbonglimsa_site_settings',
  },
  {
    up: migration_20260930_032801_pages_slug_history.up,
    down: migration_20260930_032801_pages_slug_history.down,
    name: '20260930_032801_pages_slug_history',
  },
  {
    up: migration_20260930_033121_main_menu_global.up,
    down: migration_20260930_033121_main_menu_global.down,
    name: '20260930_033121_main_menu_global',
  },
  {
    up: migration_20260930_034000_backfill_main_menu.up,
    down: migration_20260930_034000_backfill_main_menu.down,
    name: '20260930_034000_backfill_main_menu',
  },
  {
    up: migration_20260930_051705_boards_boardkey_to_text.up,
    down: migration_20260930_051705_boards_boardkey_to_text.down,
    name: '20260930_051705_boards_boardkey_to_text',
  },
  {
    up: migration_20260930_051834_boards_type_and_approval_fields.up,
    down: migration_20260930_051834_boards_type_and_approval_fields.down,
    name: '20260930_051834_boards_type_and_approval_fields',
  },
  {
    up: migration_20261001_003821_posts_moderation_status.up,
    down: migration_20261001_003821_posts_moderation_status.down,
    name: '20261001_003821_posts_moderation_status',
  },
  {
    up: migration_20261001_044119_site_settings_homepage_toggle.up,
    down: migration_20261001_044119_site_settings_homepage_toggle.down,
    name: '20261001_044119_site_settings_homepage_toggle',
  },
  {
    up: migration_20261001_045158_home_page_section_order.up,
    down: migration_20261001_045158_home_page_section_order.down,
    name: '20261001_045158_home_page_section_order',
  },
  {
    up: migration_20261001_050634_home_page_versions.up,
    down: migration_20261001_050634_home_page_versions.down,
    name: '20261001_050634_home_page_versions'
  },
];
