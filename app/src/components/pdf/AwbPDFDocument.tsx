import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// ============================================================================
// IATA AIR WAYBILL STYLES (Universal IATA Neutral / Airline Standard - Red Lines)
// ============================================================================
const iataRed = "#b91c1c";
const iataRedDark = "#7f1d1d";
const iataBlack = "#0f172a";

const awbStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: iataBlack,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
  },
  // Top identifier bar
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  topAwbLeft: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: iataBlack,
    letterSpacing: 0.5,
  },
  topAwbRight: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: iataBlack,
    letterSpacing: 0.5,
  },
  // Outer frame
  frame: {
    borderWidth: 0.8,
    borderColor: iataRed,
  },
  // Common Box
  box: {
    padding: 3,
  },
  label: {
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    color: iataRedDark,
    textTransform: "uppercase",
    marginBottom: 1.5,
  },
  labelRight: {
    fontSize: 5,
    fontFamily: "Helvetica",
    color: iataRedDark,
    textAlign: "right",
  },
  valueText: {
    fontSize: 7,
    fontFamily: "Helvetica",
    color: iataBlack,
    lineHeight: 1.25,
  },
  valueBold: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: iataBlack,
  },
  // Row dividers
  rowBorder: {
    borderBottomWidth: 0.8,
    borderColor: iataRed,
  },
  colBorder: {
    borderRightWidth: 0.8,
    borderColor: iataRed,
  },
  // Header row (2 halves)
  twoColRow: {
    flexDirection: "row",
  },
  halfCol: {
    width: "50%",
  },
  // Legal text
  legalText: {
    fontSize: 4.2,
    fontFamily: "Helvetica",
    color: iataRedDark,
    lineHeight: 1.15,
  },
  // Table
  thText: {
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    color: iataRedDark,
    textAlign: "center",
  },
  tdText: {
    fontSize: 6.8,
    fontFamily: "Helvetica",
    color: iataBlack,
    textAlign: "center",
  },
  tdTextBold: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: iataBlack,
    textAlign: "center",
  },
  tdTextLeft: {
    fontSize: 6.8,
    fontFamily: "Helvetica",
    color: iataBlack,
    textAlign: "left",
  },
  tdTextRight: {
    fontSize: 6.8,
    fontFamily: "Helvetica",
    color: iataBlack,
    textAlign: "right",
  },
});

// ============================================================================
// OCEAN BILL OF LADING STYLES (Standard FIATA / Maritime Carrier Standard)
// ============================================================================
const oceanBlue = "#0f172a";
const blStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: oceanBlue,
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 22,
    backgroundColor: "#ffffff",
  },
  frame: {
    borderWidth: 0.8,
    borderColor: oceanBlue,
  },
  box: {
    padding: 3,
  },
  label: {
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    textTransform: "uppercase",
    marginBottom: 1.5,
  },
  valueText: {
    fontSize: 7,
    fontFamily: "Helvetica",
    color: oceanBlue,
    lineHeight: 1.25,
  },
  valueBold: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: oceanBlue,
  },
  rowBorder: {
    borderBottomWidth: 0.8,
    borderColor: oceanBlue,
  },
  colBorder: {
    borderRightWidth: 0.8,
    borderColor: oceanBlue,
  },
  thText: {
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    color: oceanBlue,
    textAlign: "center",
  },
  tdText: {
    fontSize: 6.8,
    fontFamily: "Helvetica",
    color: oceanBlue,
    textAlign: "center",
  },
});

