import type { NextFunction, Request, Response } from "express";

import * as platformSettingsService from "../services/platformSettings.service";
import type { UpdatePlatformSettingsInput } from "../validators/platformSettings.validator";

export async function get(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await platformSettingsService.getSettings();

    res.status(200).json({ settings });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as UpdatePlatformSettingsInput;
    const settings = await platformSettingsService.updateSettings(input);

    res.status(200).json({ settings });
  } catch (err) {
    next(err);
  }
}
