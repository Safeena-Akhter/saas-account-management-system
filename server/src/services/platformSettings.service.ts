import * as platformSettingsRepository from "../repositories/platformSettings.repository";
import type { UpdatePlatformSettingsInput } from "../validators/platformSettings.validator";

export function getSettings() {
  return platformSettingsRepository.getSettings();
}

export function updateSettings(input: UpdatePlatformSettingsInput) {
  return platformSettingsRepository.updateSettings(input);
}
