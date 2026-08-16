-- AlterTable: Company gains soft-delete support, same `deletedAt` pattern
-- already used by Invoice. A hard DELETE on companies is not safe here -
-- User.company (and every other Company relation) has no `onDelete`
-- specified, which means MySQL's default RESTRICT: deleting a company with
-- any existing user/invoice/etc. would simply fail with a foreign-key
-- violation. Super Admin's "Delete Company" action (see
-- platformCompany.service.ts) sets this column instead of ever issuing a
-- real DELETE.
ALTER TABLE `companies`
  ADD COLUMN `deletedAt` DATETIME(3) NULL;

CREATE INDEX `companies_deletedAt_idx` ON `companies`(`deletedAt`);
