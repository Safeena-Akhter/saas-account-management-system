-- AlterTable: Plan - split single price+billingCycle into monthlyPrice +
-- yearlyPrice (billing cycle moves to the subscription - see below), adds
-- description, and adds the 10 structured usage limits from the Feature
-- Limits section of the module spec (all nullable = unlimited). `features`
-- upgrades from a single delimited VARCHAR to a JSON array - added here as
-- a new column and swapped in at the end, rather than MODIFY COLUMN in
-- place, since arbitrary free text in the old column is not guaranteed to
-- already be valid JSON.
ALTER TABLE `plans`
  ADD COLUMN `description` VARCHAR(500) NULL,
  ADD COLUMN `monthlyPrice` DECIMAL(10, 2) NULL,
  ADD COLUMN `yearlyPrice` DECIMAL(10, 2) NULL,
  ADD COLUMN `maxUsers` INTEGER NULL,
  ADD COLUMN `maxCustomers` INTEGER NULL,
  ADD COLUMN `maxSuppliers` INTEGER NULL,
  ADD COLUMN `maxProducts` INTEGER NULL,
  ADD COLUMN `maxCategories` INTEGER NULL,
  ADD COLUMN `maxInvoices` INTEGER NULL,
  ADD COLUMN `maxMonthlyReports` INTEGER NULL,
  ADD COLUMN `storageLimitMb` INTEGER NULL,
  ADD COLUMN `uploadLimitMb` INTEGER NULL,
  ADD COLUMN `apiRequestLimit` INTEGER NULL,
  ADD COLUMN `featuresJson` JSON NULL;

-- Backfill: best-effort carry-over for any plan row created before this
-- migration (a fresh install has none - prisma/seed.ts does not create any
-- Plan rows, so this UPDATE affects 0 rows there). A MONTHLY plan keeps its
-- price as monthlyPrice and gets 10x as yearlyPrice (the common "2 months
-- free" convention); a YEARLY plan keeps its price as yearlyPrice and gets
-- price/10 as monthlyPrice. Old free-text `features` becomes a
-- single-element JSON array so nothing already entered is silently lost.
UPDATE `plans`
SET
  `monthlyPrice` = CASE WHEN `billingCycle` = 'MONTHLY' THEN `price` ELSE ROUND(`price` / 10, 2) END,
  `yearlyPrice` = CASE WHEN `billingCycle` = 'YEARLY' THEN `price` ELSE ROUND(`price` * 10, 2) END,
  `featuresJson` = CASE WHEN `features` IS NOT NULL AND `features` != '' THEN JSON_ARRAY(`features`) ELSE NULL END;

-- Now that every existing row (if any) has been backfilled above, the two
-- price columns can be made required.
ALTER TABLE `plans`
  MODIFY COLUMN `monthlyPrice` DECIMAL(10, 2) NOT NULL,
  MODIFY COLUMN `yearlyPrice` DECIMAL(10, 2) NOT NULL;

-- Drop the old single-price/cycle/text-features columns now that their
-- data has been carried over, and swap the new JSON column into the
-- `features` name.
ALTER TABLE `plans`
  DROP COLUMN `price`,
  DROP COLUMN `billingCycle`,
  DROP COLUMN `features`;

ALTER TABLE `plans`
  CHANGE COLUMN `featuresJson` `features` JSON NULL;

-- AlterTable: CompanySubscription now records which billing cycle the
-- company chose for their plan (see the comment on Plan above for why this
-- moved off Plan). Existing subscription rows (if any) default to MONTHLY.
ALTER TABLE `company_subscriptions`
  ADD COLUMN `billingCycle` ENUM('MONTHLY', 'YEARLY') NOT NULL DEFAULT 'MONTHLY';
