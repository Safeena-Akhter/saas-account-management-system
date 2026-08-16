import type { NextFunction, Request, Response } from "express";

import * as subscriptionService from "../services/subscription.service";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const subscriptions = await subscriptionService.listSubscriptions();

    res.status(200).json({ subscriptions });
  } catch (err) {
    next(err);
  }
}

export async function assign(req: Request, res: Response, next: NextFunction) {
  try {
    const subscription = await subscriptionService.assignSubscription(req.body);

    res.status(201).json({ subscription });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    await subscriptionService.updateSubscriptionStatus(req.params.id as string, req.body.status);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Business Owner self-service ("Manage Own Subscription"). Every handler
// below reads companyId off `req.user` (populated by requireAuth off the
// verified JWT) - never from params/body - and every route these are
// mounted on goes through requireCompanyScope first (see
// subscription.routes.ts), so `req.user!.companyId` is guaranteed non-null
// here.
// ---------------------------------------------------------------------------

export async function getMine(req: Request, res: Response, next: NextFunction) {
  try {
    const subscription = await subscriptionService.getMySubscription(req.user!.companyId!);

    res.status(200).json({ subscription });
  } catch (err) {
    next(err);
  }
}

export async function getMyUsage(req: Request, res: Response, next: NextFunction) {
  try {
    const usage = await subscriptionService.getMyUsage(req.user!.companyId!);

    res.status(200).json({ usage });
  } catch (err) {
    next(err);
  }
}

export async function getMyHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const subscriptions = await subscriptionService.getMySubscriptionHistory(req.user!.companyId!);

    res.status(200).json({ subscriptions });
  } catch (err) {
    next(err);
  }
}

export async function changeMine(req: Request, res: Response, next: NextFunction) {
  try {
    const subscription = await subscriptionService.changeMySubscription(req.user!.companyId!, req.body);

    res.status(200).json({ subscription });
  } catch (err) {
    next(err);
  }
}

export async function renewMine(req: Request, res: Response, next: NextFunction) {
  try {
    const subscription = await subscriptionService.renewMySubscription(req.user!.companyId!);

    res.status(200).json({ subscription });
  } catch (err) {
    next(err);
  }
}

export async function cancelMine(req: Request, res: Response, next: NextFunction) {
  try {
    await subscriptionService.cancelMySubscription(req.user!.companyId!);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
