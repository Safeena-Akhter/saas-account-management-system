import { prisma } from "../config/db";

const SETTINGS_ID = "platform";

// Lazy-init: the row doesn't exist until someone reads or writes it for
// the first time (no seed migration - see the migration.sql comment).
// upsert with an empty `update` on the read path means "create the
// default row if missing, otherwise return it unchanged" in one query.
export function getSettings() {
  return prisma.platformSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID },
    update: {}
  });
}

export type UpdatePlatformSettingsData = Partial<{
  platformName: string;
  supportEmail: string | null;
  supportPhone: string | null;
  maintenanceMode: boolean;
}>;

export function updateSettings(data: UpdatePlatformSettingsData) {
  return prisma.platformSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...data },
    update: data
  });
}

// Used by auth.service.ts's login() to decide whether to block sign-in -
// a plain boolean read, not the full row, so a maintenance-mode check on
// every login doesn't pull columns it doesn't need.
export async function isMaintenanceModeOn() {
  const settings = await prisma.platformSettings.findUnique({
    where: { id: SETTINGS_ID },
    select: { maintenanceMode: true }
  });

  return settings?.maintenanceMode ?? false;
}
