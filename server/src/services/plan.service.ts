import {
  createPlan as createPlanRow,
  deletePlan as deletePlanRow,
  findActivePlans,
  findAllPlans,
  findPlanById,
  setPlanActive,
  updatePlan as updatePlanRow
} from "../repositories/plan.repository";
import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import type { CreatePlanInput, UpdatePlanInput } from "../validators/plan.validator";

// Super Admin's plan-management screen - every plan, active or not.
export function listPlans() {
  return findAllPlans();
}

// The pricing/upgrade screen every other role sees - active plans only.
export function listActivePlans() {
  return findActivePlans();
}

export function createPlan(input: CreatePlanInput) {
  return createPlanRow(input);
}

export async function updatePlan(planId: string, input: UpdatePlanInput) {
  const result = await updatePlanRow(planId, input);

  if (result.count === 0) {
    throw new AppError("Plan not found", 404);
  }

  return findPlanById(planId);
}

async function setActive(planId: string, isActive: boolean) {
  const result = await setPlanActive(planId, isActive);

  if (result.count === 0) {
    throw new AppError("Plan not found", 404);
  }

  return findPlanById(planId);
}

// Separate from the general updatePlan() above (which also accepts
// isActive) so the Super Admin UI can wire a single "Activate"/
// "Deactivate" action button straight to an intent-named endpoint rather
// than constructing a partial-update payload for a one-field toggle - see
// plan.routes.ts's dedicated /:id/activate and /:id/deactivate routes.
export function activatePlan(planId: string) {
  return setActive(planId, true);
}

export function deactivatePlan(planId: string) {
  return setActive(planId, false);
}

export async function deletePlan(planId: string) {
  const plan = await findPlanById(planId);

  if (!plan) {
    throw new AppError("Plan not found", 404);
  }

  // Checked up front rather than letting the FK RESTRICT throw: a company's
  // subscription history must never be able to point at a deleted plan.
  const subscriptionCount = await prisma.companySubscription.count({ where: { planId } });

  if (subscriptionCount > 0) {
    throw new AppError("This plan has company subscriptions and cannot be deleted. Deactivate it instead.", 409);
  }

  await deletePlanRow(planId);
}
