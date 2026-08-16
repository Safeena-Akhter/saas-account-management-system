import { prisma } from "../config/db";
import type { UpdateCompanyProfileInput } from "../validators/company.validator";

export function findCompanyById(companyId: string) {
  return prisma.company.findUnique({ where: { id: companyId } });
}

export function updateCompanyProfile(companyId: string, data: UpdateCompanyProfileInput) {
  return prisma.company.update({
    where: { id: companyId },
    data
  });
}

export function updateCompanyLogo(companyId: string, logoUrl: string) {
  return prisma.company.update({
    where: { id: companyId },
    data: { logoUrl }
  });
}

// Super Admin's "Assign Plan" / "View All Company Subscriptions" screens
// need a company picker - this is deliberately just id+name+isActive, not
// the full Company Management platform module (that's still a roadmap
// item, see client/src/data/navigation/sidebarMenu.ts's
// ROLE_ROADMAP_MODULES.SUPER_ADMIN). Kept minimal on purpose: this exists
// to unblock "which company am I assigning a plan to", nothing more.
export function findAllCompaniesDirectory() {
  return prisma.company.findMany({
    select: { id: true, name: true, isActive: true },
    orderBy: { name: "asc" }
  });
}
