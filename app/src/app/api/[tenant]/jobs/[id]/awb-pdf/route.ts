import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { AwbPDFDocument } from "@/components/pdf/AwbPDFDocument";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> }
) {
  const { tenant: subdomain, id: jobFileId } = await params;

  // Auth check
  const session = await getCurrentSession();
  if (!session || session.subdomain !== subdomain) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Resolve tenant
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
    select: { id: true, companyName: true, legalName: true, logoUrl: true, taxId: true, settings: true },
  });
  if (!tenant) return new NextResponse("Tenant not found", { status: 404 });

  // Fetch job file with all relations
  const job = await prisma.jobFile.findFirst({
    where: { id: jobFileId, tenantId: tenant.id },
    include: {
      customer: {
        select: {
          name: true,
          address: true,
          city: true,
          country: true,
          postalCode: true,
          taxId: true,
          phone: true,
          email: true,
          contactPerson: true,
          customerCode: true,
        },
      },
      vendor: {
        select: {
          name: true,
          vendorCode: true,
          category: true,
          address: true,
          city: true,
          country: true,
          phone: true,
          iataPrefix: true,
        },
      },
      originPortRef: true,
      destinationPortRef: true,
      transitPortRef: true,
      incotermRef: true,
      itemTypeRef: true,
      packageUnitRef: true,
      containerUnitRef: true,
      invoices: {
        select: {
          invoiceNumber: true,
          subtotal: true,
          taxAmount: true,
          totalAmount: true,
          currency: true,
          taxRatePercent: true,
          items: {
            include: {
              chargeCodeRef: true,
              unitRef: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      cargoDetails: {
        include: {
          unitRef: { select: { unitCode: true, unitName: true } },
          commodityRef: { select: { name: true, hsCode: true } },
        },
      },
    },
  });

  if (!job) return new NextResponse("Job File not found", { status: 404 });

  const tenantSettings = (tenant.settings as Record<string, any>) || {};
  const tenantCity = tenantSettings.city || "INDONESIA";
  const tenantIataCode = tenantSettings.iataCode || null;
  const tenantAccountNo = tenantSettings.accountNo || null;

  const logoAbsoluteUrl =
    tenant.logoUrl && tenant.logoUrl.startsWith("/")
      ? `https://demo1.sistemforwarding.com${tenant.logoUrl}`
      : tenant.logoUrl || null;

  const blOrAwbNumber = job.houseBillOfLading || job.masterBillOfLading || "-";
  const masterBlNumber = job.masterBillOfLading || "-";
  const isAir = job.bizMode === "AIR" || job.transportMode === "AIR";

  const latestInvoice = job.invoices[0] || null;

  const pdfBuffer = await renderToBuffer(
    AwbPDFDocument({
      tenant: {
        companyName: tenant.companyName,
        legalName: tenant.legalName || tenant.companyName,
        taxId: tenant.taxId || "-",
        logoUrl: logoAbsoluteUrl,
        city: tenantCity,
        iataCode: tenantIataCode,
        accountNo: tenantAccountNo,
      },
      job: {
        jobFileNumber: job.jobFileNumber,
        blOrAwbNumber,
        masterBlNumber,
        houseBlNumber: job.houseBillOfLading || "-",
        status: job.status,
        transportMode: job.transportMode,
        bizMode: job.bizMode?.toString() || null,
        bound: job.bound?.toString() || null,
        originPortCode: job.originPortRef?.portCode || (job.originPort.match(/^[A-Z]{3,5}/) ? job.originPort.match(/^[A-Z]{3,5}/)![0] : "CGK"),
        destinationPortCode: job.destinationPortRef?.portCode || (job.destinationPort.match(/^[A-Z]{3,5}/) ? job.destinationPort.match(/^[A-Z]{3,5}/)![0] : "SIN"),
        originPort: job.originPortRef?.portCode
          ? `${job.originPortRef.portCode} - ${job.originPortRef.portName}`
          : job.originPort || "-",
        destinationPort: job.destinationPortRef?.portCode
          ? `${job.destinationPortRef.portCode} - ${job.destinationPortRef.portName}`
          : job.destinationPort || "-",
        vesselOrFlight: job.vesselOrFlight || "-",
        voyageOrFlightNumber: job.voyageOrFlightNo || "-",
        incoterm: job.incotermRef
          ? `${job.incotermRef.code} - ${job.incotermRef.name}`
          : job.incoterm || "-",
        packageCount: job.packageCount || 0,
        packageType: job.packageType || "-",
        grossWeightKg: Number(job.grossWeightKg) || 0,
        chargeableWeightKg:
          job.cargoDetails.length > 0 && job.cargoDetails[0]?.chargeableWeight
            ? Number(job.cargoDetails[0].chargeableWeight)
            : Number(job.grossWeightKg) || 0,
        volumeWeightCbm: Number(job.volumeWeightCbm) || 0,
        containerNumber: job.containerSummary || "-",
        containerCount: job.containerCount || 1,
        sealNumber: "-",
        commodityDescription: job.commodityDescription || null,
        sellingAmount: Number(job.sellingAmount),
        buyingAmount: Number(job.buyingAmount),
        currency: job.currency || "IDR",
        createdAt: job.createdAt,
        etdDate: job.etd || null,
        etaDate: job.eta || null,
        remarks: job.remarks || null,
        consigneeName: job.consigneeName || null,
        consigneeAddress: job.consigneeAddress || null,
        consigneeCity: job.consigneeCity || null,
        consigneeCountry: job.consigneeCountry || null,
        consigneePhone: job.consigneePhone || null,
        consigneePostalCode: job.consigneePostalCode || null,
        consigneeTaxId: job.consigneeTaxId || null,
        consigneeAccountNo: job.consigneeAccountNo || null,
        notifyParty: job.notifyParty || null,
        transitPort: job.transitPort || null,
        transitPortCode: job.transitPortRef?.portCode || (job.transitPort ? job.transitPort.substring(0, 3).toUpperCase() : null),
        secondCarrier: job.secondCarrier || null,
        connectingFlightNo: job.connectingFlightNo || null,
        paymentTermMode: job.paymentTermMode || "PP",
        declaredValueCarriage: job.declaredValueCarriage || "NVD",
        declaredValueCustoms: job.declaredValueCustoms || "NCV",
        insuranceAmount: job.insuranceAmount || "NIL",
        handlingInformation: job.handlingInformation || null,
        vendorIataPrefix: job.vendor?.iataPrefix || null,
        customerRefNo: job.customerRefNo || null,
        shippingInstructionNo: job.shippingInstructionNo || null,
        commercialInvoiceNo: job.commercialInvoiceNo || null,
        billingPartyType: job.billingPartyType?.toString() || null,
        invoice: latestInvoice
          ? {
              invoiceNumber: latestInvoice.invoiceNumber,
              subtotal: Number(latestInvoice.subtotal),
              taxAmount: Number(latestInvoice.taxAmount),
              totalAmount: Number(latestInvoice.totalAmount),
              currency: latestInvoice.currency,
              items: latestInvoice.items.map((it) => ({
                chargeCode: it.chargeCode || it.chargeCodeRef?.chargeCode || "CHG",
                description: it.description || it.chargeCodeRef?.chargeName || "Charge",
                unit: it.unit || it.unitRef?.unitCode || "CWT",
                quantity: Number(it.quantity),
                rate: Number(it.rate),
                amount: Number(it.amount),
                taxRatePercent: Number(it.taxRatePercent),
                taxAmount: Number(it.taxAmount),
                totalAmount: Number(it.totalAmount),
                currency: it.currency,
              })),
            }
          : null,
        cargoDetails: job.cargoDetails.map((cd) => ({
          pieces: cd.pieces,
          grossWeight: Number(cd.grossWeight),
          chargeableWeight: Number(cd.chargeableWeight),
          volumeCbm: Number(cd.volumeCbm),
          length: cd.length ? Number(cd.length) : null,
          width: cd.width ? Number(cd.width) : null,
          height: cd.height ? Number(cd.height) : null,
          unitCode: cd.unitRef?.unitCode || "-",
          unitName: cd.unitRef?.unitName || "-",
          commodityName: cd.commodityRef?.name || cd.description || "-",
          hsCode: cd.commodityRef?.hsCode || null,
          description: cd.description || null,
        })),
      },
      customer: {
        customerCode: job.customer.customerCode,
        name: job.customer.name,
        address: job.customer.address || "-",
        city: job.customer.city || "-",
        country: job.customer.country || "ID",
        postalCode: job.customer.postalCode || "-",
        taxId: job.customer.taxId || "-",
        phone: job.customer.phone || "-",
        email: job.customer.email || "-",
        contactPerson: job.customer.contactPerson || "-",
      },
      vendor: job.vendor
        ? {
            name: job.vendor.name,
            code: job.vendor.vendorCode || "-",
            category: job.vendor.category || "-",
            address: job.vendor.address || "-",
            city: job.vendor.city || "-",
            country: job.vendor.country || "-",
            phone: job.vendor.phone || "-",
          }
        : null,
    })
  );

  const safeJobNumber = job.jobFileNumber.replace(/\//g, "-");
  const filePrefix = isAir ? "AWB" : "BL";

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filePrefix}-${safeJobNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
