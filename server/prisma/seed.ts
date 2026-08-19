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

  // ============================
  // Extra companies with full demo data (respecting each plan's limits)
  // ============================

  const richCompanyDefs = [
    {
      name: "Bright Bakery Co",
      slug: "bakery",
      planName: "Free",
      currency: "USD"
    },
    {
      name: "Skyline Logistics",
      slug: "skyline",
      planName: "Regular",
      currency: "USD"
    },
    {
      name: "Nova Retail Group",
      slug: "nova",
      planName: "Premium",
      currency: "USD"
    }
  ];

  const CATEGORY_NAMES = ["Electronics", "Office Supplies", "Packaging", "Raw Materials", "Services"];
  const EXPENSE_CATEGORY_NAMES = ["Rent", "Utilities", "Salaries", "Marketing"];
  const INCOME_CATEGORY_NAMES = ["Interest", "Refunds", "Misc Sales"];
  const FIRST_NAMES = ["Alex", "Sara", "Omar", "Priya", "Liam", "Noah", "Zara", "Ali", "Emma", "Hassan"];
  const LAST_NAMES = ["Khan", "Ahmed", "Malik", "Smith", "Chen", "Patel", "Ali", "Raza", "Iqbal", "Baig"];

  function cap(desired: number, limit: number | null | undefined) {
    return limit == null ? desired : Math.min(desired, limit);
  }

  function pick<T>(arr: readonly T[], i: number): T {
    return arr[i % arr.length];
  }

  async function seedRichCompany(def: (typeof richCompanyDefs)[number]) {
    const plan = plans[def.planName];

    let rCompany = await prisma.company.findFirst({ where: { name: def.name } });

    if (!rCompany) {
      rCompany = await prisma.company.create({
        data: {
          name: def.name,
          contactEmail: `owner@${def.slug}.com`,
          phone: "+92 300 9876543",
          currency: def.currency,
          isActive: true
        }
      });
      console.log(`✅ Company Created: ${def.name}`);
    }

    // Subscription
    const existingRSub = await prisma.companySubscription.findFirst({
      where: { companyId: rCompany.id, status: "ACTIVE" }
    });

    if (!existingRSub) {
      const startDate = new Date();
      const endDate = new Date(startDate);

      endDate.setFullYear(endDate.getFullYear() + 1);

      await prisma.companySubscription.create({
        data: {
          companyId: rCompany.id,
          planId: plan.id,
          billingCycle: "MONTHLY",
          status: "ACTIVE",
          startDate,
          endDate
        }
      });
      console.log(`✅ ${def.name} subscribed to ${def.planName}`);
    }

    // Skip generating the rest if this company already has invoices (idempotent re-run guard)
    const existingInvoiceCount = await prisma.invoice.count({ where: { companyId: rCompany.id } });

    if (existingInvoiceCount > 0) {
      console.log(`↷ ${def.name} already has demo data, skipping`);
      return;
    }

    const planRow = await prisma.plan.findUnique({ where: { id: plan.id } });

    // ---- Users ----
    const userCount = cap(4, planRow?.maxUsers);
    const roleCycle: (typeof Role)[keyof typeof Role][] = [
      Role.BUSINESS_OWNER,
      Role.MANAGER,
      Role.ACCOUNTANT,
      Role.EMPLOYEE
    ];
    const companyUsers: { id: string }[] = [];

    for (let i = 0; i < userCount; i++) {
      const first = pick(FIRST_NAMES, i + def.slug.length);
      const last = pick(LAST_NAMES, i * 3 + def.slug.length);
      const email = `${first.toLowerCase()}.${last.toLowerCase()}@${def.slug}.com`;

      const existingUser = await prisma.user.findUnique({ where: { email } });

      const u =
        existingUser ??
        (await prisma.user.create({
          data: {
            name: `${first} ${last}`,
            email,
            password: passwordHash,
            role: pick(roleCycle, i),
            companyId: rCompany.id,
            isActive: true,
            emailVerifiedAt: new Date(),
            passwordChangedAt: new Date()
          }
        }));

      companyUsers.push(u);
    }

    console.log(`✅ ${userCount} users created for ${def.name}`);

    // ---- Categories + Products ----
    const categoryCount = cap(4, planRow?.maxCategories);
    const categoryRows: { id: string }[] = [];

    for (let i = 0; i < categoryCount; i++) {
      const cat = await prisma.category.create({
        data: {
          name: pick(CATEGORY_NAMES, i),
          description: `${pick(CATEGORY_NAMES, i)} items for ${def.name}`,
          companyId: rCompany.id,
          isActive: true
        }
      });
      categoryRows.push(cat);
    }

    const productTarget = cap(12, planRow?.maxProducts);
    const productRows: { id: string; price: number }[] = [];

    for (let i = 0; i < productTarget; i++) {
      const price = 10 + ((i * 7) % 90);
      const p = await prisma.product.create({
        data: {
          name: `${def.slug.toUpperCase()}-Product ${i + 1}`,
          sku: `${def.slug.toUpperCase()}-SKU-${1000 + i}`,
          description: `Sample product ${i + 1} for ${def.name}`,
          price,
          costPrice: Math.round(price * 0.6),
          stockQuantity: 20 + (i % 15) * 3,
          companyId: rCompany.id,
          categoryId: pick(categoryRows, i).id,
          isActive: true
        }
      });
      productRows.push({ id: p.id, price });
    }

    console.log(`✅ ${categoryRows.length} categories, ${productRows.length} products created for ${def.name}`);

    // ---- Customers + Suppliers ----
    const customerTarget = cap(10, planRow?.maxCustomers);
    const customerRows: { id: string }[] = [];

    for (let i = 0; i < customerTarget; i++) {
      const first = pick(FIRST_NAMES, i + 2);
      const last = pick(LAST_NAMES, i + 5);
      const c = await prisma.customer.create({
        data: {
          name: `${first} ${last}`,
          email: `${first.toLowerCase()}${i}@customer-${def.slug}.com`,
          phone: `+92 3${(10000000 + i).toString().slice(0, 8)}`,
          address: `${100 + i} Market Street`,
          creditLimit: 500 + i * 50,
          companyId: rCompany.id,
          isActive: true
        }
      });
      customerRows.push(c);
    }

    const supplierTarget = cap(5, planRow?.maxSuppliers);
    const supplierRows: { id: string }[] = [];

    for (let i = 0; i < supplierTarget; i++) {
      const s = await prisma.supplier.create({
        data: {
          name: `${pick(LAST_NAMES, i)} Supplies Ltd`,
          email: `contact${i}@supplier-${def.slug}.com`,
          phone: `+92 3${(20000000 + i).toString().slice(0, 8)}`,
          address: `${200 + i} Industrial Ave`,
          openingBalance: 300 + i * 75,
          companyId: rCompany.id,
          isActive: true
        }
      });
      supplierRows.push(s);
    }

    console.log(`✅ ${customerRows.length} customers, ${supplierRows.length} suppliers created for ${def.name}`);

    // ---- Invoices + Items + Payments ----
    const invoiceTarget = cap(10, planRow?.maxInvoices);
    const statusCycle = ["PAID", "PARTIALLY_PAID", "SENT", "OVERDUE", "DRAFT"] as const;

    for (let i = 0; i < invoiceTarget; i++) {
      const customer = pick(customerRows, i);
      const itemCount = 1 + (i % 3);
      const items: { productId: string; description: string; quantity: number; unitPrice: number; total: number }[] =
        [];
      let subtotal = 0;

      for (let j = 0; j < itemCount; j++) {
        const product = pick(productRows, i + j);
        const quantity = 1 + ((i + j) % 4);
        const total = product.price * quantity;

        items.push({
          productId: product.id,
          description: `Item ${j + 1}`,
          quantity,
          unitPrice: product.price,
          total
        });
        subtotal += total;
      }

      const taxAmount = Math.round(subtotal * 0.05);
      const discountAmount = i % 4 === 0 ? Math.round(subtotal * 0.1) : 0;
      const totalAmount = subtotal + taxAmount - discountAmount;
      const status = pick(statusCycle, i);

      const amountPaid = status === "PAID" ? totalAmount : status === "PARTIALLY_PAID" ? Math.round(totalAmount * 0.5) : 0;

      const issueDate = new Date();

      issueDate.setDate(issueDate.getDate() - (invoiceTarget - i) * 3);

      const dueDate = new Date(issueDate);

      dueDate.setDate(dueDate.getDate() + 14);

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-${def.slug.toUpperCase()}-${1000 + i}`,
          status,
          issueDate,
          dueDate,
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          amountPaid,
          companyId: rCompany.id,
          customerId: customer.id,
          createdByUserId: pick(companyUsers, i).id,
          items: {
            create: items.map(({ productId, description, quantity, unitPrice, total }) => ({
              productId,
              description,
              quantity,
              unitPrice,
              total
            }))
          }
        }
      });

      if (amountPaid > 0) {
        await prisma.payment.create({
          data: {
            amount: amountPaid,
            method: pick(["CASH", "BANK_TRANSFER", "CARD", "ONLINE"] as const, i),
            type: "RECEIVED",
            status: "COMPLETED",
            companyId: rCompany.id,
            invoiceId: invoice.id,
            customerId: customer.id,
            createdByUserId: pick(companyUsers, i).id
          }
        });
      }
    }

    console.log(`✅ ${invoiceTarget} invoices (with items + payments) created for ${def.name}`);

    // ---- Supplier payments ----
    for (let i = 0; i < Math.min(3, supplierRows.length); i++) {
      await prisma.payment.create({
        data: {
          amount: 50 + i * 25,
          method: "BANK_TRANSFER",
          type: "PAID",
          status: "COMPLETED",
          companyId: rCompany.id,
          supplierId: supplierRows[i].id,
          createdByUserId: pick(companyUsers, i).id
        }
      });
    }

    // ---- Expenses ----
    const expenseCategoryRows: { id: string; name: string }[] = [];

    for (let i = 0; i < EXPENSE_CATEGORY_NAMES.length; i++) {
      const ec = await prisma.expenseCategory.create({
        data: {
          name: EXPENSE_CATEGORY_NAMES[i],
          companyId: rCompany.id,
          isActive: true
        }
      });
      expenseCategoryRows.push(ec);
    }

    for (let i = 0; i < 8; i++) {
      const ec = pick(expenseCategoryRows, i);
      const expenseDate = new Date();

      expenseDate.setDate(expenseDate.getDate() - i * 4);

      await prisma.expense.create({
        data: {
          title: `${ec.name} expense ${i + 1}`,
          category: ec.name,
          amount: 40 + i * 15,
          expenseDate,
          paymentMethod: pick(["CASH", "BANK_TRANSFER", "CARD"] as const, i),
          companyId: rCompany.id,
          supplierId: supplierRows.length ? pick(supplierRows, i).id : undefined,
          expenseCategoryId: ec.id,
          createdByUserId: pick(companyUsers, i).id
        }
      });
    }

    console.log(`✅ 8 expenses created for ${def.name}`);

    // ---- Income ----
    const incomeCategoryRows: { id: string; name: string }[] = [];

    for (let i = 0; i < INCOME_CATEGORY_NAMES.length; i++) {
      const ic = await prisma.incomeCategory.create({
        data: {
          name: INCOME_CATEGORY_NAMES[i],
          companyId: rCompany.id,
          isActive: true
        }
      });
      incomeCategoryRows.push(ic);
    }

    for (let i = 0; i < 5; i++) {
      const ic = pick(incomeCategoryRows, i);
      const incomeDate = new Date();

      incomeDate.setDate(incomeDate.getDate() - i * 6);

      await prisma.income.create({
        data: {
          title: `${ic.name} income ${i + 1}`,
          category: ic.name,
          amount: 30 + i * 20,
          incomeDate,
          method: pick(["CASH", "BANK_TRANSFER", "ONLINE"] as const, i),
          companyId: rCompany.id,
          customerId: customerRows.length ? pick(customerRows, i).id : undefined,
          incomeCategoryId: ic.id,
          createdByUserId: pick(companyUsers, i).id
        }
      });
    }

    console.log(`✅ 5 income entries created for ${def.name}`);

    // ---- Notifications ----
    const owner = companyUsers.find((_, i) => roleCycle[i % roleCycle.length] === Role.BUSINESS_OWNER) ?? companyUsers[0];

    const notificationDefs = [
      { type: "INVOICE_CREATED" as const, title: "New Invoice", message: "A new invoice was created." },
      { type: "PAYMENT_RECEIVED" as const, title: "Payment Received", message: "A customer payment was recorded." },
      { type: "LOW_STOCK" as const, title: "Low Stock Alert", message: "A product is running low on stock." },
      { type: "SYSTEM" as const, title: "Welcome", message: `Welcome to AccounTrack, ${def.name}!` }
    ];

    for (const n of notificationDefs) {
      await prisma.notification.create({
        data: {
          type: n.type,
          title: n.title,
          message: n.message,
          companyId: rCompany.id,
          userId: owner.id
        }
      });
    }

    console.log(`✅ Notifications created for ${def.name}\n`);
  }

  for (const def of richCompanyDefs) {
    await seedRichCompany(def);
  }

  console.log("\n====================================");
  console.log("Dummy Users Created Successfully");
  console.log("====================================");
  console.log("SUPER ADMIN");
  console.log("Email    : admin@ams.com");
  console.log("Password : Admin@123\n");

  console.log("BUSINESS OWNER (Demo Company - Standard plan)");
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
  console.log("Password : Admin@123\n");

  console.log("Additional companies (each with their own users, same Admin@123 password):");
  console.log("  - Bright Bakery Co    (Free plan)     e.g. <firstname>.<lastname>@bakery.com");
  console.log("  - Skyline Logistics   (Regular plan)  e.g. <firstname>.<lastname>@skyline.com");
  console.log("  - Nova Retail Group   (Premium plan)  e.g. <firstname>.<lastname>@nova.com");
  console.log("Check the users table for exact generated emails per company.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });