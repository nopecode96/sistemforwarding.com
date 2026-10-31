import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";

type SupportedEntity = "customers" | "vendors" | "jobs" | "invoices";

function headerStyle(cell: ExcelJS.Cell) {
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF6D28D9" }, // violet-700
  };
  cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  cell.border = {
    bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
  };
}

function formatIDR(amount: number): string {
  return amount.toLocaleString("id-ID");
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string; entity: string }> }
) {
  const { tenant: subdomain, entity } = await params;

  // ── Auth ───────────────────────────────────────────────────────────────────
  const session = await getCurrentSession();
  if (!session || session.subdomain !== subdomain) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const tenantRecord = await prisma.tenant.findUnique({
    where: { subdomain },
    select: { id: true, companyName: true },
  });
  if (!tenantRecord) return new NextResponse("Tenant not found", { status: 404 });
  const tenantId = tenantRecord.id;

  const supportedEntities: SupportedEntity[] = ["customers", "vendors", "jobs", "invoices"];
  if (!supportedEntities.includes(entity as SupportedEntity)) {
    return new NextResponse("Entity not supported", { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = tenantRecord.companyName;
  workbook.created = new Date();

  const safeEntity = entity as SupportedEntity;

  // ── CUSTOMERS ─────────────────────────────────────────────────────────────
  if (safeEntity === "customers") {
    const customers = await prisma.masterCustomer.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    const sheet = workbook.addWorksheet("Customers");
    const headers = [
      "Kode Customer",
      "Nama Perusahaan",
      "NPWP / Tax ID",
      "PIC / Kontak",
      "Email",
      "No. Telepon",
      "Alamat",
      "TOP (Hari)",
      "Limit Piutang",
      "Status",
      "Tgl. Daftar",
    ];
    const row1 = sheet.addRow(headers);
    row1.eachCell(headerStyle);
    sheet.columns = [
      { key: "code", width: 14 },
      { key: "name", width: 30 },
      { key: "taxId", width: 22 },
      { key: "pic", width: 22 },
      { key: "email", width: 28 },
      { key: "phone", width: 18 },
      { key: "address", width: 35 },
      { key: "top", width: 12 },
      { key: "limit", width: 20 },
      { key: "status", width: 12 },
      { key: "createdAt", width: 16 },
    ];
    customers.forEach((c, i) => {
      const r = sheet.addRow([
        c.customerCode,
        c.name,
        c.taxId || "-",
        c.contactPerson || "-",
        c.email || "-",
        c.phone || "-",
        c.address || "-",
        c.paymentTermDays ?? 30,
        formatIDR(Number(c.creditLimit || 0)),
        c.isActive ? "Aktif" : "Nonaktif",
        formatDate(c.createdAt),
      ]);
      if (i % 2 === 1) {
        r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      }
    });
    sheet.addRow([]);
    sheet.addRow([`Total: ${customers.length} customers`]);
  }

  // ── VENDORS ──────────────────────────────────────────────────────────────
  if (safeEntity === "vendors") {
    const vendors = await prisma.masterVendor.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    const sheet = workbook.addWorksheet("Vendors");
    const headers = [
      "Kode Vendor",
      "Nama Vendor",
      "Kategori",
      "NPWP",
      "PIC / Kontak",
      "Email",
      "No. Telepon",
      "Status",
      "Tgl. Daftar",
    ];
    const row1 = sheet.addRow(headers);
    row1.eachCell(headerStyle);
    sheet.columns = [
      { key: "code", width: 14 },
      { key: "name", width: 30 },
      { key: "category", width: 18 },
      { key: "taxId", width: 22 },
      { key: "pic", width: 22 },
      { key: "email", width: 28 },
      { key: "phone", width: 18 },
      { key: "status", width: 12 },
      { key: "createdAt", width: 16 },
    ];
    vendors.forEach((v, i) => {
      const r = sheet.addRow([
        v.vendorCode || "-",
        v.name,
        v.category || "-",
        v.taxId || "-",
        v.contactPerson || "-",
        v.email || "-",
        v.phone || "-",
        v.isActive ? "Aktif" : "Nonaktif",
        formatDate(v.createdAt),
      ]);
      if (i % 2 === 1) {
        r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      }
    });
    sheet.addRow([]);
    sheet.addRow([`Total: ${vendors.length} vendors`]);
  }

  // ── JOBS ─────────────────────────────────────────────────────────────────
  if (safeEntity === "jobs") {
    const jobs = await prisma.jobFile.findMany({
      where: { tenantId },
      include: {
        customer: { select: { name: true, customerCode: true } },
        vendor: { select: { name: true } },
        incotermRef: { select: { code: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const sheet = workbook.addWorksheet("Job Files");
    const headers = [
      "No. Job File",
      "Tgl. Buat",
      "Status",
      "Moda",
      "Bound",
      "Customer",
      "Vendor / Carrier",
      "POL",
      "POD",
      "Vessel / Flight",
      "No. BL/AWB",
      "Incoterm",
      "Koli",
      "GW (Kg)",
      "CBM",
      "Nilai Jual (Rp)",
      "Nilai Beli (Rp)",
      "Gross Profit (Rp)",
      "Margin (%)",
    ];
    const row1 = sheet.addRow(headers);
    row1.eachCell(headerStyle);
    sheet.columns = Array(headers.length).fill({ width: 18 });
    sheet.getColumn(1).width = 22;
    sheet.getColumn(5).width = 14;
    sheet.getColumn(8).width = 25;

    jobs.forEach((j, i) => {
      const selling = Number(j.sellingAmount) || 0;
      const buying = Number(j.buyingAmount) || 0;
      const profit = selling - buying;
      const margin = selling > 0 ? ((profit / selling) * 100).toFixed(1) + "%" : "0%";

      const blAwb = j.houseBillOfLading || j.masterBillOfLading || "-";

      const r = sheet.addRow([
        j.jobFileNumber,
        formatDate(j.createdAt),
        j.status,
        j.bizMode || j.transportMode,
        j.bound || j.shipmentType,
        j.customer.name,
        j.vendor?.name || "-",
        j.originPort || "-",
        j.destinationPort || "-",
        j.vesselOrFlight || "-",
        blAwb,
        j.incotermRef?.code || j.incoterm || "-",
        j.packageCount ?? 0,
        Number(j.grossWeightKg) || 0,
        Number(j.volumeWeightCbm) || 0,
        formatIDR(selling),
        formatIDR(buying),
        formatIDR(profit),
        margin,
      ]);
      if (i % 2 === 1) {
        r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      }
    });
    sheet.addRow([]);
    sheet.addRow([
      `Total: ${jobs.length} job files`,
      "", "", "", "", "", "", "", "", "", "", "", "", "", "",
      `Rp ${formatIDR(jobs.reduce((s, j) => s + Number(j.sellingAmount), 0))}`,
      `Rp ${formatIDR(jobs.reduce((s, j) => s + Number(j.buyingAmount), 0))}`,
      `Rp ${formatIDR(jobs.reduce((s, j) => s + (Number(j.sellingAmount) - Number(j.buyingAmount)), 0))}`,
    ]);
  }

  // ── INVOICES ─────────────────────────────────────────────────────────────
  if (safeEntity === "invoices") {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId },
      include: {
        customer: { select: { name: true, customerCode: true } },
        jobFile: { select: { jobFileNumber: true } },
        tax: { select: { taxName: true, taxRatePercent: true } },
      },
      orderBy: { invoiceDate: "desc" },
    });

    const sheet = workbook.addWorksheet("Invoices");
    const headers = [
      "No. Invoice",
      "Tgl. Invoice",
      "Jatuh Tempo",
      "Status",
      "Customer",
      "Ref. Job File",
      "Mata Uang",
      "Subtotal",
      "Pajak",
      "Total Tagihan",
      "Tgl. Lunas",
      "Metode Bayar",
    ];
    const row1 = sheet.addRow(headers);
    row1.eachCell(headerStyle);
    sheet.columns = [
      { key: "invNo", width: 22 },
      { key: "invDate", width: 16 },
      { key: "dueDate", width: 16 },
      { key: "status", width: 12 },
      { key: "customer", width: 30 },
      { key: "jobFile", width: 22 },
      { key: "currency", width: 12 },
      { key: "subtotal", width: 20 },
      { key: "tax", width: 18 },
      { key: "total", width: 22 },
      { key: "paidAt", width: 16 },
      { key: "payMethod", width: 20 },
    ];

    let totalAmount = 0;
    invoices.forEach((inv, i) => {
      const total = Number(inv.totalAmount) || 0;
      totalAmount += total;
      const now = new Date();
      const due = new Date(inv.dueDate);
      const isOverdue = inv.status !== "PAID" && due < now;

      const r = sheet.addRow([
        inv.invoiceNumber,
        formatDate(inv.invoiceDate),
        formatDate(inv.dueDate),
        isOverdue ? "OVERDUE" : inv.status,
        inv.customer.name,
        inv.jobFile?.jobFileNumber || "-",
        inv.currency,
        formatIDR(Number(inv.subtotal)),
        formatIDR(Number(inv.taxAmount)),
        formatIDR(total),
        formatDate(inv.paidAt),
        inv.paymentMethod || "-",
      ]);

      if (i % 2 === 1) {
        r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      }

      // Highlight overdue
      if (isOverdue) {
        r.getCell(4).font = { bold: true, color: { argb: "FFDC2626" } };
      }
    });
    sheet.addRow([]);
    const summaryRow = sheet.addRow([
      `Total: ${invoices.length} invoices`,
      "", "", "", "", "", "",
      "", "",
      `Rp ${formatIDR(totalAmount)}`,
    ]);
    summaryRow.font = { bold: true };
  }

  // ── Output XLSX ──────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();

  const today = new Date().toISOString().slice(0, 10);
  const filename = `${safeEntity}-${subdomain}-${today}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
