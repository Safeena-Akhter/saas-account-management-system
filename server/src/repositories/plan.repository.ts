import { Prisma } from "@prisma/client";

import { prisma } from "../config/db";
import type { CreatePlanInput, UpdatePlanInput } from "../validators/plan.validator";

export function findAllPlans() {
  return prisma.plan.findMany({ orderBy: { monthlyPrice: "asc" } });
}

// Powers the pricing page for a Business Owner choosing/upgrading a plan -
// inactive plans (retired, no longer sold) are excluded, unlike
// findAllPlans() above which the Super Admin plan-management screen uses
// and deliberately needs to see everything, active or not.
export function findActivePlans() {
  return prisma.plan.findMany({ where: { isActive: true }, orderBy: { monthlyPrice: "asc" } });
}

export function findPlanById(id: string) {
  return prisma.plan.findUnique({ where: { id } });
}

// Used once, by subscription.service.ts's assignFreePlanToNewCompany() -
// every brand-new company is auto-subscribed to the plan named "Free" (see
// prisma/seed.ts's planDefs) right after signup, the same plan a Super
// Admin would otherwise have to assign by hand.
export function findPlanByName(name: string) {
  return prisma.plan.findFirst({ where: { name } });
}

// `features` is a nullable Json column. Prisma treats a plain JS `null`
// here as ambiguous (it can't tell "set this JSON column to SQL NULL" from
// "field omitted"), so an explicit `null` from the validated input is
// mapped to Prisma.DbNull - the sentinel that actually means "no value" for
// a nullable Json column (as opposed to Prisma.JsonNull, which would store
// the JSON literal `null` rather than a SQL NULL - not what "no features
// entered" should mean here). `undefined` (field omitted) passes through
// untouched so update()'s partial-field semantics still work normally.
function toPrismaFeatures(features: string[] | null | undefined) {
  if (features === null) {
    return Prisma.DbNull;
  }

  return features;
}

export function createPlan(data: CreatePlanInput) {
  return prisma.plan.create({ data: { ...data, features: toPrismaFeatures(data.features) } });
}

export function updatePlan(id: string, data: UpdatePlanInput) {
  return prisma.plan.updateMany({ where: { id }, data: { ...data, features: toPrismaFeatures(data.features) } });
}

export function setPlanActive(id: string, isActive: boolean) {
  return prisma.plan.updateMany({ where: { id }, data: { isActive } });
}

export function deletePlan(id: string) {
  return prisma.plan.deleteMany({ where: { id } });
}
