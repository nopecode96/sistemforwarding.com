export const dynamic = "force-dynamic";

import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MasterDataView } from "@/components/tenant/MasterDataView";

interface MasterPageProps {
  params: Promise<{
    tenant: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function TenantMasterPage({ params, searchParams }: MasterPageProps) {
  const { tenant: subdomain } = await params;
  const { tab } = await searchParams;

  // 1. Verify tenant existence in database
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
    select: {
      id: true,
      subdomain: true,
      companyName: true,
    },
  });

  if (!tenant) {
    notFound();
  }

  // 2. Fetch purely master reference datasets from PostgreSQL
  // Note: Customer and Vendor have their own dedicated sidebar pages (/customers & /vendors)
  const [ports, units, itemTypes, prefixes, currencies, provinces, globalCarriers, dictionaries] = await Promise.all([
    prisma.masterPort.findMany({
      take: 100,
      orderBy: { portCode: "asc" },
    }),
    prisma.masterUnit.findMany({
      orderBy: [{ unitCategory: "asc" }, { unitCode: "asc" }],
    }),
    prisma.masterItemType.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.masterPrefix.findMany({
      where: { tenantId: tenant.id },
      orderBy: { prefixType: "asc" },
    }),
    prisma.masterCurrency.findMany({
      where: {
        OR: [{ tenantId: tenant.id }, { tenantId: null }],
        isActive: true,
      },
      orderBy: { isBaseCurrency: "desc" },
    }),
    prisma.masterProvince.findMany({
      orderBy: { name: "asc" },
      include: {
        cities: {
          orderBy: { name: "asc" },
          include: {
            districts: {
              orderBy: { name: "asc" },
            },
          },
        },
      },
    }),
    prisma.globalCarrier.findMany({
      where: { isActive: true },
      orderBy: [{ mode: "asc" }, { carrierCode: "asc" }],
    }),
    prisma.systemDictionary.findMany({
      where: {
        OR: [{ tenantId: tenant.id }, { tenantId: null }],
        isActive: true,
      },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Mengambil Data Master Referensi Operasional...
          </p>
        </div>
      }
    >
      <MasterDataView
        tenantSubdomain={tenant.subdomain}
        companyName={tenant.companyName}
        initialTab={tab}
        ports={ports}
        units={units.map((u) => ({
          ...u,
          maxWeightKg: u.maxWeightKg ? Number(u.maxWeightKg) : null,
          maxVolumeCbm: u.maxVolumeCbm ? Number(u.maxVolumeCbm) : null,
          tareWeightKg: u.tareWeightKg ? Number(u.tareWeightKg) : null,
          lengthM: u.lengthM ? Number(u.lengthM) : null,
          widthM: u.widthM ? Number(u.widthM) : null,
          heightM: u.heightM ? Number(u.heightM) : null,
        }))}
        itemTypes={itemTypes.map((it) => ({
          ...it,
          minTemperature: it.minTemperature ? Number(it.minTemperature) : null,
          maxTemperature: it.maxTemperature ? Number(it.maxTemperature) : null,
        }))}
        prefixes={prefixes}
        currencies={currencies.map((c) => ({
          ...c,
          exchangeRate: Number(c.exchangeRate),
        }))}
        provinces={provinces.map((p) => ({
          id: p.id,
          code: p.code || "-",
          name: p.name,
          isActive: p.isActive,
          cities: p.cities.map((c) => ({
            id: c.id,
            provinceId: c.provinceId,
            code: c.code || "-",
            name: c.name,
            type: c.type,
            isActive: c.isActive,
            districts: c.districts.map((d) => ({
              id: d.id,
              cityId: d.cityId,
              code: d.code || "-",
              name: d.name,
              isActive: d.isActive,
            })),
          })),
        }))}
        globalCarriers={globalCarriers}
        dictionaries={dictionaries}
      />
    </Suspense>
  );
}
