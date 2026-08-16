// Mirrors the shape returned by server/src/services/company.service.ts's
// toPublicCompany() - keep these in sync if backend fields change.
export type Company = {
  id: string
  name: string
  logoUrl: string | null
  address: string | null
  phone: string | null
  contactEmail: string | null
  taxNumber: string | null
  currency: string
  isActive: boolean
  createdAt: string
}

export type CompanyDirectoryEntry = {
  id: string
  name: string
  isActive: boolean
}

export type UpdateCompanyProfileInput = Partial<{
  name: string
  logoUrl: string | null
  address: string | null
  phone: string | null
  contactEmail: string | null
  taxNumber: string | null
  currency: string
}>
