import { cloudinary } from "../config/cloudinary";
import { findAllCompaniesDirectory, findCompanyById, updateCompanyLogo, updateCompanyProfile } from "../repositories/company.repository";
import { AppError } from "../utils/AppError";
import { createForCompany, notifyOrIgnore } from "./notification.service";
import type { UpdateCompanyProfileInput } from "../validators/company.validator";

function toPublicCompany(company: {
  id: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  contactEmail: string | null;
  taxNumber: string | null;
  currency: string;
  isActive: boolean;
  createdAt: Date;
}) {
  return {
    id: company.id,
    name: company.name,
    logoUrl: company.logoUrl,
    address: company.address,
    phone: company.phone,
    contactEmail: company.contactEmail,
    taxNumber: company.taxNumber,
    currency: company.currency,
    isActive: company.isActive,
    createdAt: company.createdAt
  };
}

// `companyId` here always comes from `req.user.companyId` (a verified JWT
// claim), never from a route param or the request body - that's what makes
// this "my own company" rather than "any company by id". There is no
// `getCompanyById(:id)` in this module on purpose; cross-company lookups
// belong to the future Super Admin panel, gated by `requireRole("SUPER_ADMIN")`.
export async function getMyCompany(companyId: string) {
  const company = await findCompanyById(companyId);

  if (!company) {
    throw new AppError("Company not found", 404);
  }

  return toPublicCompany(company);
}

export async function updateMyCompany(companyId: string, input: UpdateCompanyProfileInput, actorUserId?: string) {
  const company = await updateCompanyProfile(companyId, input);

  // Broadcast to everyone else in the company - Employees/Accountants who
  // can't edit the profile themselves still see, e.g., a changed currency
  // or tax number reflected in their own workflows.
  void notifyOrIgnore(() =>
    createForCompany(
      companyId,
      {
        type: "COMPANY_UPDATED",
        title: "Company profile updated",
        message: "Your company's profile settings were updated.",
        link: "/company/settings"
      },
      actorUserId
    )
  );

  return toPublicCompany(company);
}

// Streams the buffer multer already parsed into memory (see
// upload.middleware.ts) straight to Cloudinary - the file never touches this
// server's disk. Cloudinary's returned `secure_url` becomes the company's
// `logoUrl`, replacing whatever was there before.
function uploadBufferToCloudinary(buffer: Buffer, companyId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ams/company-logos",
        public_id: companyId,
        overwrite: true,
        resource_type: "image"
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
}

export async function uploadCompanyLogo(companyId: string, file?: Express.Multer.File, actorUserId?: string) {
  if (!file) {
    throw new AppError("No logo file was uploaded", 422);
  }

  let logoUrl: string;

  try {
    logoUrl = await uploadBufferToCloudinary(file.buffer, companyId);
  } catch (err) {
    // See the matching comment in user.service.ts's updateMyAvatar - logged
    // for the same reason: this 502 alone doesn't say whether it's a real
    // outage or missing/invalid CLOUDINARY_* env vars.
    console.error("Company logo upload to Cloudinary failed:", err);
    throw new AppError("Could not upload logo, please try again", 502);
  }

  const company = await updateCompanyLogo(companyId, logoUrl);

  void notifyOrIgnore(() =>
    createForCompany(
      companyId,
      {
        type: "COMPANY_UPDATED",
        title: "Company logo updated",
        message: "Your company's logo was updated.",
        link: "/company/settings"
      },
      actorUserId
    )
  );

  return toPublicCompany(company);
}

// Super Admin's company picker for the Assign Plan / Company Subscriptions
// screens - see findAllCompaniesDirectory's comment for why this is
// intentionally minimal rather than the full platform Company Management
// module.
export function listCompaniesDirectory() {
  return findAllCompaniesDirectory();
}
