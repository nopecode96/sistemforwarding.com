import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePDFDocument } from "@/components/pdf/InvoicePDFDocument";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> }
) {
  const { tenant: subdomain, id: invoiceId } = await params;

  // 1. Auth check
  const session = await getCurrentSession();
  if (!session || session.subdomain !== subdomain) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // 2. Resolve tenant
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
    select: {
      id: true,
      companyName: true,
      legalName: true,
      logoUrl: true,
      taxId: true,
      settings: true,
    },
  });
  if (!tenant) return new NextResponse("Tenant not found", { status: 404 });

  // 3. Fetch invoice with all relational operational data (LX Pantos standard)
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId: tenant.id },
    include: {
      customer: {
        select: {
          name: true,
          address: true,
          city: true,
          taxId: true,
          phone: true,
          email: true,
          contactPerson: true,
          customerCode: true,
          paymentTermDays: true,
        },
      },
      jobFile: {
        select: {
          id: true,
          jobFileNumber: true,
          bizMode: true,
          bound: true,
          transportMode: true,
          originPort: true,
          destinationPort: true,
          vesselOrFlight: true,
          voyageOrFlightNo: true,
          masterBillOfLading: true,
          houseBillOfLading: true,
          bookingDate: true,
          etd: true,
          eta: true,
          packageCount: true,
          packageType: true,
          grossWeightKg: true,
          volumeWeightCbm: true,
          containerSummary: true,
          commodityDescription: true,
          incoterm: true,
          customerRefNo: true,
          shippingInstructionNo: true,
          commercialInvoiceNo: true,
          billingPartyType: true,
          billingPartyId: true,
          billingParty: { select: { name: true, customerCode: true } },
          incotermRef: { select: { code: true, name: true } },
          originPortRef: { select: { portCode: true, portName: true, city: true, countryCode: true } },
          destinationPortRef: { select: { portCode: true, portName: true, city: true, countryCode: true } },
          cargoDetails: {
            include: {
              unitRef: { select: { unitCode: true, unitName: true } },
              commodityRef: { select: { name: true, hsCode: true } },
            },
          },
        },
      },
      tax: { select: { taxName: true, taxRatePercent: true } },
      currencyRef: { select: { code: true, name: true, symbol: true } },
      items: {
        include: {
          chargeCodeRef: true,
          unitRef: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!invoice) return new NextResponse("Invoice not found", { status: 404 });

  // 4. Logo URL
  const logoAbsoluteUrl =
    tenant.logoUrl && tenant.logoUrl.startsWith("/")
      ? `https://demo1.sistemforwarding.com${tenant.logoUrl}`
      : tenant.logoUrl || null;

  // 5. Bank Remittance & Tenant Profile details (dynamic from Tenant DB settings)
  const tenantSettings = (tenant.settings as Record<string, any>) || {};
  const bankName = tenantSettings.bankName || "-";
  const bankAccountNumber = tenantSettings.bankAccountNumber || "-";
  const bankAccountName = tenantSettings.bankAccountName || tenant.legalName || tenant.companyName;
  const swiftCode = tenantSettings.swiftCode || "-";
  const bankBranch = tenantSettings.bankBranch || "-";
  const tenantAddress = tenantSettings.address || "-";

  // 6. Operational references
  const jf = invoice.jobFile;
  const houseBl = jf?.houseBillOfLading || "-";
  const masterBl = jf?.masterBillOfLading || "-";

  // Cargo specification summary (GWT / CWT / CBM / QTY)
  const gwt = jf?.grossWeightKg ? `${Number(jf.grossWeightKg).toLocaleString("id-ID")} Kg` : "-";
  const cwt = jf?.cargoDetails?.[0]?.chargeableWeight
    ? `${Number(jf.cargoDetails[0].chargeableWeight).toLocaleString("id-ID")} Kg`
    : gwt;
  const cbm = jf?.volumeWeightCbm ? `${Number(jf.volumeWeightCbm).toFixed(3)} CBM` : "-";
  const qty = jf?.packageCount ? `${jf.packageCount} ${jf.packageType || "Koli"}` : "-";

  // First commodity name + HS Code cleanly formatted
  const firstCommodity = jf?.cargoDetails?.[0]?.commodityRef;
  let commodityDisplay = "-";
  if (firstCommodity) {
    if (firstCommodity.name.includes("HS:")) {
      commodityDisplay = firstCommodity.name;
    } else if (firstCommodity.hsCode) {
      commodityDisplay = `${firstCommodity.name} (HS: ${firstCommodity.hsCode})`;
    } else {
      commodityDisplay = firstCommodity.name;
    }
  } else if (jf?.commodityDescription) {
    commodityDisplay = jf.commodityDescription;
  }

  const pdfBuffer = await renderToBuffer(
    InvoicePDFDocument({
      tenant: {
        companyName: tenant.companyName,
        legalName: tenant.legalName || tenant.companyName,
        taxId: tenant.taxId || "-",
        address: tenantAddress,
        logoUrl: logoAbsoluteUrl,
        bankName,
        bankAccountNumber,
        bankAccountName,
        swiftCode,
        bankBranch,
      },
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        currency: invoice.currency,
        subtotal: Number(invoice.subtotal),
        taxAmount: Number(invoice.taxAmount),
        taxRatePercent: Number(invoice.taxRatePercent),
        totalAmount: Number(invoice.totalAmount),
        status: invoice.status,
        cargoSummary: invoice.cargoSummary || null,
        taxName: invoice.tax?.taxName || null,
        notes: invoice.notes || null,
      },
      customer: {
        name: invoice.customer.name,
        address: invoice.customer.address || "-",
        city: invoice.customer.city || "-",
        taxId: invoice.customer.taxId || "-",
        phone: invoice.customer.phone || "-",
        email: invoice.customer.email || "-",
        contactPerson: invoice.customer.contactPerson || "-",
        customerCode: invoice.customer.customerCode,
      },
      operational: jf
        ? {
            jobFileNumber: jf.jobFileNumber,
            customerRefNo: jf.customerRefNo || null,
            shippingInstructionNo: jf.shippingInstructionNo || null,
            commercialInvoiceNo: jf.commercialInvoiceNo || null,
            billingPartyType: jf.billingPartyType?.toString() || null,
            billingPartyName: jf.billingParty?.name || null,
            houseBl,
            masterBl,
            bizMode: (jf.bizMode || jf.transportMode || "AIR").toString(),
            bound: (jf.bound || "EXPORT").toString(),
            originPort: jf.originPort || "-",
            destinationPort: jf.destinationPort || "-",
            vesselOrFlight: jf.vesselOrFlight || "-",
            voyageOrFlightNo: jf.voyageOrFlightNo || "-",
            incoterm: jf.incotermRef?.code || jf.incoterm || "CIF",
            onBoardDate: jf.etd || jf.bookingDate || null,
            arrivalDate: jf.eta || null,
            containerSummary: jf.containerSummary || "-",
            gwt,
            cwt,
            cbm,
            qty,
            commodityDisplay,
            cargoDetails: jf.cargoDetails.map((cd) => ({
              pieces: cd.pieces,
              grossWeight: Number(cd.grossWeight),
              chargeableWeight: Number(cd.chargeableWeight),
              volumeCbm: Number(cd.volumeCbm),
              dimensions:
                cd.length && cd.width && cd.height
                  ? `${cd.length}x${cd.width}x${cd.height} cm`
                  : null,
              unitCode: cd.unitRef?.unitCode || "CTN",
              commodityName: cd.commodityRef?.name || "Cargo",
              hsCode: cd.commodityRef?.hsCode || null,
            })),
          }
        : null,
      items: invoice.items.map((it) => ({
        chargeCode: it.chargeCode || it.chargeCodeRef?.chargeCode || "CHG",
        description: it.description || it.chargeCodeRef?.chargeName || "Freight Charge",
        unit: it.unit || it.unitRef?.unitCode || "CWT",
        quantity: Number(it.quantity),
        rate: Number(it.rate),
        amount: Number(it.amount),
        taxRatePercent: Number(it.taxRatePercent),
        taxAmount: Number(it.taxAmount),
        totalAmount: Number(it.totalAmount),
        currency: it.currency,
      })),
    })
  );

  const safeInvoiceNumber = invoice.invoiceNumber.replace(/\//g, "-");

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeInvoiceNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
