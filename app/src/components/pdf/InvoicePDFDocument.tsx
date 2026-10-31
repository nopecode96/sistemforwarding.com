import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// ─── Styles (Engineered to Prevent Overlaps & Mirror Enterprise Standards) ────
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#0f172a",
    padding: "24 32 30 32",
    backgroundColor: "#ffffff",
  },
  // Header Top
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: "#0f172a",
  },
  logoBlock: {
    flexDirection: "row",
    alignItems: "center",
    width: "70%",
    gap: 10,
  },
  logo: { width: 85, height: 38, objectFit: "contain" },
  tenantInfo: {
    flex: 1,
    paddingLeft: 6,
  },
  companyName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  companyDetail: { fontSize: 7, color: "#475569", marginTop: 1 },

  // Big Invoice Title
  titleBlock: {
    width: "30%",
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    letterSpacing: 2,
  },
  invoiceSubtitle: { fontSize: 7, color: "#64748b", marginTop: 1 },

  // Parties & Metadata 2-Column Section
  twoColSection: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  partyBox: {
    flex: 1.2,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    overflow: "hidden",
  },
  metaBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    overflow: "hidden",
  },
  boxHeader: {
    backgroundColor: "#f1f5f9",
    padding: "4 8",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  boxHeaderText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textTransform: "uppercase",
  },
  boxBody: {
    padding: "6 8",
  },
  partyName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 2 },
  partyAddress: { fontSize: 7.5, color: "#334155", lineHeight: 1.25, marginBottom: 3 },
  partyVat: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  partyAttn: { fontSize: 7.5, color: "#475569", marginTop: 2 },

  // Meta Table Key-Values
  metaGrid: {
    gap: 3,
  },
  metaGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaGridLabel: {
    fontSize: 7,
    color: "#64748b",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    width: "40%",
  },
  metaGridValue: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    width: "60%",
    textAlign: "right",
  },

  // Operational Reference Grid (LX Pantos Style)
  operationalSection: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  opRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  opRowLast: {
    flexDirection: "row",
  },
  opCell: {
    padding: "4 6",
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
  },
  opCellLast: {
    padding: "4 6",
  },
  opLabel: {
    fontSize: 6.5,
    color: "#64748b",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 1,
  },
  opValue: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },

  // Itemized Charges Table
  table: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    padding: "5 6",
    alignItems: "center",
  },
  thText: {
    color: "#ffffff",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    padding: "5 6",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    alignItems: "flex-start",
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc",
  },
  tdText: {
    fontSize: 7.5,
    color: "#0f172a",
  },
  tdTextBold: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },

  // Table Column Widths (Structured to Guarantee No Text Overlap)
  colDesc: { width: "34%" },
  colPer: { width: "7%", textAlign: "center" },
  colQty: { width: "9%", textAlign: "right" },
  colCurr: { width: "6%", textAlign: "center" },
  colRate: { width: "12%", textAlign: "right" },
  colVatRate: { width: "8%", textAlign: "center" },
  colAmt: { width: "12%", textAlign: "right" },
  colVatAmt: { width: "12%", textAlign: "right" },

  // Subtotal & Totals Strip
  subtotalRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: "5 6",
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    alignItems: "center",
  },
  subtotalLabel: {
    width: "68%",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "right",
    paddingRight: 8,
  },
  subtotalAmt: {
    width: "12%",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "right",
  },
  subtotalVat: {
    width: "12%",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "right",
  },

  // Grand Total & Terbilang Bar
  grandTotalBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: "7 10",
    borderRadius: 4,
    marginBottom: 6,
  },
  grandTotalLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: 1,
  },
  grandTotalValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },

  terbilangBox: {
    padding: "5 8",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    marginBottom: 8,
  },
  terbilangLabel: { fontSize: 6.5, color: "#64748b", fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  terbilangText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#1e293b", marginTop: 1 },

  // Bottom Remittance & Authentication
  bottomSection: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  remitBox: {
    flex: 1.3,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    padding: "6 8",
    backgroundColor: "#fcfcfc",
  },
  remitTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textTransform: "uppercase",
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 2,
  },
  remitRow: {
    flexDirection: "row",
    fontSize: 7,
    marginTop: 1.5,
  },
  remitLabel: { width: "32%", color: "#64748b" },
  remitVal: { width: "68%", fontFamily: "Helvetica-Bold", color: "#0f172a" },

  signBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    padding: "6 8",
    alignItems: "center",
    justifyContent: "space-between",
  },
  signTitle: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#0f172a", textAlign: "center" },
  signStampBox: {
    width: 60,
    height: 30,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
    backgroundColor: "#fafafa",
  },
  signStampText: { fontSize: 6, color: "#94a3b8" },
  signName: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#0f172a", borderTopWidth: 1, borderTopColor: "#94a3b8", paddingTop: 3, width: "85%", textAlign: "center" },

  // Footer
  footer: {
    position: "absolute",
    bottom: 14,
    left: 32,
    right: 32,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 6.5, color: "#94a3b8" },
});

// ─── Number To Words (Indonesian Terbilang) ──────────────────────────────────
function terbilang(n: number): string {
  const bilangan = [
    "", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan",
    "Sembilan", "Sepuluh", "Sebelas",
  ];
  n = Math.floor(n);
  if (n < 12) return bilangan[n];
  if (n < 20) return terbilang(n - 10) + " Belas";
  if (n < 100) return terbilang(Math.floor(n / 10)) + " Puluh " + terbilang(n % 10);
  if (n < 200) return "Seratus " + terbilang(n - 100);
  if (n < 1000) return terbilang(Math.floor(n / 100)) + " Ratus " + terbilang(n % 100);
  if (n < 2000) return "Seribu " + terbilang(n - 1000);
  if (n < 1000000) return terbilang(Math.floor(n / 1000)) + " Ribu " + terbilang(n % 1000);
  if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + " Juta " + terbilang(n % 1000000);
  if (n < 1000000000000) return terbilang(Math.floor(n / 1000000000)) + " Miliar " + terbilang(n % 1000000000);
  return "";
}

function toTerbilangRupiah(amount: number): string {
  if (!amount || amount === 0) return "# Nol Rupiah #";
  const words = terbilang(amount).replace(/\s+/g, " ").trim();
  return `# ${words} Rupiah #`;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatNum(n: number): string {
  return new Intl.NumberFormat("id-ID").format(Math.round(n));
}

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface CargoDetailSpec {
  pieces: number;
  grossWeight: number;
  chargeableWeight: number;
  volumeCbm: number;
  dimensions: string | null;
  unitCode: string;
  commodityName: string;
  hsCode: string | null;
}

export interface InvoiceItemSpec {
  chargeCode: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  taxRatePercent: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
}

export interface InvoicePDFProps {
  tenant: {
    companyName: string;
    legalName: string;
    taxId: string;
    address: string;
    logoUrl: string | null;
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    swiftCode: string;
    bankBranch: string;
  };
  invoice: {
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    currency: string;
    subtotal: number;
    taxAmount: number;
    taxRatePercent: number;
    totalAmount: number;
    status: string;
    cargoSummary: string | null;
    taxName: string | null;
    notes: string | null;
  };
  customer: {
    name: string;
    address: string;
    city: string;
    taxId: string;
    phone: string;
    email: string;
    contactPerson: string;
    customerCode: string;
  };
  operational: {
    jobFileNumber: string;
    houseBl: string;
    masterBl: string;
    bizMode: string;
    bound: string;
    originPort: string;
    destinationPort: string;
    vesselOrFlight: string;
    voyageOrFlightNo: string;
    incoterm: string;
    onBoardDate: Date | null;
    arrivalDate: Date | null;
    containerSummary: string;
    gwt: string;
    cwt: string;
    cbm: string;
    qty: string;
    commodityDisplay: string;
    cargoDetails: CargoDetailSpec[];
  } | null;
  items?: InvoiceItemSpec[];
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function InvoicePDFDocument({ tenant, invoice, customer, operational, items }: InvoicePDFProps) {
  const terbilangStr = toTerbilangRupiah(invoice.totalAmount);
  const vatRateText = `${invoice.taxRatePercent}%`;
  const invDateStr = formatDate(invoice.invoiceDate);
  const dueDateStr = formatDate(invoice.dueDate);

  // Clean ports display (no broken unicode arrows)
  const pol = operational?.originPort || "-";
  const pod = operational?.destinationPort || "-";

  return (
    <Document
      title={invoice.invoiceNumber}
      author={tenant.companyName}
      subject={`Invoice ${invoice.invoiceNumber}`}
    >
      <Page size="A4" style={styles.page}>
        {/* ================================================================== */}
        {/* 1. TOP HEADER (LOGO, TENANT DETAILS, AND BIG TITLE) */}
        {/* ================================================================== */}
        <View style={styles.header}>
          <View style={styles.logoBlock}>
            {tenant.logoUrl ? (
              <Image src={tenant.logoUrl} style={styles.logo} />
            ) : (
              <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0f172a" }}>
                {tenant.companyName.substring(0, 3).toUpperCase()}
              </Text>
            )}
            <View style={styles.tenantInfo}>
              <Text style={styles.companyName}>{tenant.legalName}</Text>
              <Text style={styles.companyDetail}>{tenant.address}</Text>
              <Text style={styles.companyDetail}>NPWP: {tenant.taxId} · Freight Forwarding & Logistics</Text>
            </View>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.invoiceTitle}>I N V O I C E</Text>
            <Text style={styles.invoiceSubtitle}>Commercial Freight Invoice</Text>
          </View>
        </View>

        {/* ================================================================== */}
        {/* 2. PARTIES & INVOICE PARTICULARS (INVOICE TO VS INVOICE DETAILS) */}
        {/* ================================================================== */}
        <View style={styles.twoColSection}>
          {/* Left: INVOICE TO */}
          <View style={styles.partyBox}>
            <View style={styles.boxHeader}>
              <Text style={styles.boxHeaderText}>INVOICE TO (MESSERS)</Text>
              <Text style={{ fontSize: 7, color: "#64748b" }}>ID: {customer.customerCode}</Text>
            </View>
            <View style={styles.boxBody}>
              <Text style={styles.partyName}>{customer.name}</Text>
              <Text style={styles.partyAddress}>{customer.address}</Text>
              <Text style={styles.partyVat}>VAT NO / NPWP: {customer.taxId}</Text>
              <Text style={styles.partyAttn}>
                ATTN: {customer.contactPerson} {customer.phone !== "-" ? `| ${customer.phone}` : ""}
              </Text>
            </View>
          </View>

          {/* Right: INVOICE DETAILS (LX Pantos Style Fixed Meta Table) */}
          <View style={styles.metaBox}>
            <View style={styles.boxHeader}>
              <Text style={styles.boxHeaderText}>DETAIL FAKTUR / INVOICE</Text>
              <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: "#0f172a" }}>ORIGINAL</Text>
            </View>
            <View style={[styles.boxBody, styles.metaGrid]}>
              <View style={styles.metaGridRow}>
                <Text style={styles.metaGridLabel}>INVOICE NO.</Text>
                <Text style={[styles.metaGridValue, { fontSize: 8.5, color: "#4338ca" }]}>
                  {invoice.invoiceNumber}
                </Text>
              </View>
              <View style={styles.metaGridRow}>
                <Text style={styles.metaGridLabel}>INVOICE DT</Text>
                <Text style={styles.metaGridValue}>{invDateStr}</Text>
              </View>
              <View style={styles.metaGridRow}>
                <Text style={styles.metaGridLabel}>DUE DT</Text>
                <Text style={[styles.metaGridValue, { color: "#b91c1c" }]}>{dueDateStr}</Text>
              </View>
              <View style={styles.metaGridRow}>
                <Text style={styles.metaGridLabel}>BIZ MODE / BOUND</Text>
                <Text style={styles.metaGridValue}>
                  {operational?.bizMode || "AIR"} / {operational?.bound || "EXPORT"}
                </Text>
              </View>
              <View style={styles.metaGridRow}>
                <Text style={styles.metaGridLabel}>STATUS</Text>
                <Text style={[styles.metaGridValue, { color: invoice.status === "PAID" ? "#15803d" : "#b45309" }]}>
                  {invoice.status}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ================================================================== */}
        {/* 3. OPERATIONAL REFERENCE GRID (EXACT LX PANTOS 2-TIER TABLE) */}
        {/* ================================================================== */}
        <View style={styles.operationalSection}>
          {/* Row 1: BL, MBL, On-Board, Arrival, Issue Date, Ref No */}
          <View style={styles.opRow}>
            <View style={[styles.opCell, { width: "16%" }]}>
              <Text style={styles.opLabel}>B/L No.</Text>
              <Text style={styles.opValue}>{operational?.houseBl || "-"}</Text>
            </View>
            <View style={[styles.opCell, { width: "16%" }]}>
              <Text style={styles.opLabel}>MB/L No.</Text>
              <Text style={styles.opValue}>{operational?.masterBl || "-"}</Text>
            </View>
            <View style={[styles.opCell, { width: "15%" }]}>
              <Text style={styles.opLabel}>ON-BOARD / ETD</Text>
              <Text style={styles.opValue}>{formatDate(operational?.onBoardDate)}</Text>
            </View>
            <View style={[styles.opCell, { width: "15%" }]}>
              <Text style={styles.opLabel}>ARRIVAL / ETA</Text>
              <Text style={styles.opValue}>{formatDate(operational?.arrivalDate)}</Text>
            </View>
            <View style={[styles.opCell, { width: "12%" }]}>
              <Text style={styles.opLabel}>INCOTERMS</Text>
              <Text style={styles.opValue}>{operational?.incoterm || "CIF"}</Text>
            </View>
            <View style={[styles.opCellLast, { width: "26%" }]}>
              <Text style={styles.opLabel}>SMT / JOB FILE NO.</Text>
              <Text style={styles.opValue}>{operational?.jobFileNumber || "-"}</Text>
            </View>
          </View>

          {/* Row 2: POL, POD, Vessel/Flight, Container, Cargo Specs */}
          <View style={styles.opRowLast}>
            <View style={[styles.opCell, { width: "25%" }]}>
              <Text style={styles.opLabel}>POL (Port of Loading)</Text>
              <Text style={styles.opValue}>{pol}</Text>
            </View>
            <View style={[styles.opCell, { width: "25%" }]}>
              <Text style={styles.opLabel}>POD / Final Dest</Text>
              <Text style={styles.opValue}>{pod}</Text>
            </View>
            <View style={[styles.opCell, { width: "20%" }]}>
              <Text style={styles.opLabel}>VESSEL / FLIGHT</Text>
              <Text style={styles.opValue}>{operational?.vesselOrFlight || "-"}</Text>
            </View>
            <View style={[styles.opCellLast, { width: "30%" }]}>
              <Text style={styles.opLabel}>GWT / CWT / CBM / QTY</Text>
              <Text style={styles.opValue}>
                {operational?.gwt} / {operational?.cwt} / {operational?.cbm} / {operational?.qty}
              </Text>
            </View>
          </View>
        </View>

        {/* ================================================================== */}
        {/* 4. ITEMIZED CHARGES TABLE (FREIGHT & CHARGES WITH VAT & DPP) */}
        {/* ================================================================== */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.colDesc]}>FREIGHT &amp; CHARGE</Text>
            <Text style={[styles.thText, styles.colPer]}>PER</Text>
            <Text style={[styles.thText, styles.colQty]}>WT/QTY</Text>
            <Text style={[styles.thText, styles.colCurr]}>CURR</Text>
            <Text style={[styles.thText, styles.colRate]}>RATE</Text>
            <Text style={[styles.thText, styles.colVatRate]}>VAT RATE</Text>
            <Text style={[styles.thText, styles.colAmt]}>AMT (DPP)</Text>
            <Text style={[styles.thText, styles.colVatAmt]}>VAT AMT</Text>
          </View>

          {/* Dynamic Itemized Charges Rows */}
          {items && items.length > 0 ? (
            items.map((item, idx) => (
              <View
                key={idx}
                style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <View style={styles.colDesc}>
                  <Text style={styles.tdTextBold}>
                    {item.description || item.chargeCode}
                  </Text>
                  <Text style={{ fontSize: 6.5, color: "#64748b", marginTop: 0.5 }}>
                    Charge Code: {item.chargeCode}
                    {operational?.commodityDisplay && idx === 0
                      ? ` · ${operational.commodityDisplay}`
                      : ""}
                  </Text>
                </View>
                <Text style={[styles.tdText, styles.colPer]}>{item.unit}</Text>
                <Text style={[styles.tdText, styles.colQty]}>
                  {item.quantity.toLocaleString("id-ID", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </Text>
                <Text style={[styles.tdText, styles.colCurr]}>
                  {item.currency || invoice.currency}
                </Text>
                <Text style={[styles.tdText, styles.colRate]}>{formatNum(item.rate)}</Text>
                <Text style={[styles.tdText, styles.colVatRate]}>
                  {item.taxRatePercent}%
                </Text>
                <Text style={[styles.tdTextBold, styles.colAmt]}>{formatNum(item.amount)}</Text>
                <Text style={[styles.tdTextBold, styles.colVatAmt]}>
                  {formatNum(item.taxAmount)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.tdTextBold}>
                  {operational?.bizMode === "AIR"
                    ? "AIR FREIGHT CHARGES"
                    : "OCEAN FREIGHT CHARGES"}
                </Text>
                <Text style={{ fontSize: 6.5, color: "#64748b", marginTop: 1 }}>
                  Commodity: {operational?.commodityDisplay || "General Cargo"}
                </Text>
                {operational?.containerSummary && operational.containerSummary !== "-" && (
                  <Text style={{ fontSize: 6.5, color: "#64748b" }}>
                    Specs: {operational.containerSummary}
                  </Text>
                )}
              </View>
              <Text style={[styles.tdText, styles.colPer]}>
                {operational?.bizMode === "AIR" ? "CWT" : "SHPT"}
              </Text>
              <Text style={[styles.tdText, styles.colQty]}>
                {operational?.bizMode === "AIR" && operational?.cwt && parseFloat(operational.cwt.replace(/[^\d.]/g, "")) > 0
                  ? parseFloat(operational.cwt.replace(/[^\d.]/g, "")).toFixed(2)
                  : "1.00"}
              </Text>
              <Text style={[styles.tdText, styles.colCurr]}>{invoice.currency}</Text>
              <Text style={[styles.tdText, styles.colRate]}>
                {formatNum(
                  operational?.bizMode === "AIR" && operational?.cwt && parseFloat(operational.cwt.replace(/[^\d.]/g, "")) > 0
                    ? invoice.subtotal / parseFloat(operational.cwt.replace(/[^\d.]/g, ""))
                    : invoice.subtotal
                )}
              </Text>
              <Text style={[styles.tdText, styles.colVatRate]}>{vatRateText}</Text>
              <Text style={[styles.tdTextBold, styles.colAmt]}>{formatNum(invoice.subtotal)}</Text>
              <Text style={[styles.tdTextBold, styles.colVatAmt]}>
                {formatNum(invoice.taxAmount)}
              </Text>
            </View>
          )}

          {/* Subtotal Row */}
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>SUB TOTAL</Text>
            <Text style={styles.subtotalAmt}>{formatNum(invoice.subtotal)}</Text>
            <Text style={styles.subtotalVat}>{formatNum(invoice.taxAmount)}</Text>
          </View>
        </View>

        {/* ================================================================== */}
        {/* 5. GRAND TOTAL BAR & TERBILANG (ZERO TEXT OVERLAP) */}
        {/* ================================================================== */}
        <View style={styles.grandTotalBar}>
          <Text style={styles.grandTotalLabel}>GRAND TOTAL ({invoice.currency})</Text>
          <Text style={styles.grandTotalValue}>
            {invoice.currency} {formatNum(invoice.totalAmount)}
          </Text>
        </View>

        <View style={styles.terbilangBox}>
          <Text style={styles.terbilangLabel}>Terbilang (Amount in Words):</Text>
          <Text style={styles.terbilangText}>{terbilangStr}</Text>
        </View>

        {/* ================================================================== */}
        {/* 6. REMITTANCE BANK DETAILS & SIGNATURE (LX PANTOS STANDARD) */}
        {/* ================================================================== */}
        <View style={styles.bottomSection}>
          {/* Remittance Box */}
          <View style={styles.remitBox}>
            <Text style={styles.remitTitle}>PLEASE REMIT TO (REKENING PEMBAYARAN)</Text>
            <View style={styles.remitRow}>
              <Text style={styles.remitLabel}>Beneficiary:</Text>
              <Text style={styles.remitVal}>{tenant.bankAccountName}</Text>
            </View>
            <View style={styles.remitRow}>
              <Text style={styles.remitLabel}>Bank Name:</Text>
              <Text style={styles.remitVal}>{tenant.bankName}</Text>
            </View>
            <View style={styles.remitRow}>
              <Text style={styles.remitLabel}>Account No:</Text>
              <Text style={styles.remitVal}>
                {tenant.bankAccountNumber} ({invoice.currency})
              </Text>
            </View>
            <View style={styles.remitRow}>
              <Text style={styles.remitLabel}>Swift Code:</Text>
              <Text style={styles.remitVal}>{tenant.swiftCode}</Text>
            </View>
            <View style={styles.remitRow}>
              <Text style={styles.remitLabel}>Branch:</Text>
              <Text style={styles.remitVal}>{tenant.bankBranch}</Text>
            </View>
          </View>

          {/* Authentication & Signature Box */}
          <View style={styles.signBox}>
            <Text style={styles.signTitle}>PT. {tenant.companyName.replace(/^PT\.?\s*/i, "")}</Text>
            <View style={styles.signStampBox}>
              <Text style={styles.signStampText}>e-MATERAI</Text>
              <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: "#64748b" }}>10000</Text>
            </View>
            <Text style={styles.signName}>Authorized Finance Signatory</Text>
          </View>
        </View>

        {/* ================================================================== */}
        {/* 7. DOCUMENT FOOTER */}
        {/* ================================================================== */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Dokumen ini diterbitkan secara sah dan otomatis oleh sistem multi-tenant {tenant.companyName}.
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
