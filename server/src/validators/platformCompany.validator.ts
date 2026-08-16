import { z } from "zod";

// GET /platform/companies?search=&status=&planId=&dateFrom=&dateTo=&sortBy=&sortOrder=&page=&pageSize=
export const listPlatformCompaniesQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  // "all" (the default) intentionally still excludes soft-deleted
  // companies - deleted companies never appear in this list at all,
  // regardless of status filter (see platformCompany.repository.ts).
  status: z.enum(["active", "suspended", "all"]).default("all"),
  planId: z.string().trim().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(["name", "createdAt", "users"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

// GET /platform/companies/:id/users?search=&role=&status=&page=&pageSize=
export const listPlatformCompanyUsersQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  role: z.enum(["BUSINESS_OWNER", "MANAGER", "ACCOUNTANT", "EMPLOYEE"]).optional(),
  status: z.enum(["active", "inactive", "all"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export type ListPlatformCompaniesQuery = z.infer<typeof listPlatformCompaniesQuerySchema>;
export type ListPlatformCompanyUsersQuery = z.infer<typeof listPlatformCompanyUsersQuerySchema>;
