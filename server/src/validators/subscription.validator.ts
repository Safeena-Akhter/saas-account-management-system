import { z } from "zod";

export const assignSubscriptionSchema = z.object({
  companyId: z.string().trim().min(1, "Company is required"),
  planId: z.string().trim().min(1, "Plan is required"),
  // Which of the plan's two prices (Plan.monthlyPrice / Plan.yearlyPrice)
  // this subscription is paying under - see the comment on
  // CompanySubscription.billingCycle in schema.prisma for why this lives
  // on the subscription rather than the plan.
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date({ message: "End date is required" })
});

export const updateSubscriptionStatusSchema = z.object({
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED"])
});

// Business Owner self-service: switch their own company to a different
// plan (upgrade or downgrade - same operation either direction, the
// service layer doesn't need to know which since it's just "assign a new
// plan"). Deliberately narrower than assignSubscriptionSchema above: no
// companyId (taken from the authenticated actor, never the body - see
// subscription.controller.ts's changeMine), no startDate/endDate (the
// service computes those from "now" + the plan's billing cycle, same as a
// renewal would).
export const changeMySubscriptionSchema = z.object({
  planId: z.string().trim().min(1, "Plan is required"),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY")
});

export type AssignSubscriptionInput = z.infer<typeof assignSubscriptionSchema>;
export type UpdateSubscriptionStatusInput = z.infer<typeof updateSubscriptionStatusSchema>;
export type ChangeMySubscriptionInput = z.infer<typeof changeMySubscriptionSchema>;
