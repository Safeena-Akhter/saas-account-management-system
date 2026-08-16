import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123", 12);

  // ============================
  // Super Admin
  // ============================

  let superAdmin = await prisma.user.findFirst({
    where: {
      role: Role.SUPER_ADMIN
    }
  });

  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        name: "Platform Administrator",
        email: "admin@ams.com",
        password: passwordHash,
        role: Role.SUPER_ADMIN,
        isActive: true,
        emailVerifiedAt: new Date(),
        passwordChangedAt: new Date()
      }
    });

    console.log("✅ Super Admin Created");
  }

  // ============================
  // Company
  // ============================

  let company = await prisma.company.findFirst({
    where: {
      name: "Demo Company"
    }
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "Demo Company",
        contactEmail: "owner@demo.com",
        phone: "+92 300 1234567",
        currency: "USD",
        isActive: true
      }
    });

    console.log("✅ Demo Company Created");
  }

  // ============================
  // Users
  // ============================

  const users = [
    {
      name: "Business Owner",
      email: "owner@demo.com",
      role: Role.BUSINESS_OWNER
    },
    {
      name: "Manager",
      email: "manager@demo.com",
      role: Role.MANAGER
    },
    {
      name: "Accountant",
      email: "accountant@demo.com",
      role: Role.ACCOUNTANT
    },
    {
      name: "Employee",
      email: "employee@demo.com",
      role: Role.EMPLOYEE
    }
  ];

  for (const user of users) {
    const exists = await prisma.user.findUnique({
      where: {
        email: user.email
      }
    });

    if (!exists) {
      await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          password: passwordHash,
          role: user.role,
          companyId: company.id,
          isActive: true,
          emailVerifiedAt: new Date(),
          passwordChangedAt: new Date()
        }
      });

      console.log(`✅ ${user.role} Created`);
    }
  }

  // ============================
  // Plans
  // ============================

  const planDefs = [
    {
      name: "Free",
      description: "For solo owners just getting started.",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: ["Up to 2 users", "Basic invoicing", "Community support"],
      maxUsers: 2,
      maxCustomers: 20,
      maxSuppliers: 10,
      maxProducts: 20,
      maxCategories: 10,
      maxInvoices: 10,
      maxMonthlyReports: 3,
      storageLimitMb: 100,
      uploadLimitMb: 5,
      apiRequestLimit: 1000
    },
    {
      name: "Regular",
      description: "For small teams with growing invoice volume.",
      monthlyPrice: 15,
      yearlyPrice: 150,
      features: ["Up to 5 users", "Email support", "Basic reports"],
      maxUsers: 5,
      maxCustomers: 100,
      maxSuppliers: 50,
      maxProducts: 100,
      maxCategories: 30,
      maxInvoices: 100,
      maxMonthlyReports: 20,
      storageLimitMb: 1000,
      uploadLimitMb: 10,
      apiRequestLimit: 5000
    },
    {
      name: "Standard",
      description: "For established businesses that need more room to grow.",
      monthlyPrice: 35,
      yearlyPrice: 350,
      features: ["Up to 15 users", "Priority email support", "Advanced reports", "Custom categories"],
      maxUsers: 15,
      maxCustomers: 500,
      maxSuppliers: 200,
      maxProducts: 500,
      maxCategories: 100,
      maxInvoices: 500,
      maxMonthlyReports: 100,
      storageLimitMb: 5000,
      uploadLimitMb: 25,
      apiRequestLimit: 20000
    },
    {
      name: "Premium",
      description: "For larger companies with no limits on growth.",
      monthlyPrice: 79,
      yearlyPrice: 790,
      features: ["Unlimited users", "24/7 priority support", "All reports", "Custom branding", "API access"],
      maxUsers: null,
      maxCustomers: null,
      maxSuppliers: null,
      maxProducts: null,
      maxCategories: null,
      maxInvoices: null,
      maxMonthlyReports: null,
      storageLimitMb: 50000,
      uploadLimitMb: 100,
      apiRequestLimit: 100000
    }
  ];

  const plans: Record<string, { id: string }> = {};

  for (const planDef of planDefs) {
    let plan = await prisma.plan.findFirst({ where: { name: planDef.name } });

    if (!plan) {
      plan = await prisma.plan.create({ data: planDef });
      console.log(`✅ Plan Created: ${planDef.name}`);
    }

    plans[planDef.name] = plan;
  }

  // Demo Company starts on Standard so its Subscription page (usage bars,
  // expiry, etc.) has something real to show rather than an empty state.
  const existingSubscription = await prisma.companySubscription.findFirst({
    where: { companyId: company.id, status: "ACTIVE" }
  });

  if (!existingSubscription) {
    const startDate = new Date();
    const endDate = new Date(startDate);

    endDate.setFullYear(endDate.getFullYear() + 1);

    await prisma.companySubscription.create({
      data: {
        companyId: company.id,
        planId: plans["Standard"].id,
        billingCycle: "YEARLY",
        status: "ACTIVE",
        startDate,
        endDate
      }
    });

    console.log("✅ Demo Company subscribed to Standard");
  }

  console.log("\n====================================");
  console.log("Dummy Users Created Successfully");
  console.log("====================================");
  console.log("SUPER ADMIN");
  console.log("Email    : admin@ams.com");
  console.log("Password : Admin@123\n");

  console.log("BUSINESS OWNER");
  console.log("Email    : owner@demo.com");
  console.log("Password : Admin@123\n");

  console.log("MANAGER");
  console.log("Email    : manager@demo.com");
  console.log("Password : Admin@123\n");

  console.log("ACCOUNTANT");
  console.log("Email    : accountant@demo.com");
  console.log("Password : Admin@123\n");

  console.log("EMPLOYEE");
  console.log("Email    : employee@demo.com");
  console.log("Password : Admin@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });