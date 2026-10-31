import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";

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

function headerStyle(cell: ExcelJS.Cell) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> }
) {
  const { tenant: subdomain } = await params;
  const { searchParams } = req.nextUrl;
  const reportType = searchParams.get("type") || "pl"; // "pl" | "aging"

  // ── Auth ────────────────────────────────────────────────────────────────
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

  const workbook = new ExcelJS.Workbook();
  workbook.creator = tenantRecord.companyName;
  workbook.created = new Date();

  const today = new Date().toISOString().slice(0, 10);
  let filename = `report-${today}.xlsx`;

  // ── P&L REPORT ──────────────────────────────────────────────────────────
  if (reportType === "pl") {
    const jobs = await prisma.jobFile.findMany({
      where: { tenantId },
      select: {
        createdAt: true,
        bizMode: true,
        transportMode: true,
        sellingAmount: true,
        buyingAmount: true,
        status: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by year-month
    const monthMap = new Map<
      string,
      { sea: number; seaCost: number; air: number; airCost: number; inland: number; inlandCost: number }
    >();

    jobs.forEach((j) => {
      const d = new Date(j.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, { sea: 0, seaCost: 0, air: 0, airCost: 0, inland: 0, inlandCost: 0 });
      }
      const m = monthMap.get(key)!;
      const mode = (j.bizMode || j.transportMode || "SEA").toString().toUpperCase();
      const sell = Number(j.sellingAmount) || 0;
      const buy = Number(j.buyingAmount) || 0;

      if (mode === "AIR") {
        m.air += sell;
        m.airCost += buy;
      } else if (mode === "INLAND") {
        m.inland += sell;
        m.inlandCost += buy;
      } else {
        m.sea += sell;
        m.seaCost += buy;
      }
    });

    const sheet = workbook.addWorksheet("Laba Rugi (P&L)");

    // Title
    sheet.mergeCells("A1:L1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = `LAPORAN LABA RUGI (GROSS MARGIN) — ${tenantRecord.companyName}`;
    titleCell.font = { bold: true, size: 13, color: { argb: "FF6D28D9" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).height = 28;

    sheet.mergeCells("A2:L2");
    sheet.getCell("A2").value = `Digenerate: ${today}`;
    sheet.getCell("A2").font = { size: 8, color: { argb: "FF94A3B8" } };
    sheet.getCell("A2").alignment = { horizontal: "center" };
    sheet.addRow([]);

    const headers = [
      "Bulan",
      "Revenue Laut", "HPP Laut", "Profit Laut",
      "Revenue Udara", "HPP Udara", "Profit Udara",
      "Revenue Inland", "HPP Inland", "Profit Inland",
      "Total Revenue", "Total HPP", "Total Profit", "Margin (%)",
    ];
    const hRow = sheet.addRow(headers);
    hRow.eachCell(headerStyle);
    sheet.columns = [
      { key: "month", width: 14 },
      { key: "seaRev", width: 18 }, { key: "seaCost", width: 18 }, { key: "seaProfit", width: 18 },
      { key: "airRev", width: 18 }, { key: "airCost", width: 18 }, { key: "airProfit", width: 18 },
      { key: "inlandRev", width: 18 }, { key: "inlandCost", width: 18 }, { key: "inlandProfit", width: 18 },
      { key: "totalRev", width: 20 }, { key: "totalCost", width: 20 }, { key: "totalProfit", width: 20 },
      { key: "margin", width: 12 },
    ];

    let grandRev = 0, grandCost = 0;
    Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([month, m], i) => {
        const seaP = m.sea - m.seaCost;
        const airP = m.air - m.airCost;
        const inlandP = m.inland - m.inlandCost;
        const totalRev = m.sea + m.air + m.inland;
        const totalCost = m.seaCost + m.airCost + m.inlandCost;
        const totalProfit = totalRev - totalCost;
        const margin = totalRev > 0 ? ((totalProfit / totalRev) * 100).toFixed(1) + "%" : "0%";

        grandRev += totalRev;
        grandCost += totalCost;

        const r = sheet.addRow([
          month,
          formatIDR(m.sea), formatIDR(m.seaCost), formatIDR(seaP),
          formatIDR(m.air), formatIDR(m.airCost), formatIDR(airP),
          formatIDR(m.inland), formatIDR(m.inlandCost), formatIDR(inlandP),
          formatIDR(totalRev), formatIDR(totalCost), formatIDR(totalProfit),
          margin,
        ]);

        if (i % 2 === 1) {
          r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
        }

        // Color profit cells
        const profitCells = [4, 7, 10, 13];
        profitCells.forEach((col) => {
          const val = r.getCell(col).value as string;
          const num = parseFloat(val?.toString().replace(/\./g, "").replace(",", ".") || "0");
          if (num < 0) {
            r.getCell(col).font = { color: { argb: "FFDC2626" } };
          } else if (num > 0) {
            r.getCell(col).font = { color: { argb: "FF16A34A" } };
          }
        });
      });

    // Grand total row
    const grandProfit = grandRev - grandCost;
    const grandMargin = grandRev > 0 ? ((grandProfit / grandRev) * 100).toFixed(1) + "%" : "0%";
    const grandRow = sheet.addRow([
      "TOTAL",
      "", "", "",
      "", "", "",
      "", "", "",
      formatIDR(grandRev), formatIDR(grandCost), formatIDR(grandProfit), grandMargin,
    ]);
    grandRow.font = { bold: true };
    grandRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEDE9FE" } };

    filename = `laporan-pl-${subdomain}-${today}.xlsx`;
  }

  // ── AR AGING REPORT ──────────────────────────────────────────────────────
  if (reportType === "aging") {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId, status: { not: "PAID" } },
      include: {
        customer: { select: { name: true, customerCode: true, phone: true } },
        jobFile: { select: { jobFileNumber: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    const sheet = workbook.addWorksheet("AR Aging (Tagihan Jatuh Tempo)");

    // Title
    sheet.mergeCells("A1:I1");
    sheet.getCell("A1").value = `REKAP TAGIHAN JATUH TEMPO (AR AGING) — ${tenantRecord.companyName}`;
    sheet.getCell("A1").font = { bold: true, size: 13, color: { argb: "FFDC2626" } };
    sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).height = 28;
    sheet.mergeCells("A2:I2");
    sheet.getCell("A2").value = `Per tanggal: ${today}`;
    sheet.getCell("A2").font = { size: 8, color: { argb: "FF94A3B8" } };
    sheet.getCell("A2").alignment = { horizontal: "center" };
    sheet.addRow([]);

    const headers = [
      "No. Invoice",
      "Customer",
      "Kode",
      "Telepon",
      "Ref. Job File",
      "Tgl. Invoice",
      "Jatuh Tempo",
      "Hari Terlambat",
      "Total Tagihan (Rp)",
    ];
    const hRow = sheet.addRow(headers);
    hRow.eachCell(headerStyle);
    sheet.columns = [
      { key: "invNo", width: 22 },
      { key: "customer", width: 30 },
      { key: "code", width: 14 },
      { key: "phone", width: 18 },
      { key: "jobFile", width: 22 },
      { key: "invDate", width: 16 },
      { key: "dueDate", width: 16 },
      { key: "daysOverdue", width: 16 },
      { key: "total", width: 22 },
    ];

    const now = new Date();
    let grandTotal = 0;

    invoices.forEach((inv, i) => {
      const due = new Date(inv.dueDate);
      const daysOverdue = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      const total = Number(inv.totalAmount) || 0;
      grandTotal += total;

      const r = sheet.addRow([
        inv.invoiceNumber,
        inv.customer.name,
        inv.customer.customerCode,
        inv.customer.phone || "-",
        inv.jobFile?.jobFileNumber || "-",
        formatDate(inv.invoiceDate),
        formatDate(inv.dueDate),
        daysOverdue > 0 ? `${daysOverdue} hari` : "Belum jatuh tempo",
        formatIDR(total),
      ]);

      if (daysOverdue > 30) {
        r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
        r.font = { color: { argb: "FFDC2626" } };
      } else if (daysOverdue > 0) {
        r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
        r.font = { color: { argb: "FFD97706" } };
      } else if (i % 2 === 1) {
        r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      }
    });

    sheet.addRow([]);
    const summaryRow = sheet.addRow([
      `Total: ${invoices.length} invoice belum lunas`,
      "", "", "", "", "", "", "",
      formatIDR(grandTotal),
    ]);
    summaryRow.font = { bold: true };
    summaryRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };

    filename = `ar-aging-${subdomain}-${today}.xlsx`;
  }

  const buffer = await workbook.xlsx.writeBuffer();

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
