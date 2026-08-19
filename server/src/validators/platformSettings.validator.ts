import { z } from "zod";

export const updatePlatformSettingsSchema = z.object({
  platformName: z.string().trim().min(1, "Platform name is required").max(191).optional(),
  supportEmail: z.string().trim().email("Enter a valid email").max(191).nullable().optional(),
  supportPhone: z.string().trim().max(30).nullable().optional(),
  maintenanceMode: z.boolean().optional()
});

export type UpdatePlatformSettingsInput = z.infer<typeof updatePlatformSettingsSchema>;
