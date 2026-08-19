// Mirrors the shape returned by server/src/services/platformSettings.service.ts
// - keep in sync if backend fields change.

export type PlatformSettings = {
  id: string
  platformName: string
  supportEmail: string | null
  supportPhone: string | null
  maintenanceMode: boolean
  updatedAt: string
}

export type UpdatePlatformSettingsInput = Partial<{
  platformName: string
  supportEmail: string | null
  supportPhone: string | null
  maintenanceMode: boolean
}>