// ============================================================================
// INTERFACES & PROPS
// ============================================================================
export interface CargoDetail {
  pieces: number;
  grossWeight: number;
  chargeableWeight: number;
  volumeCbm: number;
  length: number | null;
  width: number | null;
  height: number | null;
  unitCode: string;
  unitName: string;
  commodityName: string;
  hsCode: string | null;
  description: string | null;
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

export interface InvoiceSummary {
  invoiceNumber: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  items?: InvoiceItemSpec[];
}

export interface AwbPDFProps {
  tenant: {
    companyName: string;
    legalName: string;
    taxId: string;
    logoUrl: string | null;
    city?: string | null;
    iataCode?: string | null;
    accountNo?: string | null;
  };
  job: {
    jobFileNumber: string;
    blOrAwbNumber: string;
    masterBlNumber: string;
    houseBlNumber: string;
    status: string;
    transportMode: string;
    bizMode: string | null;
    bound: string | null;
    originPortCode: string;
    destinationPortCode: string;
    originPort: string;
    destinationPort: string;
    vesselOrFlight: string;
    voyageOrFlightNumber: string;
    incoterm: string;
    packageCount: number;
    packageType: string;
    grossWeightKg: number;
    chargeableWeightKg: number;
    volumeWeightCbm: number;
    containerNumber: string;
    containerCount?: number | null;
    sealNumber: string;
    commodityDescription?: string | null;
    sellingAmount: number;
    buyingAmount: number;
    currency: string;
    createdAt: Date;
    etdDate: Date | null;
    etaDate: Date | null;
    remarks: string | null;
    consigneeName?: string | null;
    consigneeAddress?: string | null;
    consigneeCity?: string | null;
    consigneeCountry?: string | null;
    consigneePhone?: string | null;
    consigneePostalCode?: string | null;
    consigneeTaxId?: string | null;
    consigneeAccountNo?: string | null;
    notifyParty?: string | null;
    transitPort?: string | null;
    transitPortCode?: string | null;
    secondCarrier?: string | null;
    connectingFlightNo?: string | null;
    paymentTermMode?: string | null;
    declaredValueCarriage?: string | null;
    declaredValueCustoms?: string | null;
    insuranceAmount?: string | null;
    handlingInformation?: string | null;
    vendorIataPrefix?: string | null;
    customerRefNo?: string | null;
    shippingInstructionNo?: string | null;
    commercialInvoiceNo?: string | null;
    billingPartyType?: string | null;
    invoice: InvoiceSummary | null;
    cargoDetails: CargoDetail[];
  };
  customer: {
    customerCode: string;
    name: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
    taxId: string;
    phone: string;
    email: string;
    contactPerson: string;
  };
  vendor: {
    name: string;
    code: string;
    category: string;
    address: string;
    city: string;
    country: string;
    phone: string;
    iataPrefix?: string | null;
  } | null;
}

// Helpers
function formatNum(val: number, dec = 0): string {
  return val.toLocaleString("en-US", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

function formatDateDMY(date: Date | null): string {
  if (!date) return "-";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const mon = months[d.getMonth()];
  const yr = d.getFullYear();
  return `${day} ${mon} ${yr}`;
}

// ============================================================================
// COMPONENT 1: IATA STANDARD AIR WAYBILL (AWB)
// ============================================================================
function IataAwbPage({ tenant, job, customer, vendor }: AwbPDFProps) {
  // 1. Parse AWB Number into standard 3-digit prefix & 8-digit serial
  const rawAwb = (job.masterBlNumber && job.masterBlNumber !== "-" ? job.masterBlNumber : (job.blOrAwbNumber !== "-" ? job.blOrAwbNumber : "")).trim();
  const digitsOnly = rawAwb.replace(/\D/g, "");
  let airlinePrefix = job.vendorIataPrefix || (vendor?.iataPrefix ? vendor.iataPrefix : (vendor?.code ? vendor.code.substring(0, 3) : ""));
  let serialFormatted = rawAwb;

  if (digitsOnly.length >= 11) {
    airlinePrefix = digitsOnly.substring(0, 3);
    const s = digitsOnly.substring(3);
    serialFormatted = s.length === 8 ? `${s.substring(0, 4)} ${s.substring(4)}` : s;
  } else if (rawAwb.includes("-")) {
    const parts = rawAwb.split("-");
    airlinePrefix = parts[0];
    serialFormatted = parts.slice(1).join(" ");
  }

  // Airport codes (Robust 3-letter IATA resolution)
  const cleanAirportCode = (code: string | undefined | null, fallback: string) => {
    if (!code || code === "-") return fallback;
    const clean = code.trim().toUpperCase();
    if (clean.length === 5) return clean.substring(2); // e.g. IDCGK -> CGK, SGSIN -> SIN
    if (clean.length === 3) return clean; // e.g. CGK, SIN, VTE
    const match = clean.match(/[A-Z]{3}/);
    return match ? match[0] : fallback;
  };

  const originFallback = job.originPort ? (job.originPort.match(/[A-Z]{3}/)?.[0] || "-") : "-";
  const destFallback = job.destinationPort ? (job.destinationPort.match(/[A-Z]{3}/)?.[0] || "-") : "-";
  const originCode = cleanAirportCode(job.originPortCode, originFallback);
  const destCode = cleanAirportCode(job.destinationPortCode, destFallback);

  const topAwbLeft = airlinePrefix && serialFormatted && serialFormatted !== "-"
    ? `${airlinePrefix} ${originCode} ${serialFormatted}`
    : (rawAwb ? `${originCode} ${rawAwb}` : "-");
  const topAwbRight = airlinePrefix && serialFormatted && serialFormatted !== "-"
    ? `${airlinePrefix} ${serialFormatted}`
    : (rawAwb ? rawAwb : "-");

  // Airline Carrier Name
  const carrierName = vendor?.name || job.vesselOrFlight || "-";

  // Total Pieces, Gross Weight, Chargeable Weight
  const totalPieces = job.cargoDetails.length > 0
    ? job.cargoDetails.reduce((sum, c) => sum + (c.pieces || 0), 0)
    : (job.packageCount || 0);

  const totalGrossWeight = job.cargoDetails.length > 0
    ? job.cargoDetails.reduce((sum, c) => sum + Number(c.grossWeight || 0), 0)
    : (job.grossWeightKg || 0);

  const totalChargeableWeight = job.cargoDetails.length > 0
    ? job.cargoDetails.reduce((sum, c) => sum + Number(c.chargeableWeight || 0), 0)
    : (job.chargeableWeightKg || totalGrossWeight);

  // Rate & Financials (Dynamic extraction from relational invoice_items)
  const invItems = job.invoice?.items || [];
  const freightItems = invItems.filter(
    (it) => it.chargeCode === "AFRT" || it.chargeCode === "OFRT" || it.description.toUpperCase().includes("FREIGHT")
  );
  const docItem = invItems.find(
    (it) => it.chargeCode === "DOC_FEE" || it.chargeCode === "AWB" || it.description.toUpperCase().includes("AWB") || it.description.toUpperCase().includes("DOC")
  );
  const fscItem = invItems.find(
    (it) => it.chargeCode === "FSC" || it.chargeCode === "FUEL" || it.description.toUpperCase().includes("FUEL")
  );
  const otherCarrierItems = invItems.filter(
    (it) => it !== docItem && !freightItems.includes(it)
  );

  let weightChargeTotal = 0;
  let otherChargesCarrier = 0;
  let awbFee = docItem ? docItem.amount : 0;
  let fscRate = fscItem ? fscItem.rate : 0;

  if (invItems.length > 0) {
    if (freightItems.length > 0) {
      weightChargeTotal = freightItems.reduce((s, it) => s + it.amount, 0);
    } else {
      weightChargeTotal = job.invoice ? job.invoice.subtotal : job.sellingAmount;
    }
    otherChargesCarrier = otherCarrierItems.reduce((s, it) => s + it.amount, 0);
  } else {
    weightChargeTotal = job.invoice ? job.invoice.subtotal : job.sellingAmount;
    otherChargesCarrier = 0;
  }

  const totalFreight = weightChargeTotal + otherChargesCarrier;
  const ratePerKg = (totalChargeableWeight > 0 && weightChargeTotal > 0)
    ? Math.round(weightChargeTotal / totalChargeableWeight)
    : 0;

  // Commodity & Dimensions summary
  const firstCargo = job.cargoDetails[0];
  const commodityName = firstCargo?.commodityName || job.commodityDescription || job.packageType || "-";
  const hsCodeDisplay = firstCargo?.hsCode || "-";
  const dimDisplay = firstCargo?.length && firstCargo?.width && firstCargo?.height
    ? `${firstCargo.length} X ${firstCargo.width} X ${firstCargo.height}CM / ${totalPieces}CTNS`
    : (firstCargo?.description || (totalPieces > 0 ? `${totalPieces} PKGS` : "-"));
  const volumeDisplay = job.volumeWeightCbm > 0
    ? `${formatNum(job.volumeWeightCbm, 3)} CBM`
    : (firstCargo?.volumeCbm ? `${formatNum(firstCargo.volumeCbm, 3)} CBM` : "-");

  // Handling Info
  const handlingText = job.handlingInformation && job.handlingInformation.trim() !== ""
    ? job.handlingInformation
    : (job.remarks && job.remarks.trim() !== ""
      ? job.remarks
      : "-");

  // Flight numbers
  const flightNo1 = job.voyageOrFlightNumber && job.voyageOrFlightNumber !== "-" ? job.voyageOrFlightNumber : "-";
  const flightNo2 = job.connectingFlightNo && job.connectingFlightNo !== "-" ? job.connectingFlightNo : "-";

  return (
    <Page size="A4" style={awbStyles.page}>
      {/* ── TOP IDENTIFIER ROW ────────────────────────────────────────── */}
      <View style={awbStyles.topBar}>
        <Text style={awbStyles.topAwbLeft}>{topAwbLeft}</Text>
        <Text style={awbStyles.topAwbRight}>{topAwbRight}</Text>
      </View>

      {/* ── MAIN AWB FRAME ────────────────────────────────────────────── */}
      <View style={awbStyles.frame}>
        {/* ROW 1: PARTIES (SHIPPER, CONSIGNEE, AGENT) vs (DOC TITLE, LEGAL, ACCT) */}
        <View style={[awbStyles.twoColRow, awbStyles.rowBorder]}>
          {/* LEFT HALF */}
          <View style={[awbStyles.halfCol, awbStyles.colBorder]}>
            {/* Box 1: Shipper */}
            <View style={[awbStyles.box, awbStyles.rowBorder, { minHeight: 52 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={awbStyles.label}>Shipper's Name and Address</Text>
                <Text style={awbStyles.labelRight}>
                  Shipper's Account Number: {customer.customerCode || "-"}
                </Text>
              </View>
              <Text style={awbStyles.valueBold}>{customer.name}</Text>
              <Text style={awbStyles.valueText}>{customer.address}</Text>
              {customer.taxId && customer.taxId !== "-" && (
                <Text style={awbStyles.valueText}>NPWP : {customer.taxId}</Text>
              )}
              <Text style={awbStyles.valueText}>TEL : {customer.phone || "-"}</Text>
            </View>

            {/* Box 2: Consignee */}
            <View style={[awbStyles.box, awbStyles.rowBorder, { minHeight: 52 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={awbStyles.label}>Consignee's Name and Address</Text>
                <Text style={awbStyles.labelRight}>
                  {job.consigneeAccountNo ? `Consignee A/C: ${job.consigneeAccountNo}` : "Consignee's Account Number"}
                </Text>
              </View>
              <Text style={awbStyles.valueBold}>
                {job.consigneeName || customer.contactPerson || customer.name}
              </Text>
              <Text style={awbStyles.valueText}>
                {job.consigneeAddress || (job.bound === "EXPORT" ? "-" : customer.address)}
              </Text>
              <Text style={awbStyles.valueText}>
                {job.consigneeCity
                  ? `${job.consigneeCity}${job.consigneeCountry ? ` - ${job.consigneeCountry}` : ""}${job.consigneePostalCode ? ` ${job.consigneePostalCode}` : ""}`
                  : (job.bound === "EXPORT" ? (job.destinationPort || "-") : `${customer.city || ""}, ${customer.country || "ID"}`.replace(/^, /, ""))}
              </Text>
              <Text style={awbStyles.valueText}>
                TEL : {job.consigneePhone || "-"}
                {job.consigneeTaxId ? ` | TAX ID: ${job.consigneeTaxId}` : ""}
              </Text>
            </View>

            {/* Box 3: Issuing Carrier's Agent */}
            <View style={[awbStyles.box, awbStyles.rowBorder, { minHeight: 28 }]}>
              <Text style={awbStyles.label}>Issuing Carrier's Agent Name and City</Text>
              <Text style={awbStyles.valueBold}>{tenant.legalName || tenant.companyName}</Text>
              <Text style={awbStyles.valueText}>{tenant.city || "INDONESIA"}</Text>
            </View>

            {/* Box 4: Agent's IATA Code & Account No */}
            <View style={[awbStyles.twoColRow, awbStyles.rowBorder, { minHeight: 20 }]}>
              <View style={[awbStyles.box, awbStyles.colBorder, { width: "55%" }]}>
                <Text style={awbStyles.label}>Agent's IATA Code</Text>
                <Text style={awbStyles.valueBold}>{tenant.iataCode || vendor?.code || "-"}</Text>
              </View>
              <View style={[awbStyles.box, { width: "45%" }]}>
                <Text style={awbStyles.label}>Account No.</Text>
                <Text style={awbStyles.valueText}>{tenant.accountNo || customer.customerCode || "-"}</Text>
              </View>
            </View>

            {/* Box 5: Airport of Departure */}
            <View style={[awbStyles.box, { minHeight: 24 }]}>
              <Text style={awbStyles.label}>Airport of Departure (Addr. of First Carrier) and Requested Routing</Text>
              <Text style={awbStyles.valueBold}>
                {job.originPort || "-"}
              </Text>
            </View>
          </View>

          {/* RIGHT HALF */}
          <View style={awbStyles.halfCol}>
            {/* Box 6: Title & Airline & Contract Notice */}
            <View style={[awbStyles.box, awbStyles.rowBorder, { minHeight: 110 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                <View>
                  <Text style={[awbStyles.label, { fontSize: 6 }]}>Not Negotiable</Text>
                  <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: iataRed, letterSpacing: 0.5 }}>
                    Air Waybill
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[awbStyles.label, { fontSize: 5 }]}>Issued By</Text>
                  <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: iataRed }}>
                    {carrierName}
                  </Text>
                </View>
              </View>

              <Text style={[awbStyles.legalText, { marginBottom: 3 }]}>
                Copies 1, 2 and 3 of this Air Waybill are originals and have the same validity.
              </Text>
              <Text style={awbStyles.legalText}>
                It is agreed that the goods described herein are accepted in apparent good order and condition (except as noted) for carriage SUBJECT TO THE CONDITIONS OF CONTRACT ON THE REVERSE HEREOF. ALL GOODS MAY BE CARRIED BY ANY OTHER MEANS INCLUDING ROAD OR ANY OTHER CARRIER UNLESS SPECIFIC CONTRARY INSTRUCTIONS ARE GIVEN HEREON BY THE SHIPPER, AND SHIPPER AGREES THAT THE SHIPMENT MAY BE VIA INTERMEDIATE STOPPING PLACES WHICH THE CARRIER DEEMS APPROPRIATE. THE SHIPPER'S ATTENTION IS DRAWN TO THE NOTICE CONCERNING CARRIER'S LIMITATION OF LIABILITY. Shipper may increase such limitation of liability by declaring a higher value for carriage and paying a supplemental charge if required.
              </Text>
            </View>

            {/* Box 7: Accounting Information */}
            <View style={[awbStyles.box, { minHeight: 66 }]}>
              <Text style={awbStyles.label}>Accounting Information</Text>
              <View style={{ marginVertical: 6, alignItems: "center" }}>
                <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: iataBlack, letterSpacing: 1 }}>
                  {job.paymentTermMode === "CC" ? '" FREIGHT COLLECT "' : '" FREIGHT PREPAID "'}
                </Text>
              </View>
              <Text style={[awbStyles.valueText, { fontSize: 6, color: "#64748b" }]}>
                SMT / JOB FILE: {job.jobFileNumber} | HAWB: {job.houseBlNumber && job.houseBlNumber !== "-" ? job.houseBlNumber : job.blOrAwbNumber}
              </Text>
              {job.customerRefNo && (
                <Text style={[awbStyles.valueText, { fontSize: 6, color: "#0f172a" }]}>
                  CLIENT / BROKER REF: {job.customerRefNo}
                </Text>
              )}
              {job.shippingInstructionNo && (
                <Text style={[awbStyles.valueText, { fontSize: 6, color: "#0f172a" }]}>
                  SHIPPING INSTRUCTION (SI): {job.shippingInstructionNo}
                </Text>
              )}
              {job.commercialInvoiceNo && (
                <Text style={[awbStyles.valueText, { fontSize: 6, color: "#0f172a" }]}>
                  COMMERCIAL INVOICE (CI): {job.commercialInvoiceNo}
                </Text>
              )}
              <Text style={[awbStyles.valueText, { fontSize: 6, color: "#64748b" }]}>
                INVOICE REF: {job.invoice?.invoiceNumber || "-"}
              </Text>
              {job.notifyParty && (
                <Text style={[awbStyles.valueText, { fontSize: 6, color: "#0f172a", marginTop: 2 }]}>
                  NOTIFY: {job.notifyParty}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* ROW 2: ROUTING & DESTINATION BAR */}
        <View style={awbStyles.rowBorder}>
          {/* Sub-row 1: Transfer points, Currency, CHGS Code, Valuation */}
          <View style={[{ flexDirection: "row", minHeight: 22 }, awbStyles.rowBorder]}>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "6%" }]}>
              <Text style={awbStyles.label}>to</Text>
              <Text style={awbStyles.valueBold}>{job.transitPortCode || (job.transitPort ? (job.transitPort.match(/[A-Z]{3}/)?.[0] || "-") : "-")}</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "12%" }]}>
              <Text style={awbStyles.label}>By first Carrier</Text>
              <Text style={awbStyles.valueBold}>
                {vendor?.iataPrefix || (vendor?.code ? vendor.code.substring(0, 2).toUpperCase() : "-")}
              </Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "6%" }]}>
              <Text style={awbStyles.label}>to</Text>
              <Text style={awbStyles.valueBold}>{destCode}</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "6%" }]}>
              <Text style={awbStyles.label}>by</Text>
              <Text style={awbStyles.valueBold}>{job.secondCarrier || "-"}</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "5%" }]}>
              <Text style={awbStyles.label}>to</Text>
              <Text style={awbStyles.valueText}>-</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "5%" }]}>
              <Text style={awbStyles.label}>by</Text>
              <Text style={awbStyles.valueText}>-</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "8%" }]}>
              <Text style={awbStyles.label}>Currency</Text>
              <Text style={awbStyles.valueBold}>{job.currency || "IDR"}</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "7%" }]}>
              <Text style={awbStyles.label}>CHGS Code</Text>
              <Text style={awbStyles.valueBold}>{job.paymentTermMode || "PP"}</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "7%" }]}>
              <Text style={awbStyles.label}>WT/VAL</Text>
              <Text style={awbStyles.valueBold}>{job.paymentTermMode === "CC" ? "C" : "P"}</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "6%" }]}>
              <Text style={awbStyles.label}>Other</Text>
              <Text style={awbStyles.valueBold}>{job.paymentTermMode === "CC" ? "C" : "P"}</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "16%" }]}>
              <Text style={awbStyles.label}>Declared Value Carriage</Text>
              <Text style={awbStyles.valueBold}>{job.declaredValueCarriage || "N V D"}</Text>
            </View>
            <View style={[awbStyles.box, { width: "16%" }]}>
              <Text style={awbStyles.label}>Declared Value Customs</Text>
              <Text style={awbStyles.valueBold}>{job.declaredValueCustoms || "N C V"}</Text>
            </View>
          </View>

          {/* Sub-row 2: Airport of Destination, Flight/Date, Insurance */}
          <View style={{ flexDirection: "row", minHeight: 21 }}>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "24%" }]}>
              <Text style={awbStyles.label}>Airport of Destination</Text>
              <Text style={awbStyles.valueBold}>{job.destinationPort || "-"}</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "14%" }]}>
              <Text style={awbStyles.label}>Flight/Date (Carrier Use)</Text>
              <Text style={awbStyles.valueBold}>{flightNo1}</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "14%" }]}>
              <Text style={awbStyles.label}>Flight/Date</Text>
              <Text style={awbStyles.valueBold}>{flightNo2}</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "15%" }]}>
              <Text style={awbStyles.label}>Amount of Insurance</Text>
              <Text style={awbStyles.valueBold}>{job.insuranceAmount || "NIL"}</Text>
            </View>
            <View style={[awbStyles.box, { width: "33%" }]}>
              <Text style={[awbStyles.legalText, { fontSize: 4 }]}>
                INSURANCE - If Carrier offers insurance and such insurance is requested in accordance with conditions on reverse hereof, indicate amount to be insured in figures in box marked 'Amount of Insurance.'
              </Text>
            </View>
          </View>
        </View>

        {/* ROW 3: HANDLING INFORMATION */}
        <View style={[awbStyles.box, awbStyles.rowBorder, { minHeight: 24 }]}>
          <Text style={awbStyles.label}>Handling Information</Text>
          <Text style={awbStyles.valueBold}>
            {handlingText}
          </Text>
          <Text style={[awbStyles.valueText, { fontSize: 5.5, color: "#64748b", marginTop: 1 }]}>
            COMMODITY: {commodityName} | INCOTERM: {job.incoterm || "-"}
          </Text>
        </View>

        {/* ROW 4: IATA CARGO DETAILS TABLE */}
        <View style={awbStyles.rowBorder}>
          {/* Table Header */}
          <View style={[{ flexDirection: "row", backgroundColor: "#fff5f5", minHeight: 18, alignItems: "center" }, awbStyles.rowBorder]}>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "7%" }]}>
              <Text style={awbStyles.thText}>No. of Pieces RCP</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "12%" }]}>
              <Text style={awbStyles.thText}>Gross Weight</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "4%" }]}>
              <Text style={awbStyles.thText}>kg lb</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "10%" }]}>
              <Text style={awbStyles.thText}>Rate Class Commodity</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "13%" }]}>
              <Text style={awbStyles.thText}>Chargeable Weight</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "12%" }]}>
              <Text style={awbStyles.thText}>Rate / Charge</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "14%" }]}>
              <Text style={awbStyles.thText}>Total</Text>
            </View>
            <View style={[awbStyles.box, { width: "28%" }]}>
              <Text style={awbStyles.thText}>Nature and Quantity of Goods (incl. Dimensions or Volume)</Text>
            </View>
          </View>

          {/* Table Detail Rows */}
          <View style={{ flexDirection: "row", minHeight: 75 }}>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "7%", paddingTop: 6 }]}>
              <Text style={awbStyles.tdTextBold}>{totalPieces > 0 ? totalPieces : "-"}</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "12%", paddingTop: 6 }]}>
              <Text style={awbStyles.tdTextBold}>{totalGrossWeight > 0 ? formatNum(totalGrossWeight, 1) : "-"}</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "4%", paddingTop: 6 }]}>
              <Text style={awbStyles.tdTextBold}>K</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "10%", paddingTop: 6 }]}>
              <Text style={awbStyles.tdTextBold}>Q</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "13%", paddingTop: 6 }]}>
              <Text style={awbStyles.tdTextBold}>{totalChargeableWeight > 0 ? formatNum(totalChargeableWeight, 1) : "-"}</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "12%", paddingTop: 6 }]}>
              <Text style={awbStyles.tdTextRight}>{ratePerKg > 0 ? formatNum(ratePerKg, 0) : "-"}</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "14%", paddingTop: 6 }]}>
              <Text style={awbStyles.tdTextRight}>{weightChargeTotal > 0 ? formatNum(weightChargeTotal, 0) : "-"}</Text>
            </View>
            <View style={[awbStyles.box, { width: "28%", paddingTop: 6 }]}>
              <Text style={[awbStyles.tdTextLeft, { fontFamily: "Helvetica-Bold", marginBottom: 2 }]}>
                {commodityName.toUpperCase()}
              </Text>
              {hsCodeDisplay !== "-" && (
                <Text style={[awbStyles.tdTextLeft, { marginBottom: 3 }]}>
                  HS CODE: {hsCodeDisplay}
                </Text>
              )}
              {dimDisplay !== "-" && (
                <>
                  <Text style={[awbStyles.tdTextLeft, { fontFamily: "Helvetica-Bold" }]}>
                    DIM'S :
                  </Text>
                  <Text style={[awbStyles.tdTextLeft, { marginBottom: 2 }]}>
                    {dimDisplay}
                  </Text>
                </>
              )}
              {volumeDisplay !== "-" && (
                <Text style={awbStyles.tdTextLeft}>
                  VOL: {volumeDisplay}
                </Text>
              )}
            </View>
          </View>

          {/* Table Totals Row */}
          <View style={[{ flexDirection: "row", backgroundColor: "#fff5f5", height: 16, alignItems: "center" }, awbStyles.rowBorder]}>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "7%" }]}>
              <Text style={awbStyles.tdTextBold}>{totalPieces > 0 ? totalPieces : "-"}</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "12%" }]}>
              <Text style={awbStyles.tdTextBold}>{totalGrossWeight > 0 ? formatNum(totalGrossWeight, 1) : "-"}</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "4%" }]}>
              <Text style={awbStyles.tdTextBold}>K</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "10%" }]}>
              <Text style={awbStyles.tdTextBold}>Q</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "13%" }]}>
              <Text style={awbStyles.tdTextBold}>{totalChargeableWeight > 0 ? formatNum(totalChargeableWeight, 1) : "-"}</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "12%" }]}>
              <Text style={awbStyles.tdText}>-</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "14%" }]}>
              <Text style={awbStyles.tdTextRight}>{weightChargeTotal > 0 ? formatNum(weightChargeTotal, 0) : "-"}</Text>
            </View>
            <View style={[awbStyles.box, { width: "28%" }]}>
              <Text style={awbStyles.tdText}> </Text>
            </View>
          </View>
        </View>

        {/* ROW 5: CHARGES BREAKDOWN & CERTIFICATION */}
        <View style={[awbStyles.twoColRow, awbStyles.rowBorder]}>
          {/* LEFT HALF: PREPAID & COLLECT SUMMARY */}
          <View style={[awbStyles.halfCol, awbStyles.colBorder]}>
            {/* Row 1: Weight Charge */}
            <View style={[{ flexDirection: "row", minHeight: 18, alignItems: "center" }, awbStyles.rowBorder]}>
              <View style={[awbStyles.box, awbStyles.colBorder, { width: "40%" }]}>
                <Text style={awbStyles.label}>Prepaid</Text>
                <Text style={awbStyles.valueBold}>{weightChargeTotal > 0 ? formatNum(weightChargeTotal, 0) : "-"}</Text>
              </View>
              <View style={[awbStyles.box, awbStyles.colBorder, { width: "30%", alignItems: "center" }]}>
                <Text style={awbStyles.label}>Weight Charge</Text>
              </View>
              <View style={[awbStyles.box, { width: "30%" }]}>
                <Text style={awbStyles.label}>Collect</Text>
                <Text style={awbStyles.valueText}>-</Text>
              </View>
            </View>

            {/* Row 2: Valuation Charge */}
            <View style={[awbStyles.box, awbStyles.rowBorder, { minHeight: 14 }]}>
              <Text style={awbStyles.label}>Valuation Charge</Text>
              <Text style={awbStyles.valueText}>-</Text>
            </View>

            {/* Row 3: Tax */}
            <View style={[awbStyles.box, awbStyles.rowBorder, { minHeight: 14 }]}>
              <Text style={awbStyles.label}>Tax</Text>
              <Text style={awbStyles.valueText}>-</Text>
            </View>

            {/* Row 4: Total Other Charges Due Agent */}
            <View style={[awbStyles.box, awbStyles.rowBorder, { minHeight: 14 }]}>
              <Text style={awbStyles.label}>Total Other Charges Due Agent</Text>
              <Text style={awbStyles.valueText}>-</Text>
            </View>

            {/* Row 5: Total Other Charges Due Carrier */}
            <View style={[awbStyles.box, awbStyles.rowBorder, { minHeight: 18 }]}>
              <Text style={awbStyles.label}>Total Other Charges Due Carrier</Text>
              <Text style={awbStyles.valueBold}>{otherChargesCarrier > 0 ? formatNum(otherChargesCarrier, 0) : "-"}</Text>
            </View>

            {/* Row 6: Total Prepaid vs Total Collect */}
            <View style={[{ flexDirection: "row", minHeight: 22, backgroundColor: "#fff5f5", alignItems: "center" }]}>
              <View style={[awbStyles.box, awbStyles.colBorder, { width: "60%" }]}>
                <Text style={awbStyles.label}>Total Prepaid</Text>
                <Text style={[awbStyles.valueBold, { fontSize: 8.5 }]}>{totalFreight > 0 ? formatNum(totalFreight, 0) : "-"}</Text>
              </View>
              <View style={[awbStyles.box, { width: "40%" }]}>
                <Text style={awbStyles.label}>Total Collect</Text>
                <Text style={awbStyles.valueText}>-</Text>
              </View>
            </View>
          </View>

          {/* RIGHT HALF: OTHER CHARGES & SHIPPER CERTIFICATION */}
          <View style={awbStyles.halfCol}>
            {/* Box: Other Charges */}
            <View style={[awbStyles.box, awbStyles.rowBorder, { minHeight: 46 }]}>
              <Text style={awbStyles.label}>Other Charges</Text>
              <View style={{ marginTop: 2, paddingLeft: 6 }}>
                {awbFee > 0 && (
                  <Text style={[awbStyles.valueText, { fontFamily: "Courier", fontSize: 7 }]}>
                    AWB FEE {job.currency || "IDR"} :  {formatNum(awbFee, 0)}/SHPT
                  </Text>
                )}
                {fscRate > 0 && (
                  <Text style={[awbStyles.valueText, { fontFamily: "Courier", fontSize: 7, marginTop: 1 }]}>
                    FSC FEE {job.currency || "IDR"} :   {formatNum(fscRate, 0)}/CW
                  </Text>
                )}
                {otherCarrierItems.filter(it => it !== docItem && it !== fscItem).map((it, idx) => (
                  <Text key={idx} style={[awbStyles.valueText, { fontFamily: "Courier", fontSize: 6.5, color: "#64748b", marginTop: 1 }]}>
                    {it.description} {job.currency || "IDR"} : {formatNum(it.amount, 0)}
                  </Text>
                ))}
                {awbFee === 0 && fscRate === 0 && otherChargesCarrier === 0 && (
                  <Text style={[awbStyles.valueText, { fontFamily: "Courier", fontSize: 7, color: "#64748b" }]}>
                    AS ARRANGED
                  </Text>
                )}
              </View>
            </View>

            {/* Box: Shipper Certification */}
            <View style={[awbStyles.box, { minHeight: 56 }]}>
              <Text style={awbStyles.legalText}>
                Shipper certifies that the particulars on the face hereof are correct and that INSOFAR AS ANY PART OF THE CONSIGNMENT CONTAINS DANGEROUS GOODS, SUCH PART IS PROPERLY DESCRIBED BY NAME AND IS IN PROPER CONDITION FOR CARRIAGE BY AIR ACCORDING TO THE APPLICABLE DANGEROUS GOODS REGULATIONS.
              </Text>
              <View style={{ marginTop: 10, alignItems: "center" }}>
                <Text style={awbStyles.valueBold}>{customer.name}</Text>
                <View style={{ width: "80%", borderBottomWidth: 0.5, borderColor: "#cbd5e1", marginVertical: 2 }} />
                <Text style={[awbStyles.label, { fontSize: 4.5 }]}>Signature of Shipper or his Agent</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ROW 6: BOTTOM EXECUTION STRIP */}
        <View style={awbStyles.rowBorder}>
          <View style={{ flexDirection: "row", minHeight: 20, alignItems: "center" }}>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "20%" }]}>
              <Text style={awbStyles.label}>Currency Conversion Rates</Text>
              <Text style={awbStyles.valueText}>-</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "20%" }]}>
              <Text style={awbStyles.label}>cc Charges in Dest. Currency</Text>
              <Text style={awbStyles.valueText}>-</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "20%" }]}>
              <Text style={awbStyles.label}>Executed on (Date)</Text>
              <Text style={awbStyles.valueBold}>{formatDateDMY(job.createdAt)}</Text>
            </View>
            <View style={[awbStyles.box, awbStyles.colBorder, { width: "15%" }]}>
              <Text style={awbStyles.label}>at (Place)</Text>
              <Text style={awbStyles.valueBold}>{tenant.city || "ORIGIN OFFICE"}</Text>
            </View>
            <View style={[awbStyles.box, { width: "25%", alignItems: "center" }]}>
              <Text style={awbStyles.label}>Signature of Issuing Carrier or its Agent</Text>
              <Text style={[awbStyles.valueBold, { fontSize: 8, marginTop: 1 }]}>
                {originCode} / {tenant.companyName.substring(0, 3).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* ROW 7: FINAL FOOTER STRIP */}
        <View style={{ flexDirection: "row", minHeight: 18, alignItems: "center", backgroundColor: "#fff5f5" }}>
          <View style={[awbStyles.box, awbStyles.colBorder, { width: "25%" }]}>
            <Text style={awbStyles.label}>For Carrier's Use Only at Destination</Text>
          </View>
          <View style={[awbStyles.box, awbStyles.colBorder, { width: "20%" }]}>
            <Text style={awbStyles.label}>Charges at Destination</Text>
            <Text style={awbStyles.valueText}>-</Text>
          </View>
          <View style={[awbStyles.box, awbStyles.colBorder, { width: "20%" }]}>
            <Text style={awbStyles.label}>Total Collect Charges</Text>
            <Text style={awbStyles.valueText}>-</Text>
          </View>
          <View style={[awbStyles.box, { width: "35%", alignItems: "flex-end", paddingRight: 6 }]}>
            <Text style={[awbStyles.valueBold, { fontSize: 10, letterSpacing: 0.5 }]}>
              {topAwbRight}
            </Text>
          </View>
        </View>
      </View>

      {/* ── FOOTER COPY NOTATION ──────────────────────────────────────── */}
      <View style={{ marginTop: 6, alignItems: "center" }}>
        <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: iataRed }}>
          Original 2 — (For Consignee)
        </Text>
        <Text style={{ fontSize: 5, color: "#94a3b8", marginTop: 1 }}>
          ORIGINAL CARRIER COPY · {tenant.legalName || tenant.companyName} · FREIGHT FORWARDING & LOGISTICS
        </Text>
      </View>
    </Page>
  );
}

// ============================================================================
// COMPONENT 2: FIATA STANDARD OCEAN BILL OF LADING (B/L)
// ============================================================================
function OceanBlPage({ tenant, job, customer, vendor }: AwbPDFProps) {
  const blNumber = job.masterBlNumber && job.masterBlNumber !== "-" ? job.masterBlNumber : (job.blOrAwbNumber !== "-" ? job.blOrAwbNumber : "-");
  const carrierName = vendor?.name || job.vesselOrFlight || "-";

  const totalPackages = job.cargoDetails.length > 0
    ? job.cargoDetails.reduce((sum, c) => sum + (c.pieces || 0), 0)
    : (job.packageCount || 0);

  const totalGrossWeight = job.cargoDetails.length > 0
    ? job.cargoDetails.reduce((sum, c) => sum + Number(c.grossWeight || 0), 0)
    : (job.grossWeightKg || 0);

  const totalCbm = job.cargoDetails.length > 0
    ? job.cargoDetails.reduce((sum, c) => sum + Number(c.volumeCbm || 0), 0)
    : (job.volumeWeightCbm || 0);

  const containerSummary = job.containerNumber && job.containerNumber !== "-" ? job.containerNumber : "-";
  const sealSummary = job.sealNumber && job.sealNumber !== "-" ? job.sealNumber : "-";
  const containerCount = job.containerCount || (containerSummary !== "-" ? 1 : 0);

  return (
    <Page size="A4" style={blStyles.page}>
      {/* ── TOP HEADER ────────────────────────────────────────────────── */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 }}>
        <View>
          <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: oceanBlue, letterSpacing: 0.5 }}>
            {tenant.legalName || tenant.companyName}
          </Text>
          <Text style={{ fontSize: 6, color: "#64748b" }}>
            MULTIMODAL TRANSPORT OPERATOR & OCEAN FREIGHT FORWARDER
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: oceanBlue }}>
            BILL OF LADING
          </Text>
          <Text style={{ fontSize: 6, color: "#64748b" }}>
            FOR MULTIMODAL TRANSPORT OR PORT-TO-PORT SHIPMENT
          </Text>
        </View>
      </View>

      {/* ── MAIN MARITIME B/L FRAME ───────────────────────────────────── */}
      <View style={blStyles.frame}>
        {/* ROW 1: PARTIES & REFERENCE */}
        <View style={[{ flexDirection: "row" }, blStyles.rowBorder]}>
          {/* Left Column: Shipper, Consignee, Notify */}
          <View style={[{ width: "55%" }, blStyles.colBorder]}>
            <View style={[blStyles.box, blStyles.rowBorder, { minHeight: 48 }]}>
              <Text style={blStyles.label}>Shipper / Exporter</Text>
              <Text style={blStyles.valueBold}>{customer.name}</Text>
              <Text style={blStyles.valueText}>{customer.address}</Text>
              {customer.taxId && customer.taxId !== "-" && (
                <Text style={blStyles.valueText}>NPWP: {customer.taxId}</Text>
              )}
              <Text style={blStyles.valueText}>Tel: {customer.phone || "-"}</Text>
            </View>

            <View style={[blStyles.box, blStyles.rowBorder, { minHeight: 48 }]}>
              <Text style={blStyles.label}>Consignee (or order of)</Text>
              <Text style={blStyles.valueBold}>
                {job.consigneeName || (job.bound === "EXPORT" ? "TO ORDER OF SHIPPER" : customer.name)}
              </Text>
              <Text style={blStyles.valueText}>
                {job.consigneeAddress || (job.bound === "EXPORT" ? (job.destinationPort || "-") : customer.address)}
              </Text>
              <Text style={blStyles.valueText}>
                NOTIFY APPLICANT UPON ARRIVAL
              </Text>
            </View>

            <View style={[blStyles.box, { minHeight: 40 }]}>
              <Text style={blStyles.label}>Notify Party (Carrier not responsible for failure to notify)</Text>
              <Text style={blStyles.valueBold}>
                {job.notifyParty || (customer.contactPerson ? `${customer.contactPerson} (AGENT)` : "SAME AS CONSIGNEE")}
              </Text>
              <Text style={blStyles.valueText}>TEL / PIC: {customer.phone || customer.email || "-"}</Text>
            </View>
          </View>

          {/* Right Column: B/L Number, Booking Ref, Carrier */}
          <View style={{ width: "45%" }}>
            <View style={[blStyles.box, blStyles.rowBorder, { minHeight: 48, backgroundColor: "#f8fafc" }]}>
              <Text style={blStyles.label}>Bill of Lading No.</Text>
              <Text style={[blStyles.valueBold, { fontSize: 11, color: "#1d4ed8", marginVertical: 2 }]}>
                {blNumber}
              </Text>
              <Text style={[blStyles.valueText, { fontSize: 6 }]}>
                BOOKING / JOB FILE NO: {job.jobFileNumber}
              </Text>
              <Text style={[blStyles.valueText, { fontSize: 6 }]}>
                EXPORT REF: {job.houseBlNumber !== "-" ? job.houseBlNumber : (job.masterBlNumber !== "-" ? job.masterBlNumber : "-")}
              </Text>
              {job.customerRefNo && (
                <Text style={[blStyles.valueText, { fontSize: 6, color: "#1e3a8a" }]}>
                  BROKER / PO REF: {job.customerRefNo}
                </Text>
              )}
              {job.shippingInstructionNo && (
                <Text style={[blStyles.valueText, { fontSize: 6, color: "#1e3a8a" }]}>
                  SHIPPING INSTRUCTION (SI): {job.shippingInstructionNo}
                </Text>
              )}
              {job.commercialInvoiceNo && (
                <Text style={[blStyles.valueText, { fontSize: 6, color: "#1e3a8a" }]}>
                  COMMERCIAL INVOICE (CI): {job.commercialInvoiceNo}
                </Text>
              )}
            </View>

            <View style={[blStyles.box, blStyles.rowBorder, { minHeight: 48 }]}>
              <Text style={blStyles.label}>Ocean Carrier / Vessel Operator</Text>
              <Text style={blStyles.valueBold}>{carrierName}</Text>
              <Text style={blStyles.valueText}>SERVICE TYPE: FCL / FCL (CY / CY)</Text>
              <Text style={blStyles.valueText}>INCOTERM: {job.incoterm || "-"}</Text>
            </View>

            <View style={[blStyles.box, { minHeight: 40 }]}>
              <Text style={blStyles.label}>Pre-Carriage By / Place of Receipt</Text>
              <Text style={blStyles.valueBold}>MERCHANT HAULAGE</Text>
              <Text style={blStyles.valueText}>PLACE OF RECEIPT: {job.originPort ? job.originPort.split("-")[0].trim() : "-"}</Text>
            </View>
          </View>
        </View>

        {/* ROW 2: VESSEL, POL, POD, DELIVERY */}
        <View style={[{ flexDirection: "row" }, blStyles.rowBorder]}>
          <View style={[blStyles.box, blStyles.colBorder, { width: "28%" }]}>
            <Text style={blStyles.label}>Ocean Vessel / Voyage No.</Text>
            <Text style={blStyles.valueBold}>
              {job.vesselOrFlight || "-"} {job.voyageOrFlightNumber && job.voyageOrFlightNumber !== "-" ? job.voyageOrFlightNumber : ""}
            </Text>
          </View>
          <View style={[blStyles.box, blStyles.colBorder, { width: "27%" }]}>
            <Text style={blStyles.label}>Port of Loading (POL)</Text>
            <Text style={blStyles.valueBold}>{job.originPort || "-"}</Text>
          </View>
          <View style={[blStyles.box, blStyles.colBorder, { width: "25%" }]}>
            <Text style={blStyles.label}>Port of Discharge (POD)</Text>
            <Text style={blStyles.valueBold}>{job.destinationPort || "-"}</Text>
          </View>
          <View style={[blStyles.box, { width: "20%" }]}>
            <Text style={blStyles.label}>Place of Delivery</Text>
            <Text style={blStyles.valueBold}>{job.destinationPort ? job.destinationPort.split("-")[0].trim() : "-"}</Text>
          </View>
        </View>

        {/* ROW 3: CARGO & CONTAINER TABLE */}
        <View style={blStyles.rowBorder}>
          {/* Header */}
          <View style={[{ flexDirection: "row", backgroundColor: "#f1f5f9", minHeight: 18, alignItems: "center" }, blStyles.rowBorder]}>
            <View style={[blStyles.box, blStyles.colBorder, { width: "28%" }]}>
              <Text style={blStyles.thText}>Container No. / Seal No. / Marks</Text>
            </View>
            <View style={[blStyles.box, blStyles.colBorder, { width: "15%" }]}>
              <Text style={blStyles.thText}>No. & Kind of Packages</Text>
            </View>
            <View style={[blStyles.box, blStyles.colBorder, { width: "33%" }]}>
              <Text style={blStyles.thText}>Description of Goods</Text>
            </View>
            <View style={[blStyles.box, blStyles.colBorder, { width: "12%" }]}>
              <Text style={blStyles.thText}>Gross Weight (Kg)</Text>
            </View>
            <View style={[blStyles.box, { width: "12%" }]}>
              <Text style={blStyles.thText}>Measurement (CBM)</Text>
            </View>
          </View>

          {/* Body */}
          <View style={{ flexDirection: "row", minHeight: 110 }}>
            <View style={[blStyles.box, blStyles.colBorder, { width: "28%", paddingTop: 6 }]}>
              <Text style={[blStyles.valueBold, { fontSize: 8 }]}>{containerSummary}</Text>
              {sealSummary !== "-" && (
                <Text style={[blStyles.valueText, { fontSize: 6.5, marginTop: 4 }]}>
                  SEAL: {sealSummary}
                </Text>
              )}
              <Text style={[blStyles.valueText, { fontSize: 6.5, marginTop: 2 }]}>
                MARKS & NOS: AS ADDRESSED
              </Text>
            </View>
            <View style={[blStyles.box, blStyles.colBorder, { width: "15%", paddingTop: 6, alignItems: "center" }]}>
              <Text style={blStyles.valueBold}>{totalPackages > 0 ? `${totalPackages} UNITS` : "-"}</Text>
              <Text style={[blStyles.valueText, { fontSize: 6.5 }]}>{job.packageType || "PACKAGES"}</Text>
            </View>
            <View style={[blStyles.box, blStyles.colBorder, { width: "33%", paddingTop: 6 }]}>
              <Text style={[blStyles.valueBold, { fontSize: 8, marginBottom: 3 }]}>
                {job.cargoDetails[0]?.commodityName || job.commodityDescription || "GENERAL CARGO"}
              </Text>
              {job.cargoDetails[0]?.hsCode && (
                <Text style={[blStyles.valueText, { fontSize: 6.5, marginBottom: 2 }]}>
                  HS CODE: {job.cargoDetails[0].hsCode}
                </Text>
              )}
              <Text style={[blStyles.valueText, { fontSize: 6.5 }]}>
                CLEAN ON BOARD OCEAN VESSEL.
              </Text>
              <Text style={[blStyles.valueText, { fontSize: 6.5 }]}>
                SHIPPERS LOAD, STOW, COUNT AND SEAL (SLAC).
              </Text>
            </View>
            <View style={[blStyles.box, blStyles.colBorder, { width: "12%", paddingTop: 6, alignItems: "flex-end" }]}>
              <Text style={blStyles.valueBold}>{totalGrossWeight > 0 ? formatNum(totalGrossWeight, 2) : "-"}</Text>
              <Text style={[blStyles.valueText, { fontSize: 6 }]}>KGS</Text>
            </View>
            <View style={[blStyles.box, { width: "12%", paddingTop: 6, alignItems: "flex-end" }]}>
              <Text style={blStyles.valueBold}>{totalCbm > 0 ? formatNum(totalCbm, 3) : "-"}</Text>
              <Text style={[blStyles.valueText, { fontSize: 6 }]}>CBM</Text>
            </View>
          </View>

          {/* Table Totals */}
          <View style={[{ flexDirection: "row", backgroundColor: "#f8fafc", height: 18, alignItems: "center" }, blStyles.rowBorder]}>
            <View style={[blStyles.box, blStyles.colBorder, { width: "28%" }]}>
              <Text style={blStyles.valueBold}>TOTAL CONTAINERS: {containerCount}</Text>
            </View>
            <View style={[blStyles.box, blStyles.colBorder, { width: "15%", alignItems: "center" }]}>
              <Text style={blStyles.valueBold}>{totalPackages > 0 ? `${totalPackages} PKGS` : "-"}</Text>
            </View>
            <View style={[blStyles.box, blStyles.colBorder, { width: "33%" }]}>
              <Text style={blStyles.valueText}>SAY: TOTAL {containerCount} CONTAINER(S)</Text>
            </View>
            <View style={[blStyles.box, blStyles.colBorder, { width: "12%", alignItems: "flex-end" }]}>
              <Text style={blStyles.valueBold}>{totalGrossWeight > 0 ? formatNum(totalGrossWeight, 2) : "-"}</Text>
            </View>
            <View style={[blStyles.box, { width: "12%", alignItems: "flex-end" }]}>
              <Text style={blStyles.valueBold}>{totalCbm > 0 ? formatNum(totalCbm, 3) : "-"}</Text>
            </View>
          </View>
        </View>

        {/* ROW 4: MARITIME CLAUSES & SIGNATURE */}
        <View style={[{ flexDirection: "row" }, blStyles.rowBorder]}>
          <View style={[{ width: "60%" }, blStyles.colBorder]}>
            <View style={[blStyles.box, blStyles.rowBorder, { minHeight: 22 }]}>
              <Text style={blStyles.label}>Freight & Charges</Text>
              <Text style={blStyles.valueBold}>
                {job.incoterm === "FOB" || job.incoterm === "EXW" ? "FREIGHT COLLECT" : "FREIGHT PREPAID"}
              </Text>
            </View>
            <View style={[blStyles.box, { minHeight: 52 }]}>
              <Text style={[blStyles.valueText, { fontSize: 4.8, color: "#64748b", lineHeight: 1.2 }]}>
                RECEIVED by the Carrier the Goods as specified above in apparent good order and condition unless otherwise stated, to be transported to such place as agreed, authorized or permitted herein and subject to all the terms and conditions appearing on the front and reverse of this Bill of Lading. IN WITNESS whereof the number of original Bills of Lading stated below have been signed, one of which being accomplished the others to be void.
              </Text>
            </View>
          </View>

          <View style={{ width: "40%" }}>
            <View style={[blStyles.box, blStyles.rowBorder, { minHeight: 22 }]}>
              <Text style={blStyles.label}>Number of Original B/Ls</Text>
              <Text style={blStyles.valueBold}>THREE (3) ORIGINALS</Text>
            </View>
            <View style={[blStyles.box, { minHeight: 52, alignItems: "center", justifyContent: "space-between" }]}>
              <Text style={blStyles.label}>Signed for and on behalf of the Carrier</Text>
              <Text style={[blStyles.valueBold, { fontSize: 8 }]}>{tenant.legalName || tenant.companyName}</Text>
              <Text style={[blStyles.valueText, { fontSize: 6, color: "#64748b" }]}>
                AS AGENT FOR THE CARRIER · {formatDateDMY(job.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── FOOTER NOTATION ───────────────────────────────────────────── */}
      <View style={{ marginTop: 6, flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 6.5, color: "#94a3b8" }}>
          ORIGINAL BILL OF LADING — NON-NEGOTIABLE UNLESS CONSIGNED TO ORDER
        </Text>
        <Text style={{ fontSize: 6.5, color: "#94a3b8" }}>
          HALAMAN 1 DARI 1
        </Text>
      </View>
    </Page>
  );
}

// ============================================================================
// MAIN COMPONENT (Conditional rendering based on transportMode / bizMode)
// ============================================================================
export function AwbPDFDocument(props: AwbPDFProps) {
  const isAir = props.job.bizMode === "AIR" || props.job.transportMode === "AIR";

  return (
    <Document
      title={isAir ? `AWB-${props.job.jobFileNumber}` : `BL-${props.job.jobFileNumber}`}
      author={props.tenant.companyName}
      subject={isAir ? "IATA Standard Air Waybill" : "Ocean Bill of Lading"}
    >
      {isAir ? <IataAwbPage {...props} /> : <OceanBlPage {...props} />}
    </Document>
  );
}
