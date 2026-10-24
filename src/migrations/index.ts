import * as migration_20261004_050321_initial from './20261004_050321_initial'
import * as migration_20261005_031311_content_collections from './20261005_031311_content_collections'
import * as migration_20261005_123719_access_control from './20261005_123719_access_control'
import * as migration_20261006_090527_leads_forms from './20261006_090527_leads_forms'
import * as migration_20261007_025629_private_files from './20261007_025629_private_files'
import * as migration_20261008_022007_payment_backend from './20261008_022007_payment_backend'
import * as migration_20261009_030050_package_payment_entitlements from './20261009_030050_package_payment_entitlements'
import * as migration_20261010_124840_customer_auth from './20261010_124840_customer_auth'
import * as migration_20261012_122924_workshop_reminders from './20261012_122924_workshop_reminders'
import * as migration_20261012_161015_trial_reminders from './20261012_161015_trial_reminders'
import * as migration_20261013_015236_tracker_and_nudges from './20261013_015236_tracker_and_nudges'
import * as migration_20261013_083641_sepay_transaction_id from './20261013_083641_sepay_transaction_id'
import * as migration_20261014_095212_account_deletion from './20261014_095212_account_deletion'
import * as migration_20261014_122224_trial_usage from './20261014_122224_trial_usage'
import * as migration_20261015_023402_eq_cards_q17 from './20261015_023402_eq_cards_q17'
import * as migration_20261015_092239_saved_cards_unique from './20261015_092239_saved_cards_unique'
import * as migration_20261016_063717_customer_session_version from './20261016_063717_customer_session_version'
import * as migration_20261016_113859_reminder_emails_opt_out from './20261016_113859_reminder_emails_opt_out'
import * as migration_20261017_083454_sitemap_v2_schema from './20261017_083454_sitemap_v2_schema'
import * as migration_20261018_020000_sitemap_v2_paths from './20261018_020000_sitemap_v2_paths'
import * as migration_20261020_031337_sm07_page_templates from './20261020_031337_sm07_page_templates'
import * as migration_20261020_075400_sm08_page_templates from './20261020_075400_sm08_page_templates'
import * as migration_20261021_012851_hb02_journey_28 from './20261021_012851_hb02_journey_28'
import * as migration_20261023_093308_hb03_plan_fields from './20261023_093308_hb03_plan_fields'

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
  {
    up: migration_20261008_022007_payment_backend.up,
    down: migration_20261008_022007_payment_backend.down,
    name: '20261008_022007_payment_backend',
  },
  {
    up: migration_20261009_030050_package_payment_entitlements.up,
    down: migration_20261009_030050_package_payment_entitlements.down,
    name: '20261009_030050_package_payment_entitlements',
  },
  {
    up: migration_20261010_124840_customer_auth.up,
    down: migration_20261010_124840_customer_auth.down,
    name: '20261010_124840_customer_auth',
  },
  {
    up: migration_20261012_122924_workshop_reminders.up,
    down: migration_20261012_122924_workshop_reminders.down,
    name: '20261012_122924_workshop_reminders',
  },
  {
    up: migration_20261012_161015_trial_reminders.up,
    down: migration_20261012_161015_trial_reminders.down,
    name: '20261012_161015_trial_reminders',
  },
  {
    up: migration_20261013_015236_tracker_and_nudges.up,
    down: migration_20261013_015236_tracker_and_nudges.down,
    name: '20261013_015236_tracker_and_nudges',
  },
  {
    up: migration_20261013_083641_sepay_transaction_id.up,
    down: migration_20261013_083641_sepay_transaction_id.down,
    name: '20261013_083641_sepay_transaction_id',
  },
  {
    up: migration_20261014_095212_account_deletion.up,
    down: migration_20261014_095212_account_deletion.down,
    name: '20261014_095212_account_deletion',
  },
  {
    up: migration_20261014_122224_trial_usage.up,
    down: migration_20261014_122224_trial_usage.down,
    name: '20261014_122224_trial_usage',
  },
  {
    up: migration_20261015_023402_eq_cards_q17.up,
    down: migration_20261015_023402_eq_cards_q17.down,
    name: '20261015_023402_eq_cards_q17',
  },
  {
    up: migration_20261015_092239_saved_cards_unique.up,
    down: migration_20261015_092239_saved_cards_unique.down,
    name: '20261015_092239_saved_cards_unique',
  },
  {
    up: migration_20261016_063717_customer_session_version.up,
    down: migration_20261016_063717_customer_session_version.down,
    name: '20261016_063717_customer_session_version',
  },
  {
    up: migration_20261016_113859_reminder_emails_opt_out.up,
    down: migration_20261016_113859_reminder_emails_opt_out.down,
    name: '20261016_113859_reminder_emails_opt_out',
  },
  {
    up: migration_20261017_083454_sitemap_v2_schema.up,
    down: migration_20261017_083454_sitemap_v2_schema.down,
    name: '20261017_083454_sitemap_v2_schema',
  },
  {
    up: migration_20261018_020000_sitemap_v2_paths.up,
    down: migration_20261018_020000_sitemap_v2_paths.down,
    name: '20261018_020000_sitemap_v2_paths',
  },
  {
    up: migration_20261020_031337_sm07_page_templates.up,
    down: migration_20261020_031337_sm07_page_templates.down,
    name: '20261020_031337_sm07_page_templates',
  },
  {
    up: migration_20261020_075400_sm08_page_templates.up,
    down: migration_20261020_075400_sm08_page_templates.down,
    name: '20261020_075400_sm08_page_templates',
  },
  {
    up: migration_20261021_012851_hb02_journey_28.up,
    down: migration_20261021_012851_hb02_journey_28.down,
    name: '20261021_012851_hb02_journey_28',
  },
  {
    up: migration_20261023_093308_hb03_plan_fields.up,
    down: migration_20261023_093308_hb03_plan_fields.down,
    name: '20261023_093308_hb03_plan_fields',
  },
]
