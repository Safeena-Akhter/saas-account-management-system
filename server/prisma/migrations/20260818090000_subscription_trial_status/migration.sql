-- AlterTable: CompanySubscription.status gains a TRIAL value, alongside
-- the existing ACTIVE/EXPIRED/CANCELLED. MySQL enums are stored inline on
-- the column (no separate CREATE TYPE, unlike Postgres) - see the `role`
-- and other ENUM(...) columns in 20260723090254_init/migration.sql - so
-- adding a value is a MODIFY COLUMN listing every value again, existing
-- data included. This is purely additive: every row currently has
-- ACTIVE/EXPIRED/CANCELLED, none of which are removed or renamed, so no
-- existing data is affected or at risk.
ALTER TABLE `company_subscriptions`
  MODIFY COLUMN `status` ENUM('ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE';
