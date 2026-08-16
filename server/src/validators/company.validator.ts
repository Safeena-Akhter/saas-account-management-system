import { z } from "zod";

// Company profile is read-only for anyone in the company (any authenticated
// role can GET it - see rbac.middleware usage in company.routes.ts) but only
// BUSINESS_OWNER can update it (enforced by requireRole in company.routes.ts,
// not here - this schema only validates shape).
export const updateCompanyProfileSchema = z.object({
  name: z.string().trim().min(2, "Business name must be at least 2 characters").max(150).optional(),
  // `logoUrl` can still be set directly here (e.g. pasting an existing
  // hosted URL), but the normal path is POST /companies/me/logo, which
  // uploads the file to Cloudinary and writes the resulting URL itself -
  // see company.controller.ts's uploadCompanyLogo.
  logoUrl: z.string().trim().url("Logo must be a valid URL").max(2048).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  contactEmail: z.string().trim().toLowerCase().email("Please enter a valid email address").nullable().optional(),
  taxNumber: z.string().trim().max(100).nullable().optional(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, "Currency must be a 3-letter ISO code, e.g. USD, PKR")
    .optional()
});

export type UpdateCompanyProfileInput = z.infer<typeof updateCompanyProfileSchema>;
