import { z } from "zod";

// GET /platform/users?search=&companyId=&role=&status=&page=&pageSize=
// Platform-wide user list (Super Admin only) - deliberately a separate
// schema from platformCompany.validator.ts's listPlatformCompanyUsersQuerySchema,
// which is scoped to a single company (:id in the URL). This one adds an
// optional companyId filter instead, since there's no single company to
// scope to here - the whole point of this endpoint is cross-tenant
// visibility. SUPER_ADMIN itself (companyId = null) is excluded from the
// result set at the repository level, not filterable in - it's a platform
// operator, not a "user" any company would ever want to see in this list.
export const listPlatformUsersQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  companyId: z.string().trim().optional(),
  role: z.enum(["BUSINESS_OWNER", "MANAGER", "ACCOUNTANT", "EMPLOYEE"]).optional(),
  status: z.enum(["active", "inactive", "all"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export type ListPlatformUsersQuery = z.infer<typeof listPlatformUsersQuerySchema>;
