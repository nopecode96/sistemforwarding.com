import {
  PrismaClient,
  UserRole,
  SubscriptionStatus,
  PrefixType,
  VendorCategory,
  JobFileStatus,
  TransportMode,
  ShipmentType,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Updating / Seeding Demo 1 and Demo 2 clients in PostgreSQL...");

  // ==============================================================================
  // 1. DEMO 1: PT. Demo 1 Company (demo1@sistemforwarding.com)
  // ==============================================================================
  const existingTranscargo = await prisma.tenant.findUnique({
    where: { subdomain: "transcargo" },
  });

  let demo1Tenant;
  if (existingTranscargo) {
    demo1Tenant = await prisma.tenant.update({
      where: { id: existingTranscargo.id },
      data: {
        subdomain: "demo1",
        companyName: "PT. Demo 1 Company",
        legalName: "PT. Demo 1 Company",
        taxId: "01.234.567.8-011.000",
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionTier: "ENTERPRISE",
      },
    });
  } else {
    demo1Tenant = await prisma.tenant.upsert({
      where: { subdomain: "demo1" },
      update: {
        companyName: "PT. Demo 1 Company",
        legalName: "PT. Demo 1 Company",
        taxId: "01.234.567.8-011.000",
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionTier: "ENTERPRISE",
      },
      create: {
        subdomain: "demo1",
        companyName: "PT. Demo 1 Company",
        legalName: "PT. Demo 1 Company",
        taxId: "01.234.567.8-011.000",
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionTier: "ENTERPRISE",
      },
    });
  }

  // Demo 1 Admin User
  const existingTranscargoAdmin = await prisma.user.findFirst({
    where: {
      tenantId: demo1Tenant.id,
      email: { in: ["admin@transcargo.com", "demo1@sistemforwarding.com"] },
    },
  });

  if (existingTranscargoAdmin) {
    await prisma.user.update({
      where: { id: existingTranscargoAdmin.id },
      data: {
        email: "demo1@sistemforwarding.com",
        name: "Admin PT Demo 1",
        role: UserRole.TENANT_ADMIN,
        phone: "+628120000001",
      },
    });
  } else {
    await prisma.user.create({
      data: {
        tenantId: demo1Tenant.id,
        email: "demo1@sistemforwarding.com",
        name: "Admin PT Demo 1",
        role: UserRole.TENANT_ADMIN,
        phone: "+628120000001",
      },
    });
  }

  // Operator user for Demo 1
  await prisma.user.updateMany({
    where: {
      tenantId: demo1Tenant.id,
      email: "ops@transcargo.com",
    },
    data: {
      email: "ops@demo1.sistemforwarding.com",
      name: "Operator PT Demo 1",
    },
  });

  // Ensure Demo 1 Master Prefixes
  await prisma.masterPrefix.upsert({
    where: {
      tenantId_prefixType: {
        tenantId: demo1Tenant.id,
        prefixType: PrefixType.JOB_FILE,
      },
    },
    update: {
      prefixCode: "JF",
      description: "Format Standar Job File PT. Demo 1 Company",
    },
    create: {
      tenantId: demo1Tenant.id,
      prefixType: PrefixType.JOB_FILE,
      prefixCode: "JF",
      zeroPadding: 5,
      currentSequence: 3,
      delimiter: "/",
      formatPattern: "{PREFIX}/{YEAR}/{MONTH}/{SEQ}",
      description: "Format Standar Job File PT. Demo 1 Company",
    },
  });

  await prisma.masterPrefix.upsert({
    where: {
      tenantId_prefixType: {
        tenantId: demo1Tenant.id,
        prefixType: PrefixType.INVOICE,
      },
    },
    update: {
      prefixCode: "INV",
      description: "Format Invoice Komersial PT. Demo 1 Company",
    },
    create: {
      tenantId: demo1Tenant.id,
      prefixType: PrefixType.INVOICE,
      prefixCode: "INV",
      zeroPadding: 5,
      currentSequence: 1,
      delimiter: "/",
      formatPattern: "{PREFIX}/{YEAR}/{SEQ}",
      description: "Format Invoice Komersial PT. Demo 1 Company",
    },
  });

  console.log("✅ Demo 1 updated:", demo1Tenant.companyName, "subdomain:", demo1Tenant.subdomain);

  // ==============================================================================
  // 2. DEMO 2: PT. Demo 2 Company (demo2@sistemforwarding.com)
  // ==============================================================================
  const existingPtMaju = await prisma.tenant.findUnique({
    where: { subdomain: "pt-maju" },
  });

  let demo2Tenant;
  if (existingPtMaju) {
    demo2Tenant = await prisma.tenant.update({
      where: { id: existingPtMaju.id },
      data: {
        subdomain: "demo2",
        companyName: "PT. Demo 2 Company",
        legalName: "PT. Demo 2 Company",
        taxId: "02.345.678.9-022.000",
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionTier: "MONTHLY",
      },
    });
  } else {
    demo2Tenant = await prisma.tenant.upsert({
      where: { subdomain: "demo2" },
      update: {
        companyName: "PT. Demo 2 Company",
        legalName: "PT. Demo 2 Company",
        taxId: "02.345.678.9-022.000",
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionTier: "MONTHLY",
      },
      create: {
        subdomain: "demo2",
        companyName: "PT. Demo 2 Company",
        legalName: "PT. Demo 2 Company",
        taxId: "02.345.678.9-022.000",
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionTier: "MONTHLY",
      },
    });
  }

  // Demo 2 Admin User
  const existingMajuAdmin = await prisma.user.findFirst({
    where: {
      tenantId: demo2Tenant.id,
      email: { in: ["bambang@majulogistik.co.id", "demo2@sistemforwarding.com"] },
    },
  });

  if (existingMajuAdmin) {
    await prisma.user.update({
      where: { id: existingMajuAdmin.id },
      data: {
        email: "demo2@sistemforwarding.com",
        name: "Admin PT Demo 2",
        role: UserRole.TENANT_ADMIN,
        phone: "+628120000002",
      },
    });
  } else {
    await prisma.user.create({
      data: {
        tenantId: demo2Tenant.id,
        email: "demo2@sistemforwarding.com",
        name: "Admin PT Demo 2",
        role: UserRole.TENANT_ADMIN,
        phone: "+628120000002",
      },
    });
  }

  // Ensure Demo 2 Master Prefixes
  await prisma.masterPrefix.upsert({
    where: {
      tenantId_prefixType: {
        tenantId: demo2Tenant.id,
        prefixType: PrefixType.JOB_FILE,
      },
    },
    update: {
      prefixCode: "JF",
      description: "Format Standar Job File PT. Demo 2 Company",
    },
    create: {
      tenantId: demo2Tenant.id,
      prefixType: PrefixType.JOB_FILE,
      prefixCode: "JF",
      zeroPadding: 5,
      currentSequence: 2,
      delimiter: "/",
      formatPattern: "{PREFIX}/{YEAR}/{MONTH}/{SEQ}",
      description: "Format Standar Job File PT. Demo 2 Company",
    },
  });

  await prisma.masterPrefix.upsert({
    where: {
      tenantId_prefixType: {
        tenantId: demo2Tenant.id,
        prefixType: PrefixType.INVOICE,
      },
    },
    update: {
      prefixCode: "INV",
      description: "Format Invoice Komersial PT. Demo 2 Company",
    },
    create: {
      tenantId: demo2Tenant.id,
      prefixType: PrefixType.INVOICE,
      prefixCode: "INV",
      zeroPadding: 5,
      currentSequence: 1,
      delimiter: "/",
      formatPattern: "{PREFIX}/{YEAR}/{SEQ}",
      description: "Format Invoice Komersial PT. Demo 2 Company",
    },
  });

  // Ensure Demo 2 has Vendors
  const demo2VendorSea = await prisma.masterVendor.upsert({
    where: {
      tenantId_vendorCode: {
        tenantId: demo2Tenant.id,
        vendorCode: "VND-SEA-001",
      },
    },
    update: {
      name: "Samudera Indonesia Shipping",
      category: VendorCategory.CARRIER_SEA,
    },
    create: {
      tenantId: demo2Tenant.id,
      vendorCode: "VND-SEA-001",
      name: "Samudera Indonesia Shipping",
      category: VendorCategory.CARRIER_SEA,
      contactPerson: "Bpk. Rahmat",
      email: "shipping.booking@samudera.id",
      phone: "+62215309988",
      address: "Gedung Samudera Indonesia, Jl. Letjen S. Parman, Jakarta Barat",
      paymentTermDays: 30,
      bankName: "Bank BCA",
      bankAccountNumber: "2180091234",
      bankAccountHolder: "PT Samudera Indonesia Shipping",
    },
  });

  const demo2VendorAir = await prisma.masterVendor.upsert({
    where: {
      tenantId_vendorCode: {
        tenantId: demo2Tenant.id,
        vendorCode: "VND-AIR-001",
      },
    },
    update: {
      name: "Singapore Airlines Cargo",
      category: VendorCategory.CARRIER_AIR,
    },
    create: {
      tenantId: demo2Tenant.id,
      vendorCode: "VND-AIR-001",
      name: "Singapore Airlines Cargo",
      category: VendorCategory.CARRIER_AIR,
      contactPerson: "Ms. Michelle",
      email: "cargo_cgk@singaporeair.com.sg",
      phone: "+62215591234",
      address: "Terminal Kargo Bandara Soekarno Hatta",
      paymentTermDays: 14,
    },
  });

  // Ensure Demo 2 has Customer
  const demo2Customer = await prisma.masterCustomer.upsert({
    where: {
      tenantId_customerCode: {
        tenantId: demo2Tenant.id,
        customerCode: "CUST-001",
      },
    },
    update: {
      name: "PT Nusantara Furnitur Global",
      contactPerson: "Bpk. Anton Setiawan",
    },
    create: {
      tenantId: demo2Tenant.id,
      customerCode: "CUST-001",
      name: "PT Nusantara Furnitur Global",
      contactPerson: "Bpk. Anton Setiawan",
      email: "anton@nusantarafurnitur.com",
      phone: "+6281312345678",
      address: "Kawasan Industri Kendal Blok B-12, Jawa Tengah",
      city: "Kendal",
      country: "ID",
      taxId: "03.111.222.3-511.000",
      paymentTermDays: 30,
      creditLimit: 300000000,
    },
  });

  // Ensure Demo 2 has Job Files
  await prisma.jobFile.upsert({
    where: {
      tenantId_jobFileNumber: {
        tenantId: demo2Tenant.id,
        jobFileNumber: "JF/2026/10/00001",
      },
    },
    update: {
      status: JobFileStatus.IN_TRANSIT,
    },
    create: {
      tenantId: demo2Tenant.id,
      jobFileNumber: "JF/2026/10/00001",
      customerId: demo2Customer.id,
      vendorId: demo2VendorSea.id,
      status: JobFileStatus.IN_TRANSIT,
      transportMode: TransportMode.SEA,
      shipmentType: ShipmentType.EXPORT,
      incoterm: "FOB",
      originPort: "IDSRG (Tanjung Emas, Semarang)",
      destinationPort: "DEHAM (Port of Hamburg)",
      vesselOrFlight: "CMA CGM LA TRAVIATA",
      voyageOrFlightNo: "V.098W",
      masterBillOfLading: "CMA771293012",
      houseBillOfLading: "D2-EXP-2026-001",
      etd: new Date("2026-10-26T09:00:00Z"),
      atd: new Date("2026-10-26T14:15:00Z"),
      eta: new Date("2026-11-18T10:00:00Z"),
      grossWeightKg: 14200.0,
      volumeWeightCbm: 52.0,
      packageCount: 1,
      packageType: "40HQ",
      containerSummary: "1x40HQ (CMAU1234567)",
      commodityDescription: "Solid Wood Handcrafted Furniture & Home Decor",
      sellingAmount: 58000000,
      buyingAmount: 41200000,
      currency: "IDR",
      remarks: "Export kargo furnitur ke Hamburg via Samudera Indonesia Shipping.",
    },
  });

  await prisma.jobFile.upsert({
    where: {
      tenantId_jobFileNumber: {
        tenantId: demo2Tenant.id,
        jobFileNumber: "JF/2026/10/00002",
      },
    },
    update: {
      status: JobFileStatus.DRAFT,
    },
    create: {
      tenantId: demo2Tenant.id,
      jobFileNumber: "JF/2026/10/00002",
      customerId: demo2Customer.id,
      vendorId: demo2VendorAir.id,
      status: JobFileStatus.DRAFT,
      transportMode: TransportMode.AIR,
      shipmentType: ShipmentType.EXPORT,
      incoterm: "CIF",
      originPort: "IDCGK (Soekarno-Hatta Jakarta)",
      destinationPort: "JFK (New York JFK)",
      vesselOrFlight: "SQ026",
      voyageOrFlightNo: "SQ-26/28OCT",
      masterBillOfLading: "026-98124431",
      houseBillOfLading: "D2-AIR-2026-002",
      etd: new Date("2026-10-30T22:00:00Z"),
      eta: new Date("2026-11-01T06:00:00Z"),
      grossWeightKg: 850.0,
      volumeWeightCbm: 4.8,
      packageCount: 12,
      packageType: "CTN",
      containerSummary: "12 Cartons on 2 Pallets",
      commodityDescription: "Sampel tekstil ekspor ke distributor New York",
      sellingAmount: 34500000,
      buyingAmount: 26000000,
      currency: "IDR",
      remarks: "Pengiriman udara cepat via Singapore Airlines Cargo.",
    },
  });

  console.log("✅ Demo 2 updated:", demo2Tenant.companyName, "subdomain:", demo2Tenant.subdomain);
  console.log("🎉 Berhasil menyelaraskan database Client Demo 1 dan Client Demo 2!");
}

main()
  .catch((e) => {
    console.error("❌ Error updating demo clients:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
