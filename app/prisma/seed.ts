import {
  PrismaClient,
  UserRole,
  SubscriptionStatus,
  PrefixType,
  VendorCategory,
  PortType,
  ChargeCategory,
  JobFileStatus,
  TransportMode,
  ShipmentType,
  BillingStatus,
  InvoiceStatus,
  UnitCategory,
  BizMode,
  Bound,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Comprehensive Enterprise Multi-Tenant DB Seed...");

  // ==============================================================================
  // 1. GLOBAL MASTER PORTS (Kamus Data Master Pelabuhan & Bandara Sedunia)
  // Shared globally across all tenants (UN/LOCODE standard)
  // ==============================================================================
  console.log("-> Seeding Global Master Ports (UN/LOCODE)...");
  const portsData = [
    {
      portCode: "IDJKT",
      portName: "Tanjung Priok Port",
      portType: PortType.SEA_PORT,
      city: "Jakarta",
      countryCode: "ID",
      countryName: "Indonesia",
      latitude: -6.1042,
      longitude: 106.8833,
    },
    {
      portCode: "IDCGK",
      portName: "Soekarno-Hatta International Airport Cargo Terminal",
      portType: PortType.AIR_PORT,
      city: "Tangerang / Jakarta",
      countryCode: "ID",
      countryName: "Indonesia",
      latitude: -6.1256,
      longitude: 106.6559,
    },
    {
      portCode: "IDSUB",
      portName: "Tanjung Perak Port",
      portType: PortType.SEA_PORT,
      city: "Surabaya",
      countryCode: "ID",
      countryName: "Indonesia",
      latitude: -7.1994,
      longitude: 112.7303,
    },
    {
      portCode: "SGSIN",
      portName: "Port of Singapore (PSA)",
      portType: PortType.SEA_PORT,
      city: "Singapore",
      countryCode: "SG",
      countryName: "Singapore",
      latitude: 1.2644,
      longitude: 103.8222,
    },
    {
      portCode: "SIN",
      portName: "Singapore Changi Airport Air Cargo Complex",
      portType: PortType.AIR_PORT,
      city: "Singapore",
      countryCode: "SG",
      countryName: "Singapore",
      latitude: 1.3644,
      longitude: 103.9915,
    },
    {
      portCode: "NLRTM",
      portName: "Port of Rotterdam (Maasvlakte)",
      portType: PortType.SEA_PORT,
      city: "Rotterdam",
      countryCode: "NL",
      countryName: "Netherlands",
      latitude: 51.9244,
      longitude: 4.4777,
    },
    {
      portCode: "USNYC",
      portName: "Port of New York & New Jersey",
      portType: PortType.SEA_PORT,
      city: "New York / Newark",
      countryCode: "US",
      countryName: "United States",
      latitude: 40.6892,
      longitude: -74.0445,
    },
  ];

  const portMap = new Map<string, string>();
  for (const p of portsData) {
    const port = await prisma.masterPort.upsert({
      where: { portCode: p.portCode },
      update: {
        portName: p.portName,
        portType: p.portType,
        city: p.city,
        countryName: p.countryName,
        latitude: p.latitude,
        longitude: p.longitude,
      },
      create: {
        portCode: p.portCode,
        portName: p.portName,
        portType: p.portType,
        city: p.city,
        countryCode: p.countryCode,
        countryName: p.countryName,
        latitude: p.latitude,
        longitude: p.longitude,
      },
    });
    portMap.set(p.portCode, port.id);
  }

  // ==============================================================================
  // 2. GLOBAL MASTER ROUTES (Jalur Logistik Utama Maritim & Kargo Udara)
  // ==============================================================================
  console.log("-> Seeding Global Master Routes...");
  const routesData = [
    {
      routeCode: "IDJKT-SGSIN",
      routeName: "Jakarta to Singapore Main Maritime Corridor",
      originCode: "IDJKT",
      destinationCode: "SGSIN",
      transportMode: TransportMode.SEA,
      estTransitDays: 3,
    },
    {
      routeCode: "IDCGK-SIN",
      routeName: "Jakarta to Singapore Air Express Cargo Lane",
      originCode: "IDCGK",
      destinationCode: "SIN",
      transportMode: TransportMode.AIR,
      estTransitDays: 1,
    },
    {
      routeCode: "IDJKT-NLRTM",
      routeName: "Asia-Europe Trunk Route (Priok to Rotterdam)",
      originCode: "IDJKT",
      destinationCode: "NLRTM",
      transportMode: TransportMode.SEA,
      estTransitDays: 24,
    },
  ];

  for (const r of routesData) {
    const originId = portMap.get(r.originCode);
    const destId = portMap.get(r.destinationCode);
    if (originId && destId) {
      await prisma.masterRoute.upsert({
        where: { routeCode: r.routeCode },
        update: {
          routeName: r.routeName,
          originPortId: originId,
          destinationPortId: destId,
          transportMode: r.transportMode,
          estTransitDays: r.estTransitDays,
        },
        create: {
          routeCode: r.routeCode,
          routeName: r.routeName,
          originPortId: originId,
          destinationPortId: destId,
          transportMode: r.transportMode,
          estTransitDays: r.estTransitDays,
        },
      });
    }
  }

  // ==============================================================================
  // 3. GLOBAL MASTER CURRENCIES (Opsi Mata Uang, Simbol & Kurs Konversi Standar)
  // ==============================================================================
  console.log("-> Seeding Global Master Currencies (IDR, USD, SGD, EUR)...");
  const currenciesData = [
    {
      code: "IDR",
      name: "Indonesian Rupiah",
      symbol: "Rp",
      exchangeRate: 1.0,
      isBaseCurrency: true,
    },
    {
      code: "USD",
      name: "United States Dollar",
      symbol: "$",
      exchangeRate: 16000.0,
      isBaseCurrency: false,
    },
    {
      code: "SGD",
      name: "Singapore Dollar",
      symbol: "S$",
      exchangeRate: 12000.0,
      isBaseCurrency: false,
    },
    {
      code: "EUR",
      name: "Euro",
      symbol: "€",
      exchangeRate: 17500.0,
      isBaseCurrency: false,
    },
  ];

  const currencyMap = new Map<string, string>();
  for (const c of currenciesData) {
    const existing = await prisma.masterCurrency.findFirst({
      where: { tenantId: null, code: c.code },
    });
    let cur;
    if (existing) {
      cur = await prisma.masterCurrency.update({
        where: { id: existing.id },
        data: {
          name: c.name,
          symbol: c.symbol,
          exchangeRate: c.exchangeRate,
          isBaseCurrency: c.isBaseCurrency,
          isActive: true,
        },
      });
    } else {
      cur = await prisma.masterCurrency.create({
        data: {
          tenantId: null,
          code: c.code,
          name: c.name,
          symbol: c.symbol,
          exchangeRate: c.exchangeRate,
          isBaseCurrency: c.isBaseCurrency,
          isActive: true,
        },
      });
    }
    currencyMap.set(c.code, cur.id);
  }

  // ==============================================================================
  // 4. GLOBAL MASTER UNITS (Satuan & Dimensi Kargo/Armada Standar Universal)
  // WEIGHT, VOLUME, PACKAGE, CONTAINER, TRUCK dengan detail kapasitas Kg/CBM
  // ==============================================================================
  console.log("-> Seeding Global Master Units & Dimensions (WEIGHT, VOLUME, PACKAGE, CONTAINER, TRUCK)...");
  const unitsData: Array<{
    unitCode: string;
    unitName: string;
    unitCategory: UnitCategory;
    symbol: string;
    maxWeightKg?: number;
    maxVolumeCbm?: number;
    tareWeightKg?: number;
    lengthM?: number;
    widthM?: number;
    heightM?: number;
    description: string;
  }> = [
    // --- Kategori WEIGHT ---
    {
      unitCode: "KG",
      unitName: "Kilograms",
      unitCategory: UnitCategory.WEIGHT,
      symbol: "kg",
      description: "Satuan dasar berat metrik standar logistik internasional (1 Kg = 1.000 g)",
    },
    {
      unitCode: "KGS",
      unitName: "Kilograms (Alias KGS)",
      unitCategory: UnitCategory.WEIGHT,
      symbol: "kg",
      description: "Alias standar dokumen B/L dan AWB untuk Kilograms",
    },
    {
      unitCode: "TON",
      unitName: "Metric Ton",
      unitCategory: UnitCategory.WEIGHT,
      symbol: "ton",
      maxWeightKg: 1000,
      description: "Satuan metrik ton untuk muatan berat / curah (1 Ton = 1.000 Kg)",
    },
    {
      unitCode: "LBS",
      unitName: "Pounds (Imperial)",
      unitCategory: UnitCategory.WEIGHT,
      symbol: "lbs",
      description: "Satuan berat sistem imperial untuk rute Amerika/Inggris (1 Lb ≈ 0.453592 Kg)",
    },

    // --- Kategori VOLUME ---
    {
      unitCode: "CBM",
      unitName: "Cubic Meter",
      unitCategory: UnitCategory.VOLUME,
      symbol: "m³",
      description: "Satuan volume kargo standar angkutan laut & udara internasional (m³)",
    },
    {
      unitCode: "LTR",
      unitName: "Liters",
      unitCategory: UnitCategory.VOLUME,
      symbol: "L",
      maxVolumeCbm: 0.001,
      description: "Satuan volume cairan / fluida tangki (1.000 Liter = 1 CBM)",
    },

    // --- Kategori PACKAGE ---
    {
      unitCode: "CTN",
      unitName: "Carton Box",
      unitCategory: UnitCategory.PACKAGE,
      symbol: "ctn",
      description: "Kemasan karton bergelombang standar pabrikan untuk barang ekspor/impor",
    },
    {
      unitCode: "PLT",
      unitName: "Wooden / Plastic Pallet",
      unitCategory: UnitCategory.PACKAGE,
      symbol: "plt",
      maxWeightKg: 1500,
      maxVolumeCbm: 1.8,
      description: "Palet kayu / plastik standar industri (120 x 100 x 15 cm)",
    },
    {
      unitCode: "DRUM",
      unitName: "Steel / Plastic Drum",
      unitCategory: UnitCategory.PACKAGE,
      symbol: "drm",
      maxVolumeCbm: 0.25,
      description: "Drum silinder untuk komoditas kimia, oli, atau cairan (kapasitas 200 - 220 Liter)",
    },
    {
      unitCode: "BAG",
      unitName: "Bags / Sacks",
      unitCategory: UnitCategory.PACKAGE,
      symbol: "bag",
      maxWeightKg: 50,
      description: "Karung anyaman / kantong material curah padat (kapasitas 25 - 50 Kg)",
    },

    // --- Kategori CONTAINER ---
    {
      unitCode: "20DC",
      unitName: "20ft Dry Container (20'DC / 20GP)",
      unitCategory: UnitCategory.CONTAINER,
      symbol: "20'DC",
      maxWeightKg: 28200,
      maxVolumeCbm: 33.2,
      tareWeightKg: 2300,
      lengthM: 5.898,
      widthM: 2.352,
      heightM: 2.393,
      description: "Kontainer kering standar 20 kaki (Payload max 28.2 Ton, Volume 33.2 CBM, Tare 2.3 Ton)",
    },
    {
      unitCode: "40DC",
      unitName: "40ft Dry Container (40'DC / 40GP)",
      unitCategory: UnitCategory.CONTAINER,
      symbol: "40'DC",
      maxWeightKg: 26700,
      maxVolumeCbm: 67.7,
      tareWeightKg: 3780,
      lengthM: 12.032,
      widthM: 2.352,
      heightM: 2.393,
      description: "Kontainer kering standar 40 kaki (Payload max 26.7 Ton, Volume 67.7 CBM, Tare 3.78 Ton)",
    },
    {
      unitCode: "40HC",
      unitName: "40ft High Cube Container (40'HC / 40HQ)",
      unitCategory: UnitCategory.CONTAINER,
      symbol: "40'HC",
      maxWeightKg: 28600,
      maxVolumeCbm: 76.4,
      tareWeightKg: 3900,
      lengthM: 12.032,
      widthM: 2.352,
      heightM: 2.698,
      description: "Kontainer tinggi 40 kaki High Cube untuk kargo bervolume ekstra (Payload max 28.6 Ton, Volume 76.4 CBM)",
    },
    {
      unitCode: "TEU",
      unitName: "Twenty-Foot Equivalent Unit (20' Standard)",
      unitCategory: UnitCategory.CONTAINER,
      symbol: "TEU",
      maxWeightKg: 28200,
      maxVolumeCbm: 33.2,
      tareWeightKg: 2300,
      lengthM: 5.898,
      widthM: 2.352,
      heightM: 2.393,
      description: "Satuan hitung standar armada pengapalan kontainer laut 20 kaki",
    },
    {
      unitCode: "FEU",
      unitName: "Forty-Foot Equivalent Unit (40' Standard)",
      unitCategory: UnitCategory.CONTAINER,
      symbol: "FEU",
      maxWeightKg: 28600,
      maxVolumeCbm: 76.4,
      tareWeightKg: 3900,
      lengthM: 12.032,
      widthM: 2.352,
      heightM: 2.698,
      description: "Satuan hitung standar armada pengapalan kontainer laut 40 kaki",
    },
    {
      unitCode: "LCL",
      unitName: "Less than Container Load (LCL Consolidation)",
      unitCategory: UnitCategory.CONTAINER,
      symbol: "LCL",
      description: "Muatan konsolidasi gabungan parsial kontainer laut (per CBM / Ton)",
    },

    // --- Kategori TRUCK ---
    {
      unitCode: "CDE",
      unitName: "Colt Diesel Engkel (CDE - 4 Roda)",
      unitCategory: UnitCategory.TRUCK,
      symbol: "CDE",
      maxWeightKg: 2500,
      maxVolumeCbm: 9.0,
      lengthM: 3.10,
      widthM: 1.70,
      heightM: 1.70,
      description: "Truk ringan 4 roda untuk distribusi darat & perkotaan (Kapasitas muatan max 2.5 Ton / 9 CBM)",
    },
    {
      unitCode: "CDD",
      unitName: "Colt Diesel Double (CDD - 6 Roda)",
      unitCategory: UnitCategory.TRUCK,
      symbol: "CDD",
      maxWeightKg: 5000,
      maxVolumeCbm: 14.0,
      lengthM: 4.20,
      widthM: 2.00,
      heightM: 2.00,
      description: "Truk 6 roda antar-kota muatan sedang (Kapasitas muatan max 5.0 Ton / 14 CBM)",
    },
    {
      unitCode: "WINGBOX",
      unitName: "Wingbox Truck (Tronton 10 Roda)",
      unitCategory: UnitCategory.TRUCK,
      symbol: "WINGBOX",
      maxWeightKg: 20000,
      maxVolumeCbm: 45.0,
      lengthM: 9.40,
      widthM: 2.40,
      heightM: 2.40,
      description: "Truk besar Wingbox 3 sisi buka hidrolik (Kapasitas muatan max 20 Ton / 45 CBM)",
    },
    {
      unitCode: "TRIP",
      unitName: "Haulage Trucking Trip (Per Ritase)",
      unitCategory: UnitCategory.TRUCK,
      symbol: "trip",
      description: "Satuan penghitungan biaya per satu kali ritase perjalanan angkutan darat",
    },

    // --- Kategori TIME (Durasi Waktu Operasional) ---
    {
      unitCode: "DAYS",
      unitName: "Days (Hari Operasional)",
      unitCategory: UnitCategory.TIME,
      symbol: "day",
      description: "Satuan durasi harian untuk sewa gudang, storage, demurrage, atau penumpukan (UNEX / TPS)",
    },
    {
      unitCode: "MONTHS",
      unitName: "Months (Bulan Operasional)",
      unitCategory: UnitCategory.TIME,
      symbol: "mo",
      description: "Satuan durasi bulanan sewa gudang / armada",
    },

    // --- Kategori DOCUMENT (Satuan Dokumen Freight Forwarding) ---
    {
      unitCode: "HBL",
      unitName: "House Bill of Lading (Per Dokumen HBL/HAWB)",
      unitCategory: UnitCategory.DOCUMENT,
      symbol: "HBL",
      description: "Satuan penagihan per dokumen House B/L atau House AWB (LX Pantos)",
    },
    {
      unitCode: "AWB",
      unitName: "Air Waybill (Per Dokumen AWB)",
      unitCategory: UnitCategory.DOCUMENT,
      symbol: "AWB",
      description: "Satuan penagihan per dokumen Air Waybill (Air Asia / Maskapai Kargo)",
    },
    {
      unitCode: "MBL",
      unitName: "Master Bill of Lading (Per Dokumen MBL/MAWB)",
      unitCategory: UnitCategory.DOCUMENT,
      symbol: "MBL",
      description: "Satuan penagihan per dokumen Master B/L atau Master AWB",
    },
    {
      unitCode: "SHPT",
      unitName: "Shipment (Per Pengiriman Kargo)",
      unitCategory: UnitCategory.DOCUMENT,
      symbol: "shpt",
      description: "Satuan penagihan per berkas order pengiriman",
    },
  ];

  const unitMap = new Map<string, string>();
  for (const u of unitsData) {
    const unitObj = await prisma.masterUnit.upsert({
      where: { unitCode: u.unitCode },
      update: {
        unitName: u.unitName,
        unitCategory: u.unitCategory,
        symbol: u.symbol,
        maxWeightKg: u.maxWeightKg,
        maxVolumeCbm: u.maxVolumeCbm,
        tareWeightKg: u.tareWeightKg,
        lengthM: u.lengthM,
        widthM: u.widthM,
        heightM: u.heightM,
        description: u.description,
        isActive: true,
      },
      create: {
        unitCode: u.unitCode,
        unitName: u.unitName,
        unitCategory: u.unitCategory,
        symbol: u.symbol,
        maxWeightKg: u.maxWeightKg,
        maxVolumeCbm: u.maxVolumeCbm,
        tareWeightKg: u.tareWeightKg,
        lengthM: u.lengthM,
        widthM: u.widthM,
        heightM: u.heightM,
        description: u.description,
        isActive: true,
      },
    });
    unitMap.set(u.unitCode, unitObj.id);
  }

  // ==============================================================================
  // 4b. GLOBAL MASTER ITEM TYPES (Kategori & Klasifikasi Komoditas Muatan Barang)
  // Shared globally across all tenants for shipment compliance & documentation
  // ==============================================================================
  console.log("-> Seeding Global Master Item Types (General Cargo, Perishable, DG, Electronics, etc.)...");
  const itemTypesData: Array<{
    itemCode: string;
    name: string;
    isDangerousGoods: boolean;
    unNumber?: string;
    classDg?: string;
    requiresColdChain: boolean;
    minTemperature?: number;
    maxTemperature?: number;
    description: string;
  }> = [
    {
      itemCode: "GEN",
      name: "General Cargo",
      isDangerousGoods: false,
      requiresColdChain: false,
      description: "Barang umum kering non-berbahaya, permesinan ringan, suku cadang, dan barang konsumsi.",
    },
    {
      itemCode: "PERISH",
      name: "Perishable Cargo (Fresh & Frozen)",
      isDangerousGoods: false,
      requiresColdChain: true,
      minTemperature: -20.0,
      maxTemperature: 4.0,
      description: "Komoditas mudah rusak (buah segar, sayuran, seafood, daging beku) memerlukan cold chain kontainer reefer.",
    },
    {
      itemCode: "DG",
      name: "Dangerous Goods (DG / B3)",
      isDangerousGoods: true,
      unNumber: "UN 1993",
      classDg: "Class 3 (Flammable Liquid)",
      requiresColdChain: false,
      description: "Bahan berbahaya dan beracun (B3), bahan kimia mudah terbakar, baterai lithium, memerlukan penanganan MSDS & deklarasi IMO/IATA.",
    },
    {
      itemCode: "ELEC",
      name: "Consumer Electronics & High-Tech",
      isDangerousGoods: false,
      requiresColdChain: false,
      description: "Perangkat elektronik konsumen, semikonduktor, komponen komputer, dan instrumen telekomunikasi bernilai tinggi.",
    },
    {
      itemCode: "TEXTILE",
      name: "Textile, Fabric & Finished Garments",
      isDangerousGoods: false,
      requiresColdChain: false,
      description: "Tekstil gulungan, pakaian jadi ekspor, alas kaki, dan bahan baku garmen.",
    },
    {
      itemCode: "AUTO",
      name: "Automotive & Heavy Machinery Parts",
      isDangerousGoods: false,
      requiresColdChain: false,
      description: "Suku cadang otomotif, mesin industri, komponen alat berat, dan transmisi mekanikal.",
    },
    {
      itemCode: "PHARMA",
      name: "Pharmaceuticals & Medical Supplies",
      isDangerousGoods: false,
      requiresColdChain: true,
      minTemperature: 2.0,
      maxTemperature: 8.0,
      description: "Obat-obatan farmasi, vaksin terkontrol suhu (+2°C s/d +8°C), dan perlengkapan medis steril.",
    },
  ];

  const itemTypeMap = new Map<string, string>();
  for (const it of itemTypesData) {
    const itemObj = await prisma.masterItemType.upsert({
      where: { itemCode: it.itemCode },
      update: {
        name: it.name,
        isDangerousGoods: it.isDangerousGoods,
        unNumber: it.unNumber,
        classDg: it.classDg,
        requiresColdChain: it.requiresColdChain,
        minTemperature: it.minTemperature,
        maxTemperature: it.maxTemperature,
        description: it.description,
        isActive: true,
      },
      create: {
        itemCode: it.itemCode,
        name: it.name,
        isDangerousGoods: it.isDangerousGoods,
        unNumber: it.unNumber,
        classDg: it.classDg,
        requiresColdChain: it.requiresColdChain,
        minTemperature: it.minTemperature,
        maxTemperature: it.maxTemperature,
        description: it.description,
        isActive: true,
      },
    });
    itemTypeMap.set(it.itemCode, itemObj.id);
  }

  // ==============================================================================
  // 4c. GLOBAL MASTER COMMODITIES (Komoditas & HS Code Klasifikasi Pabean)
  // Shared globally across all tenants for shipment compliance & documentation
  // ==============================================================================
  console.log("-> Seeding Global Master Commodities (General Cargo, Electronics, Tobacco)...");
  const commoditiesData = [
    {
      name: "General Cargo",
      hsCode: null,
      description: "Muatan kargo umum non-berbahaya dan tidak memerlukan penanganan khusus",
    },
    {
      name: "Electronics",
      hsCode: null,
      description: "Barang elektronik konsumen, komputer, semikonduktor, dan komponen telekomunikasi",
    },
    {
      name: "Tobacco (HS: 24039990)",
      hsCode: "24039990",
      description: "Produk tembakau olahan / rokok ekspor (Sesuai dokumen AWB Air Asia STICKS)",
    },
  ];

  const commodityMap = new Map<string, string>();
  for (const c of commoditiesData) {
    const existing = await prisma.masterCommodity.findFirst({
      where: { name: c.name },
    });
    if (existing) {
      const updated = await prisma.masterCommodity.update({
        where: { id: existing.id },
        data: {
          hsCode: c.hsCode,
          description: c.description,
          isActive: true,
        },
      });
      commodityMap.set(c.name, updated.id);
    } else {
      const created = await prisma.masterCommodity.create({
        data: {
          name: c.name,
          hsCode: c.hsCode,
          description: c.description,
          isActive: true,
        },
      });
      commodityMap.set(c.name, created.id);
    }
  }

  // ==============================================================================
  // 4d. GLOBAL MASTER INCOTERMS (International Commercial Terms)
  // Shared globally across all tenants: CIF, FOB, EXW, DDP, CFR
  // ==============================================================================
  console.log("-> Seeding Global Master Incoterms (CIF, FOB, EXW, DDP)...");
  const incotermsData = [
    {
      code: "CIF",
      name: "Cost, Insurance and Freight",
      description: "Penjual menanggung biaya pengangkutan dan asuransi hingga pelabuhan tujuan (Dokumen LX Pantos)",
    },
    {
      code: "FOB",
      name: "Free On Board",
      description: "Penjual bertanggung jawab hingga barang dimuat di atas kapal di pelabuhan muat",
    },
    {
      code: "EXW",
      name: "Ex Works",
      description: "Pembeli menanggung seluruh risiko dan biaya sejak barang diambil dari lokasi pabrik penjual",
    },
    {
      code: "DDP",
      name: "Delivered Duty Paid",
      description: "Penjual menanggung seluruh biaya termasuk bea masuk dan pajak hingga alamat pembeli",
    },
    {
      code: "CFR",
      name: "Cost and Freight",
      description: "Penjual menanggung biaya freight pengangkutan laut hingga pelabuhan tujuan tanpa asuransi",
    },
  ];

  const incotermMap = new Map<string, string>();
  for (const inc of incotermsData) {
    const incObj = await prisma.masterIncoterm.upsert({
      where: { code: inc.code },
      update: {
        name: inc.name,
        description: inc.description,
        isActive: true,
      },
      create: {
        code: inc.code,
        name: inc.name,
        description: inc.description,
        isActive: true,
      },
    });
    incotermMap.set(inc.code, incObj.id);
  }

  // ==============================================================================
  // 4b. GLOBAL MASTER GEOGRAPHICAL DATA (Provinsi, Kota, Kecamatan Indonesia)
  // Shared globally across all tenants for billing, taxation & shipment accuracy
  // ==============================================================================
  console.log("-> Seeding Global Master Geographical Data (Provinces, Cities, Districts)...");
  
  // 1. Jawa Barat -> Kota Bandung -> Sumur Bandung, Cicendo
  const provJabar = await prisma.masterProvince.upsert({
    where: { name: "Jawa Barat" },
    update: { code: "32", isActive: true },
    create: { code: "32", name: "Jawa Barat", isActive: true },
  });

  const cityBandung = await prisma.masterCity.upsert({
    where: {
      provinceId_name: {
        provinceId: provJabar.id,
        name: "Kota Bandung",
      },
    },
    update: { code: "3273", type: "KOTA", isActive: true },
    create: {
      provinceId: provJabar.id,
      code: "3273",
      name: "Kota Bandung",
      type: "KOTA",
      isActive: true,
    },
  });

  const distSumurBandung = await prisma.masterDistrict.upsert({
    where: {
      cityId_name: {
        cityId: cityBandung.id,
        name: "Sumur Bandung",
      },
    },
    update: { code: "327301", isActive: true },
    create: {
      cityId: cityBandung.id,
      code: "327301",
      name: "Sumur Bandung",
      isActive: true,
    },
  });

  const distCicendo = await prisma.masterDistrict.upsert({
    where: {
      cityId_name: {
        cityId: cityBandung.id,
        name: "Cicendo",
      },
    },
    update: { code: "327302", isActive: true },
    create: {
      cityId: cityBandung.id,
      code: "327302",
      name: "Cicendo",
      isActive: true,
    },
  });

  // 2. DKI Jakarta -> Jakarta Utara -> Tanjung Priok, Kelapa Gading
  const provDki = await prisma.masterProvince.upsert({
    where: { name: "DKI Jakarta" },
    update: { code: "31", isActive: true },
    create: { code: "31", name: "DKI Jakarta", isActive: true },
  });

  const cityJakut = await prisma.masterCity.upsert({
    where: {
      provinceId_name: {
        provinceId: provDki.id,
        name: "Jakarta Utara",
      },
    },
    update: { code: "3172", type: "KOTA", isActive: true },
    create: {
      provinceId: provDki.id,
      code: "3172",
      name: "Jakarta Utara",
      type: "KOTA",
      isActive: true,
    },
  });

  const distPriok = await prisma.masterDistrict.upsert({
    where: {
      cityId_name: {
        cityId: cityJakut.id,
        name: "Tanjung Priok",
      },
    },
    update: { code: "317201", isActive: true },
    create: {
      cityId: cityJakut.id,
      code: "317201",
      name: "Tanjung Priok",
      isActive: true,
    },
  });

  const distKelapaGading = await prisma.masterDistrict.upsert({
    where: {
      cityId_name: {
        cityId: cityJakut.id,
        name: "Kelapa Gading",
      },
    },
    update: { code: "317202", isActive: true },
    create: {
      cityId: cityJakut.id,
      code: "317202",
      name: "Kelapa Gading",
      isActive: true,
    },
  });

  // ==============================================================================
  // 5. SYSTEM DICTIONARIES (Dynamic Options DB-Driven)
  // ==============================================================================
  console.log("-> Seeding System Dictionaries...");
  const dictionaries = [
    // Incoterms
    { category: "INCOTERM", code: "FOB", label: "Free On Board (FOB)", sortOrder: 1, isDefault: true },
    { category: "INCOTERM", code: "CIF", label: "Cost, Insurance and Freight (CIF)", sortOrder: 2, isDefault: false },
    { category: "INCOTERM", code: "EXW", label: "Ex Works (EXW)", sortOrder: 3, isDefault: false },
    { category: "INCOTERM", code: "DDP", label: "Delivered Duty Paid (DDP)", sortOrder: 4, isDefault: false },
    { category: "INCOTERM", code: "CFR", label: "Cost and Freight (CFR)", sortOrder: 5, isDefault: false },

    // Package Types
    { category: "PACKAGE_TYPE", code: "20GP", label: "20' General Purpose Container (20GP)", sortOrder: 1, isDefault: true },
    { category: "PACKAGE_TYPE", code: "40GP", label: "40' General Purpose Container (40GP)", sortOrder: 2, isDefault: false },
    { category: "PACKAGE_TYPE", code: "40HQ", label: "40' High Cube Container (40HQ)", sortOrder: 3, isDefault: false },
    { category: "PACKAGE_TYPE", code: "PLT", label: "Wooden / Plastic Pallet", sortOrder: 4, isDefault: false },
    { category: "PACKAGE_TYPE", code: "CTN", label: "Corrugated Carton Box", sortOrder: 5, isDefault: false },
    { category: "PACKAGE_TYPE", code: "DRUM", label: "Steel / Plastic Drum", sortOrder: 6, isDefault: false },

    // Currencies
    { category: "CURRENCY", code: "IDR", label: "Indonesian Rupiah (Rp)", sortOrder: 1, isDefault: true },
    { category: "CURRENCY", code: "USD", label: "United States Dollar ($)", sortOrder: 2, isDefault: false },
    { category: "CURRENCY", code: "SGD", label: "Singapore Dollar (S$)", sortOrder: 3, isDefault: false },
  ];

  for (const dict of dictionaries) {
    const existing = await prisma.systemDictionary.findFirst({
      where: {
        tenantId: null,
        category: dict.category,
        code: dict.code,
      },
    });

    if (existing) {
      await prisma.systemDictionary.update({
        where: { id: existing.id },
        data: {
          label: dict.label,
          sortOrder: dict.sortOrder,
          isDefault: dict.isDefault,
        },
      });
    } else {
      await prisma.systemDictionary.create({
        data: {
          tenantId: null,
          category: dict.category,
          code: dict.code,
          label: dict.label,
          sortOrder: dict.sortOrder,
          isDefault: dict.isDefault,
        },
      });
    }
  }

  // ==============================================================================
  // 6. GLOBAL MASTER CHARGE CODES (Komponen Biaya Pengiriman Standard)
  // Linked to MasterCurrency and MasterUnit with isTaxable indicator
  // ==============================================================================
  console.log("-> Seeding Global Master Charge Codes (with Currency & Unit Relations)...");
  const idrCurrencyId = currencyMap.get("IDR");
  const teuUnitId = unitMap.get("TEU");
  const kgsUnitId = unitMap.get("KGS");
  const ctnUnitId = unitMap.get("CTN");
  const tripUnitId = unitMap.get("TRIP");

  const globalChargeCodes = [
    {
      chargeCode: "OFRT",
      chargeName: "Ocean Freight (Sea Freight)",
      category: ChargeCategory.FREIGHT,
      transportMode: TransportMode.SEA,
      currencyId: idrCurrencyId,
      currency: "IDR",
      unitId: teuUnitId,
      unit: "TEU",
      isTaxable: true,
      defaultPrice: 15000000,
    },
    {
      chargeCode: "AFRT",
      chargeName: "Air Freight Express Rate",
      category: ChargeCategory.FREIGHT,
      transportMode: TransportMode.AIR,
      currencyId: idrCurrencyId,
      currency: "IDR",
      unitId: kgsUnitId,
      unit: "KGS",
      isTaxable: true,
      defaultPrice: 25000000,
    },
    {
      chargeCode: "THC",
      chargeName: "Terminal Handling Charge (THC)",
      category: ChargeCategory.ORIGIN,
      transportMode: TransportMode.SEA,
      currencyId: idrCurrencyId,
      currency: "IDR",
      unitId: teuUnitId,
      unit: "TEU",
      isTaxable: true,
      defaultPrice: 2500000,
    },
    {
      chargeCode: "DOC_FEE",
      chargeName: "Bill of Lading / Documentation Fee",
      category: ChargeCategory.DOCUMENTATION,
      transportMode: null,
      currencyId: idrCurrencyId,
      currency: "IDR",
      unitId: ctnUnitId,
      unit: "CTN",
      isTaxable: true,
      defaultPrice: 450000,
    },
    {
      chargeCode: "TRK_INLAND",
      chargeName: "Inland Haulage / Trucking Container",
      category: ChargeCategory.ORIGIN,
      transportMode: TransportMode.INLAND,
      currencyId: idrCurrencyId,
      currency: "IDR",
      unitId: tripUnitId,
      unit: "TRIP",
      isTaxable: true,
      defaultPrice: 3800000,
    },
    {
      chargeCode: "CUST_EXP",
      chargeName: "Customs Clearance Export (PEB Filing)",
      category: ChargeCategory.ORIGIN,
      transportMode: null,
      currencyId: idrCurrencyId,
      currency: "IDR",
      unitId: tripUnitId,
      unit: "TRIP",
      isTaxable: false,
      defaultPrice: 750000,
    },
  ];

  for (const cc of globalChargeCodes) {
    const existing = await prisma.masterChargeCode.findFirst({
      where: { tenantId: null, chargeCode: cc.chargeCode },
    });
    if (existing) {
      await prisma.masterChargeCode.update({
        where: { id: existing.id },
        data: {
          chargeName: cc.chargeName,
          category: cc.category,
          transportMode: cc.transportMode,
          currencyId: cc.currencyId,
          currency: cc.currency,
          unitId: cc.unitId,
          unit: cc.unit,
          isTaxable: cc.isTaxable,
          defaultPrice: cc.defaultPrice,
        },
      });
    } else {
      await prisma.masterChargeCode.create({
        data: {
          tenantId: null,
          chargeCode: cc.chargeCode,
          chargeName: cc.chargeName,
          category: cc.category,
          transportMode: cc.transportMode,
          currencyId: cc.currencyId,
          currency: cc.currency,
          unitId: cc.unitId,
          unit: cc.unit,
          isTaxable: cc.isTaxable,
          defaultPrice: cc.defaultPrice,
        },
      });
    }
  }

  // ==============================================================================
  // 7. TENANT 1: PT. Demo 1 Company (Subdomain: demo1)
  // ==============================================================================
  console.log("-> Seeding Tenant 1: PT. Demo 1 Company (demo1)...");
  const tenant1 = await prisma.tenant.upsert({
    where: { subdomain: "demo1" },
    update: {
      companyName: "PT. Demo 1 Company",
      legalName: "PT. Demo 1 Company",
      taxId: "01.234.567.8-011.000",
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionTier: "MONTHLY",
      settings: {
        address: "Kawasan Pergudangan Logistik & Kargo Bandara Internasional, Soekarno-Hatta, Tangerang, Indonesia",
        city: "JAKARTA - INDONESIA",
        bankName: "Bank Mandiri (Persero) Tbk",
        bankAccountNumber: "123-00-9876543-1",
        bankAccountName: "PT. Demo 1 Company",
        swiftCode: "BMRIIDJA",
        bankBranch: "KCP Kelapa Gading, Jakarta Utara",
        iataCode: "15-3 0550",
        accountNo: "98-100293",
      },
    },
    create: {
      subdomain: "demo1",
      companyName: "PT. Demo 1 Company",
      legalName: "PT. Demo 1 Company",
      taxId: "01.234.567.8-011.000",
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionTier: "MONTHLY",
      settings: {
        address: "Kawasan Pergudangan Logistik & Kargo Bandara Internasional, Soekarno-Hatta, Tangerang, Indonesia",
        city: "JAKARTA - INDONESIA",
        bankName: "Bank Mandiri (Persero) Tbk",
        bankAccountNumber: "123-00-9876543-1",
        bankAccountName: "PT. Demo 1 Company",
        swiftCode: "BMRIIDJA",
        bankBranch: "KCP Kelapa Gading, Jakarta Utara",
        iataCode: "15-3 0550",
        accountNo: "98-100293",
      },
    },
  });

  // 7a. Financial Settings for Demo 1
  await prisma.financialSettings.upsert({
    where: { tenantId: tenant1.id },
    update: {
      baseCurrencyId: idrCurrencyId,
      baseCurrency: "IDR",
      fiscalYearStartMonth: 1,
      defaultPaymentTermDays: 30,
      isPeriodLockActive: false,
    },
    create: {
      tenantId: tenant1.id,
      baseCurrencyId: idrCurrencyId,
      baseCurrency: "IDR",
      fiscalYearStartMonth: 1,
      defaultPaymentTermDays: 30,
      isPeriodLockActive: false,
    },
  });

  // 7b. Master Tax for Demo 1 (PPN JPT 1.1%, PPN Standar 11%)
  const taxJpt1 = await prisma.masterTax.upsert({
    where: {
      tenantId_taxCode: {
        tenantId: tenant1.id,
        taxCode: "PPN_JPT_1_1",
      },
    },
    update: {
      taxName: "PPN Jasa Pengurusan Transportasi (PMK 71) 1.1%",
      taxRatePercent: 1.1,
      isDefault: true,
    },
    create: {
      tenantId: tenant1.id,
      taxCode: "PPN_JPT_1_1",
      taxName: "PPN Jasa Pengurusan Transportasi (PMK 71) 1.1%",
      taxRatePercent: 1.1,
      isDefault: true,
      description: "Pajak Pertambahan Nilai Final 1.1% untuk freight forwarding sesuai PMK No. 71/PMK.03/2022",
    },
  });

  await prisma.masterTax.upsert({
    where: {
      tenantId_taxCode: {
        tenantId: tenant1.id,
        taxCode: "PPN_11",
      },
    },
    update: {
      taxName: "PPN Standar 11%",
      taxRatePercent: 11.0,
      isDefault: false,
    },
    create: {
      tenantId: tenant1.id,
      taxCode: "PPN_11",
      taxName: "PPN Standar 11%",
      taxRatePercent: 11.0,
      isDefault: false,
    },
  });

  // 7c. Master Prefix for Demo 1 (JOB_FILE, INVOICE, PAYMENT_VOUCHER)
  await prisma.masterPrefix.upsert({
    where: {
      tenantId_prefixType: {
        tenantId: tenant1.id,
        prefixType: PrefixType.JOB_FILE,
      },
    },
    update: {
      prefixCode: "JF",
      zeroPadding: 5,
      formatPattern: "{PREFIX}/{YEAR}/{MONTH}/{SEQ}",
    },
    create: {
      tenantId: tenant1.id,
      prefixType: PrefixType.JOB_FILE,
      prefixCode: "JF",
      zeroPadding: 5,
      currentSequence: 3,
      delimiter: "/",
      formatPattern: "{PREFIX}/{YEAR}/{MONTH}/{SEQ}",
      description: "Penomoran Otomatis Berkas Muatan Kargo (Job File)",
    },
  });

  await prisma.masterPrefix.upsert({
    where: {
      tenantId_prefixType: {
        tenantId: tenant1.id,
        prefixType: PrefixType.INVOICE,
      },
    },
    update: {
      prefixCode: "INV",
      zeroPadding: 5,
      formatPattern: "{PREFIX}/{YEAR}/{SEQ}",
    },
    create: {
      tenantId: tenant1.id,
      prefixType: PrefixType.INVOICE,
      prefixCode: "INV",
      zeroPadding: 5,
      currentSequence: 1,
      delimiter: "/",
      formatPattern: "{PREFIX}/{YEAR}/{SEQ}",
      description: "Penomoran Faktur Tagihan Pelanggan (Commercial Invoice)",
    },
  });

  await prisma.masterPrefix.upsert({
    where: {
      tenantId_prefixType: {
        tenantId: tenant1.id,
        prefixType: PrefixType.PAYMENT_VOUCHER,
      },
    },
    update: {
      prefixCode: "PV",
      zeroPadding: 5,
      formatPattern: "{PREFIX}/{YEAR}/{MONTH}/{SEQ}",
    },
    create: {
      tenantId: tenant1.id,
      prefixType: PrefixType.PAYMENT_VOUCHER,
      prefixCode: "PV",
      zeroPadding: 5,
      currentSequence: 0,
      delimiter: "/",
      formatPattern: "{PREFIX}/{YEAR}/{MONTH}/{SEQ}",
      description: "Penomoran Bukti Pembayaran / Pengeluaran Kas (Payment Voucher)",
    },
  });

  // 7d. Users for Demo 1 (RBAC Roles: TENANT_ADMIN, FINANCE, OPERATOR)
  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant1.id,
        email: "demo1@sistemforwarding.com",
      },
    },
    update: {
      name: "Admin PT Demo 1",
      role: UserRole.TENANT_ADMIN,
    },
    create: {
      tenantId: tenant1.id,
      email: "demo1@sistemforwarding.com",
      name: "Admin PT Demo 1",
      role: UserRole.TENANT_ADMIN,
      phone: "+628110000001",
    },
  });

  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant1.id,
        email: "finance1@sistemforwarding.com",
      },
    },
    update: {
      name: "Siti Rahmawati (Finance)",
      role: UserRole.FINANCE,
    },
    create: {
      tenantId: tenant1.id,
      email: "finance1@sistemforwarding.com",
      name: "Siti Rahmawati (Finance)",
      role: UserRole.FINANCE,
      phone: "+628110000002",
    },
  });

  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant1.id,
        email: "operator1@sistemforwarding.com",
      },
    },
    update: {
      name: "Budi Santoso (Ops Dispatch)",
      role: UserRole.OPERATOR,
    },
    create: {
      tenantId: tenant1.id,
      email: "operator1@sistemforwarding.com",
      name: "Budi Santoso (Ops Dispatch)",
      role: UserRole.OPERATOR,
      phone: "+628110000003",
    },
  });

  // 7e. Master Vendors for Demo 1 (AP Side)
  const vendorSea1 = await prisma.masterVendor.upsert({
    where: {
      tenantId_vendorCode: {
        tenantId: tenant1.id,
        vendorCode: "VND-SEA-001",
      },
    },
    update: {
      name: "Maersk Line Indonesia",
      category: VendorCategory.CARRIER_SEA,
      creditLimit: 1000000000,
    },
    create: {
      tenantId: tenant1.id,
      vendorCode: "VND-SEA-001",
      name: "Maersk Line Indonesia",
      category: VendorCategory.CARRIER_SEA,
      contactPerson: "Bapak Hendrik",
      email: "booking.id@maersk.com",
      phone: "+622152998888",
      address: "World Trade Center 2, Jl. Jend Sudirman Kav 29-31, Jakarta",
      taxId: "01.002.345.6-054.000",
      creditLimit: 1000000000,
      paymentTermDays: 30,
      bankName: "Citibank Indonesia",
      bankAccountNumber: "0-123456-001",
      bankAccountHolder: "PT Maersk Indonesia",
    },
  });

  const vendorAir1 = await prisma.masterVendor.upsert({
    where: {
      tenantId_vendorCode: {
        tenantId: tenant1.id,
        vendorCode: "VND-AIR-001",
      },
    },
    update: {
      name: "Garuda Indonesia Cargo",
      category: VendorCategory.CARRIER_AIR,
      iataPrefix: "126",
      creditLimit: 500000000,
    },
    create: {
      tenantId: tenant1.id,
      vendorCode: "VND-AIR-001",
      name: "Garuda Indonesia Cargo",
      category: VendorCategory.CARRIER_AIR,
      iataPrefix: "126",
      contactPerson: "Ibu Kartika",
      email: "cargo.sales@garuda-indonesia.com",
      phone: "+622125601234",
      address: "Gedung Manajemen Garuda Indonesia, Bandara Soekarno-Hatta",
      taxId: "01.000.123.4-051.000",
      creditLimit: 500000000,
      paymentTermDays: 14,
    },
  });

  const vendorAir2 = await prisma.masterVendor.upsert({
    where: {
      tenantId_vendorCode: {
        tenantId: tenant1.id,
        vendorCode: "VND-AIR-002",
      },
    },
    update: {
      name: "Air Asia Berhad",
      category: VendorCategory.CARRIER_AIR,
      iataPrefix: "807",
      creditLimit: 500000000,
    },
    create: {
      tenantId: tenant1.id,
      vendorCode: "VND-AIR-002",
      name: "Air Asia Berhad",
      category: VendorCategory.CARRIER_AIR,
      iataPrefix: "807",
      contactPerson: "Mr. Azran",
      email: "cargo@airasia.com",
      phone: "+60386604300",
      address: "RedQ, Jalan Pekeliling 5, Lapangan Terbang Antarabangsa Kuala Lumpur",
      taxId: "01.999.777.6-051.000",
      creditLimit: 500000000,
      paymentTermDays: 14,
    },
  });

  const vendorTruck1 = await prisma.masterVendor.upsert({
    where: {
      tenantId_vendorCode: {
        tenantId: tenant1.id,
        vendorCode: "VND-TRK-001",
      },
    },
    update: {
      name: "PT Samudera Perdana Haulage",
      category: VendorCategory.HAULAGE_TRUCK,
      creditLimit: 250000000,
      provinceId: provDki.id,
      cityId: cityJakut.id,
      districtId: distPriok.id,
    },
    create: {
      tenantId: tenant1.id,
      vendorCode: "VND-TRK-001",
      name: "PT Samudera Perdana Haulage",
      category: VendorCategory.HAULAGE_TRUCK,
      contactPerson: "Bapak Gunawan",
      email: "dispatch@samudera-haulage.com",
      phone: "+62214301234",
      address: "Jl. Jampea No. 1, Tanjung Priok, Jakarta Utara",
      provinceId: provDki.id,
      cityId: cityJakut.id,
      districtId: distPriok.id,
      creditLimit: 250000000,
      paymentTermDays: 30,
    },
  });

  const vendorPpjk1 = await prisma.masterVendor.upsert({
    where: {
      tenantId_vendorCode: {
        tenantId: tenant1.id,
        vendorCode: "VND-PPJK-001",
      },
    },
    update: {
      name: "PT Mitra Kepabeanan Bea Cukai (PPJK)",
      category: VendorCategory.CUSTOMS_BROKER,
      creditLimit: 150000000,
      provinceId: provDki.id,
      cityId: cityJakut.id,
      districtId: distPriok.id,
    },
    create: {
      tenantId: tenant1.id,
      vendorCode: "VND-PPJK-001",
      name: "PT Mitra Kepabeanan Bea Cukai (PPJK)",
      category: VendorCategory.CUSTOMS_BROKER,
      contactPerson: "Ibu Nurul",
      email: "customs@mitrapjk.com",
      phone: "+62214390888",
      address: "Komplek Pelabuhan Tanjung Priok, Jakarta Utara",
      provinceId: provDki.id,
      cityId: cityJakut.id,
      districtId: distPriok.id,
      creditLimit: 150000000,
      paymentTermDays: 7,
    },
  });

  // 7f. Master Customers for Demo 1 (AR Side)
  const customer1 = await prisma.masterCustomer.upsert({
    where: {
      tenantId_customerCode: {
        tenantId: tenant1.id,
        customerCode: "CUST-001",
      },
    },
    update: {
      name: "PT Sumber Makmur Ekspor",
      paymentTermDays: 30,
      creditLimit: 500000000,
      provinceId: provDki.id,
      cityId: cityJakut.id,
      districtId: distKelapaGading.id,
    },
    create: {
      tenantId: tenant1.id,
      customerCode: "CUST-001",
      name: "PT Sumber Makmur Ekspor",
      contactPerson: "Ibu Melani",
      email: "melani@sumbermakmur.co.id",
      phone: "+6281288889999",
      address: "Kawasan Industri Pulogadung / Kelapa Gading",
      city: "Jakarta Utara",
      provinceId: provDki.id,
      cityId: cityJakut.id,
      districtId: distKelapaGading.id,
      country: "ID",
      taxId: "02.876.543.2-021.000",
      paymentTermDays: 30,
      creditLimit: 500000000,
    },
  });

  const customer2 = await prisma.masterCustomer.upsert({
    where: {
      tenantId_customerCode: {
        tenantId: tenant1.id,
        customerCode: "CUST-002",
      },
    },
    update: {
      name: "PT Global Indo Manufaktur",
      paymentTermDays: 45,
      creditLimit: 750000000,
    },
    create: {
      tenantId: tenant1.id,
      customerCode: "CUST-002",
      name: "PT Global Indo Manufaktur",
      contactPerson: "Bapak Rudi Hartono",
      email: "rudi@globalindo.co.id",
      phone: "+628123456789",
      address: "Kawasan Industri Jababeka 1, Cikarang",
      city: "Bekasi",
      country: "ID",
      taxId: "03.111.222.3-031.000",
      paymentTermDays: 45,
      creditLimit: 750000000,
    },
  });

  const customer3 = await prisma.masterCustomer.upsert({
    where: {
      tenantId_customerCode: {
        tenantId: tenant1.id,
        customerCode: "CUST-003",
      },
    },
    update: {
      name: "PT Bintang Jaya Trading",
      paymentTermDays: 14,
      creditLimit: 200000000,
      provinceId: provDki.id,
      cityId: cityJakut.id,
      districtId: distKelapaGading.id,
    },
    create: {
      tenantId: tenant1.id,
      customerCode: "CUST-003",
      name: "PT Bintang Jaya Trading",
      contactPerson: "Bapak Tommy Kurniawan",
      email: "tommy@bintangjaya.com",
      phone: "+628139988776",
      address: "Ruko Inkopal Blok B-18, Kelapa Gading, Jakarta Utara",
      city: "Jakarta Utara",
      provinceId: provDki.id,
      cityId: cityJakut.id,
      districtId: distKelapaGading.id,
      country: "ID",
      taxId: "01.999.888.7-015.000",
      paymentTermDays: 14,
      creditLimit: 200000000,
    },
  });

  // 7g. Operational JobFiles for Demo 1
  const portJktId = portMap.get("IDJKT");
  const portSinId = portMap.get("SGSIN");
  const portCgkId = portMap.get("IDCGK");
  const portSinAirId = portMap.get("SIN");

  const job1 = await prisma.jobFile.upsert({
    where: {
      tenantId_jobFileNumber: {
        tenantId: tenant1.id,
        jobFileNumber: "JF/2026/10/00001",
      },
    },
    update: {
      status: JobFileStatus.IN_TRANSIT,
      originPort: "IDJKT (Tanjung Priok, Jakarta)",
      destinationPort: "SGSIN (Port of Singapore)",
      originPortId: portJktId,
      destinationPortId: portSinId,
      currencyId: idrCurrencyId,
      packageUnitId: teuUnitId,
      containerUnitId: unitMap.get("20DC") || teuUnitId,
      itemTypeId: itemTypeMap.get("ELEC"),
      bizMode: BizMode.SEA,
      bound: Bound.EXPORT,
      incotermId: incotermMap.get("FOB"),
      exchangeRate: 1.0,
      sellingAmount: 45000000,
      buyingAmount: 32500000,
    },
    create: {
      tenantId: tenant1.id,
      jobFileNumber: "JF/2026/10/00001",
      customerId: customer1.id,
      vendorId: vendorSea1.id,
      status: JobFileStatus.IN_TRANSIT,
      transportMode: TransportMode.SEA,
      bizMode: BizMode.SEA,
      bound: Bound.EXPORT,
      shipmentType: ShipmentType.EXPORT,
      incoterm: "FOB",
      incotermId: incotermMap.get("FOB"),
      exchangeRate: 1.0,
      originPortId: portJktId,
      originPort: "IDJKT (Tanjung Priok, Jakarta)",
      destinationPortId: portSinId,
      destinationPort: "SGSIN (Port of Singapore)",
      vesselOrFlight: "MAERSK JAKARTA",
      voyageOrFlightNo: "V.2610N",
      masterBillOfLading: "MSK982347101",
      houseBillOfLading: "D1-EXP-2026-001",
      grossWeightKg: 18500.0,
      volumeWeightCbm: 48.5,
      packageCount: 2,
      packageType: "20'DC",
      packageUnitId: teuUnitId,
      containerUnitId: unitMap.get("20DC") || teuUnitId,
      containerSummary: "1x20'DC (MRKU9876543 / SEAL8812)",
      itemTypeId: itemTypeMap.get("ELEC"),
      commodityDescription: "Manufactured Electronic Parts and Components",
      currencyId: idrCurrencyId,
      sellingAmount: 45000000,
      buyingAmount: 32500000,
      currency: "IDR",
      remarks: "Muatan ekspor prioritas ke Singapore. Dokumen PEB & NPE clear.",
    },
  });

  await prisma.jobFile.upsert({
    where: {
      tenantId_jobFileNumber: {
        tenantId: tenant1.id,
        jobFileNumber: "JF/2026/10/00002",
      },
    },
    update: {
      status: JobFileStatus.DRAFT,
      originPort: "IDJKT (Tanjung Priok, Jakarta)",
      destinationPort: "SGSIN (Port of Singapore)",
      originPortId: portJktId,
      destinationPortId: portSinId,
      currencyId: idrCurrencyId,
      packageUnitId: unitMap.get("FEU"),
      containerUnitId: unitMap.get("40HC") || unitMap.get("FEU"),
      itemTypeId: itemTypeMap.get("TEXTILE"),
      bizMode: BizMode.SEA,
      bound: Bound.EXPORT,
      incotermId: incotermMap.get("CIF"),
      exchangeRate: 1.0,
      sellingAmount: 55000000,
      buyingAmount: 40000000,
    },
    create: {
      tenantId: tenant1.id,
      jobFileNumber: "JF/2026/10/00002",
      customerId: customer2.id,
      vendorId: vendorSea1.id,
      status: JobFileStatus.DRAFT,
      transportMode: TransportMode.SEA,
      bizMode: BizMode.SEA,
      bound: Bound.EXPORT,
      shipmentType: ShipmentType.EXPORT,
      incoterm: "FOB",
      incotermId: incotermMap.get("CIF"),
      exchangeRate: 1.0,
      originPortId: portJktId,
      originPort: "IDJKT (Tanjung Priok, Jakarta)",
      destinationPortId: portSinId,
      destinationPort: "SGSIN (Port of Singapore)",
      vesselOrFlight: "MAERSK BINTAN",
      voyageOrFlightNo: "V.2611W",
      masterBillOfLading: "MSK982347102",
      houseBillOfLading: "D1-EXP-2026-002",
      grossWeightKg: 22000.0,
      volumeWeightCbm: 65.0,
      packageCount: 1,
      packageType: "40'HC",
      packageUnitId: unitMap.get("FEU"),
      containerUnitId: unitMap.get("40HC") || unitMap.get("FEU"),
      containerSummary: "1x40'HC (MSKU5544332 / SEAL9941)",
      itemTypeId: itemTypeMap.get("TEXTILE"),
      commodityDescription: "Textile and Finished Garments",
      currencyId: idrCurrencyId,
      sellingAmount: 55000000,
      buyingAmount: 40000000,
      currency: "IDR",
    },
  });

  const job3 = await prisma.jobFile.upsert({
    where: {
      tenantId_jobFileNumber: {
        tenantId: tenant1.id,
        jobFileNumber: "JF/2026/10/00003",
      },
    },
    update: {
      status: JobFileStatus.DRAFT,
      originPort: "IDCGK (Soekarno-Hatta, Jakarta)",
      destinationPort: "SIN (Changi Airport, Singapore)",
      originPortId: portCgkId,
      destinationPortId: portSinAirId,
      currencyId: idrCurrencyId,
      packageUnitId: unitMap.get("CTN") || kgsUnitId,
      itemTypeId: itemTypeMap.get("GEN"),
      bizMode: BizMode.AIR,
      bound: Bound.EXPORT,
      incotermId: incotermMap.get("CIF"),
      exchangeRate: 1.0,
      vendorId: vendorAir2.id,
      vesselOrFlight: "AIR ASIA (AK354 / AK552)",
      voyageOrFlightNo: "AK354",
      masterBillOfLading: "80722216040",
      houseBillOfLading: "HAWB-2026-003",
      consigneeName: "DO THI THAO",
      consigneeAddress: "SHENGDA INTERNATIONAL HOTEL, SIKHOTTABONG",
      consigneeCity: "VIENTIANE",
      consigneeCountry: "LA",
      consigneePostalCode: "12000",
      consigneePhone: "020-58885793",
      consigneeAccountNo: "CUST-003",
      notifyParty: "DO THI THAO (SHENGDA INTERNATIONAL HOTEL)",
      transitPort: "KUL (Kuala Lumpur International Airport)",
      secondCarrier: "AK",
      connectingFlightNo: "AK552/14",
      paymentTermMode: "PP",
      declaredValueCarriage: "NVD",
      declaredValueCustoms: "NCV",
      insuranceAmount: "NIL",
      handlingInformation: "PLEASE CONTACT TO OUR CONSIGNEE UPON CARGO ARRIVAL. THANKS",
      grossWeightKg: 598.0,
      volumeWeightCbm: 2.184,
      packageCount: 60,
      packageType: "Cartons",
      containerSummary: "60 Cartons Air Freight (40x26x35cm)",
      commodityDescription: "STICKS (HS CODE: 24039990)",
      sellingAmount: 38000000,
      buyingAmount: 27500000,
    },
    create: {
      tenantId: tenant1.id,
      jobFileNumber: "JF/2026/10/00003",
      customerId: customer3.id,
      vendorId: vendorAir2.id,
      status: JobFileStatus.DRAFT,
      transportMode: TransportMode.AIR,
      bizMode: BizMode.AIR,
      bound: Bound.EXPORT,
      shipmentType: ShipmentType.EXPORT,
      incoterm: "CIF",
      incotermId: incotermMap.get("CIF"),
      exchangeRate: 1.0,
      originPortId: portCgkId,
      originPort: "IDCGK (Soekarno-Hatta, Jakarta)",
      destinationPortId: portSinAirId,
      destinationPort: "SIN (Changi Airport, Singapore)",
      vesselOrFlight: "AIR ASIA (AK354 / AK552)",
      voyageOrFlightNo: "AK354",
      masterBillOfLading: "80722216040",
      houseBillOfLading: "HAWB-2026-003",
      consigneeName: "DO THI THAO",
      consigneeAddress: "SHENGDA INTERNATIONAL HOTEL, SIKHOTTABONG",
      consigneeCity: "VIENTIANE",
      consigneeCountry: "LA",
      consigneePostalCode: "12000",
      consigneePhone: "020-58885793",
      consigneeAccountNo: "CUST-003",
      notifyParty: "DO THI THAO (SHENGDA INTERNATIONAL HOTEL)",
      transitPort: "KUL (Kuala Lumpur International Airport)",
      secondCarrier: "AK",
      connectingFlightNo: "AK552/14",
      paymentTermMode: "PP",
      declaredValueCarriage: "NVD",
      declaredValueCustoms: "NCV",
      insuranceAmount: "NIL",
      handlingInformation: "PLEASE CONTACT TO OUR CONSIGNEE UPON CARGO ARRIVAL. THANKS",
      grossWeightKg: 598.0,
      volumeWeightCbm: 2.184,
      packageCount: 60,
      packageType: "Cartons",
      packageUnitId: unitMap.get("CTN") || kgsUnitId,
      containerSummary: "60 Cartons Air Freight (40x26x35cm)",
      itemTypeId: itemTypeMap.get("GEN"),
      commodityDescription: "STICKS (HS CODE: 24039990)",
      currencyId: idrCurrencyId,
      sellingAmount: 38000000,
      buyingAmount: 27500000,
      currency: "IDR",
    },
  });

  // 7g-2. Rincian Muatan Kargo (JobCargoDetail - Dokumen Riil AWB Air Asia & UNEX)
  await prisma.jobCargoDetail.deleteMany({
    where: { jobFileId: job3.id },
  });
  await prisma.jobCargoDetail.create({
    data: {
      jobFileId: job3.id,
      pieces: 60,
      grossWeight: 598.0,
      chargeableWeight: 598.0,
      volumeCbm: 2.184,
      length: 40.0,
      width: 26.0,
      height: 35.0,
      unitId: unitMap.get("CTN"),
      commodityId: commodityMap.get("Tobacco (HS: 24039990)"),
      description: "40 x 26 x 35CM / 60CTNS - STICKS (HS CODE: 24039990)",
    },
  });

  // 7g-3. Faktur Komersial & Itemized Charges untuk Job 3 (Sesuai Standar LX Pantos & AWB AirAsia)
  const inv3 = await prisma.invoice.upsert({
    where: {
      tenantId_invoiceNumber: {
        tenantId: tenant1.id,
        invoiceNumber: "INV/2026/00003",
      },
    },
    update: {
      jobFileId: job3.id,
      customerId: customer3.id,
      currencyId: idrCurrencyId,
      currency: "IDR",
      subtotal: 38000000,
      taxId: taxJpt1.id,
      taxRatePercent: 1.1,
      taxAmount: 418000,
      totalAmount: 38418000,
      status: InvoiceStatus.UNPAID,
      cargoSummary: "60 Cartons Air Freight (40x26x35cm) | 60 Cartons | 598 Kgs | 2.184 CBM | Vessel: AIR ASIA (AK354 / AK552)",
      notes: "Pembayaran jatuh tempo 14 hari kalender via Bank Mandiri (Persero) Tbk.",
    },
    create: {
      tenantId: tenant1.id,
      invoiceNumber: "INV/2026/00003",
      jobFileId: job3.id,
      customerId: customer3.id,
      currencyId: idrCurrencyId,
      currency: "IDR",
      subtotal: 38000000,
      taxId: taxJpt1.id,
      taxRatePercent: 1.1,
      taxAmount: 418000,
      totalAmount: 38418000,
      status: InvoiceStatus.UNPAID,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // TOP 14 Days
      cargoSummary: "60 Cartons Air Freight (40x26x35cm) | 60 Cartons | 598 Kgs | 2.184 CBM | Vessel: AIR ASIA (AK354 / AK552)",
      notes: "Pembayaran jatuh tempo 14 hari kalender via Bank Mandiri (Persero) Tbk.",
    },
  });

  // Itemized charge components untuk Faktur INV/2026/00003
  await prisma.invoiceItem.deleteMany({ where: { invoiceId: inv3.id } });
  await prisma.invoiceItem.createMany({
    data: [
      {
        invoiceId: inv3.id,
        chargeCode: "AFRT",
        description: "AIR FREIGHT CHARGES (Tobacco / General Cargo)",
        unit: "CWT",
        quantity: 598.0,
        rate: 60747.17,
        amount: 36326810,
        currency: "IDR",
        taxRatePercent: 1.1,
        taxAmount: 399595,
        totalAmount: 36726405,
      },
      {
        invoiceId: inv3.id,
        chargeCode: "FSC",
        description: "FUEL SURCHARGE (FSC AirAsia)",
        unit: "CWT",
        quantity: 598.0,
        rate: 2655.0,
        amount: 1587690,
        currency: "IDR",
        taxRatePercent: 1.1,
        taxAmount: 17465,
        totalAmount: 1605155,
      },
      {
        invoiceId: inv3.id,
        chargeCode: "DOC_FEE",
        description: "AWB DOCUMENTATION & TERMINAL FEE",
        unit: "SHPT",
        quantity: 1.0,
        rate: 85500.0,
        amount: 85500,
        currency: "IDR",
        taxRatePercent: 1.1,
        taxAmount: 940,
        totalAmount: 86440,
      },
    ],
  });

  // 7h. Invoices for Demo 1 (Commercial Billing with PPN JPT 1.1% PMK 71)
  const invoiceSubtotal = 45000000;
  const taxRate = 1.1; // 1.1%
  const invoiceTaxAmount = (invoiceSubtotal * taxRate) / 100; // Rp 495.000
  const invoiceTotal = invoiceSubtotal + invoiceTaxAmount; // Rp 45.495.000

  await prisma.invoice.upsert({
    where: {
      tenantId_invoiceNumber: {
        tenantId: tenant1.id,
        invoiceNumber: "INV/2026/00001",
      },
    },
    update: {
      subtotal: invoiceSubtotal,
      taxId: taxJpt1.id,
      taxRatePercent: taxRate,
      taxAmount: invoiceTaxAmount,
      totalAmount: invoiceTotal,
      currencyId: idrCurrencyId,
      status: InvoiceStatus.UNPAID,
    },
    create: {
      tenantId: tenant1.id,
      invoiceNumber: "INV/2026/00001",
      jobFileId: job1.id,
      customerId: customer1.id,
      currencyId: idrCurrencyId,
      currency: "IDR",
      subtotal: invoiceSubtotal,
      taxId: taxJpt1.id,
      taxRatePercent: taxRate,
      taxAmount: invoiceTaxAmount,
      totalAmount: invoiceTotal,
      status: InvoiceStatus.UNPAID,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // TOP 30 Days
      cargoSummary: "1x20GP (18.5 Tons) • IDJKT -> SGSIN",
      notes: "Pembayaran jatuh tempo 30 hari kalender. Transfer ke rekening resmi perusahaan.",
    },
  });

  // 7i. Historical Operational Shipments (May - September 2026) for rich dynamic time-series charts
  console.log("-> Seeding Multi-Month Historical Operational Shipments for Demo 1...");
  const historicalShipments = [
    // May 2026
    {
      jobFileNumber: "JF/2026/05/00001",
      customerId: customer1.id,
      vendorId: vendorSea1.id,
      transportMode: TransportMode.SEA,
      bizMode: BizMode.SEA,
      bound: Bound.EXPORT,
      sellingAmount: 48000000,
      buyingAmount: 34000000,
      status: JobFileStatus.DELIVERED,
      createdAt: new Date("2026-05-12T08:00:00Z"),
      vesselOrFlight: "MAERSK BALTIMORE",
      originPort: "IDJKT (Tanjung Priok, Jakarta)",
      destinationPort: "SGSIN (Port of Singapore)",
      originPortId: portJktId,
      destinationPortId: portSinId,
      grossWeightKg: 19500,
      volumeWeightCbm: 52,
      packageCount: 1,
      packageType: "20'DC",
      masterBillOfLading: "MSK-MAY-001",
      houseBillOfLading: "D1-EXP-2605-01",
    },
    {
      jobFileNumber: "JF/2026/05/00002",
      customerId: customer2.id,
      vendorId: vendorAir1.id,
      transportMode: TransportMode.AIR,
      bizMode: BizMode.AIR,
      bound: Bound.EXPORT,
      sellingAmount: 32000000,
      buyingAmount: 23000000,
      status: JobFileStatus.DELIVERED,
      createdAt: new Date("2026-05-20T10:30:00Z"),
      vesselOrFlight: "GARUDA GA-820",
      originPort: "IDCGK (Soekarno-Hatta, Jakarta)",
      destinationPort: "SIN (Changi Airport, Singapore)",
      originPortId: portCgkId,
      destinationPortId: portSinAirId,
      grossWeightKg: 420,
      volumeWeightCbm: 1.8,
      packageCount: 45,
      packageType: "Cartons",
      masterBillOfLading: "126-5544-3321",
      houseBillOfLading: "HAWB-2605-02",
    },
    {
      jobFileNumber: "JF/2026/05/00003",
      customerId: customer3.id,
      vendorId: vendorTruck1.id,
      transportMode: TransportMode.INLAND,
      bizMode: BizMode.INLAND,
      bound: Bound.DOMESTIC,
      sellingAmount: 18000000,
      buyingAmount: 12000000,
      status: JobFileStatus.CLOSED,
      createdAt: new Date("2026-05-27T14:15:00Z"),
      vesselOrFlight: "TRUCK WINGBOX B-9821-KPA",
      originPort: "IDJKT (Tanjung Priok, Jakarta)",
      destinationPort: "IDSUB (Tanjung Perak, Surabaya)",
      grossWeightKg: 12000,
      volumeWeightCbm: 38,
      packageCount: 1,
      packageType: "Wingbox",
      masterBillOfLading: "TRK-MAY-003",
      houseBillOfLading: "SJ-2605-03",
    },
    // June 2026
    {
      jobFileNumber: "JF/2026/06/00001",
      customerId: customer1.id,
      vendorId: vendorSea1.id,
      transportMode: TransportMode.SEA,
      bizMode: BizMode.SEA,
      bound: Bound.EXPORT,
      sellingAmount: 58000000,
      buyingAmount: 41000000,
      status: JobFileStatus.DELIVERED,
      createdAt: new Date("2026-06-08T09:00:00Z"),
      vesselOrFlight: "MAERSK SHANGHAI",
      originPort: "IDJKT (Tanjung Priok, Jakarta)",
      destinationPort: "SGSIN (Port of Singapore)",
      originPortId: portJktId,
      destinationPortId: portSinId,
      grossWeightKg: 24000,
      volumeWeightCbm: 68,
      packageCount: 2,
      packageType: "40'HC",
      masterBillOfLading: "MSK-JUN-001",
      houseBillOfLading: "D1-EXP-2606-01",
    },
    {
      jobFileNumber: "JF/2026/06/00002",
      customerId: customer3.id,
      vendorId: vendorAir2.id,
      transportMode: TransportMode.AIR,
      bizMode: BizMode.AIR,
      bound: Bound.EXPORT,
      sellingAmount: 36000000,
      buyingAmount: 26000000,
      status: JobFileStatus.DELIVERED,
      createdAt: new Date("2026-06-17T11:00:00Z"),
      vesselOrFlight: "AIR ASIA AK-352",
      originPort: "IDCGK (Soekarno-Hatta, Jakarta)",
      destinationPort: "SIN (Changi Airport, Singapore)",
      originPortId: portCgkId,
      destinationPortId: portSinAirId,
      grossWeightKg: 510,
      volumeWeightCbm: 2.1,
      packageCount: 50,
      packageType: "Cartons",
      masterBillOfLading: "807-1122-3344",
      houseBillOfLading: "HAWB-2606-02",
    },
    {
      jobFileNumber: "JF/2026/06/00003",
      customerId: customer2.id,
      vendorId: vendorTruck1.id,
      transportMode: TransportMode.INLAND,
      bizMode: BizMode.INLAND,
      bound: Bound.DOMESTIC,
      sellingAmount: 22000000,
      buyingAmount: 15000000,
      status: JobFileStatus.CLOSED,
      createdAt: new Date("2026-06-26T15:00:00Z"),
      vesselOrFlight: "TRUCK FUSO B-9011-JPT",
      originPort: "IDJKT (Tanjung Priok, Jakarta)",
      destinationPort: "IDSUB (Tanjung Perak, Surabaya)",
      grossWeightKg: 8500,
      volumeWeightCbm: 26,
      packageCount: 1,
      packageType: "Fuso",
      masterBillOfLading: "TRK-JUN-003",
      houseBillOfLading: "SJ-2606-03",
    },
    // July 2026
    {
      jobFileNumber: "JF/2026/07/00001",
      customerId: customer2.id,
      vendorId: vendorSea1.id,
      transportMode: TransportMode.SEA,
      bizMode: BizMode.SEA,
      bound: Bound.EXPORT,
      sellingAmount: 64000000,
      buyingAmount: 46000000,
      status: JobFileStatus.DELIVERED,
      createdAt: new Date("2026-07-06T10:00:00Z"),
      vesselOrFlight: "MAERSK SINGAPORE",
      originPort: "IDJKT (Tanjung Priok, Jakarta)",
      destinationPort: "SGSIN (Port of Singapore)",
      originPortId: portJktId,
      destinationPortId: portSinId,
      grossWeightKg: 28000,
      volumeWeightCbm: 75,
      packageCount: 2,
      packageType: "40'HC",
      masterBillOfLading: "MSK-JUL-001",
      houseBillOfLading: "D1-EXP-2607-01",
    },
    {
      jobFileNumber: "JF/2026/07/00002",
      customerId: customer1.id,
      vendorId: vendorAir1.id,
      transportMode: TransportMode.AIR,
      bizMode: BizMode.AIR,
      bound: Bound.EXPORT,
      sellingAmount: 42000000,
      buyingAmount: 30000000,
      status: JobFileStatus.DELIVERED,
      createdAt: new Date("2026-07-15T12:00:00Z"),
      vesselOrFlight: "GARUDA GA-824",
      originPort: "IDCGK (Soekarno-Hatta, Jakarta)",
      destinationPort: "SIN (Changi Airport, Singapore)",
      originPortId: portCgkId,
      destinationPortId: portSinAirId,
      grossWeightKg: 680,
      volumeWeightCbm: 2.8,
      packageCount: 70,
      packageType: "Cartons",
      masterBillOfLading: "126-7788-9900",
      houseBillOfLading: "HAWB-2607-02",
    },
    {
      jobFileNumber: "JF/2026/07/00003",
      customerId: customer3.id,
      vendorId: vendorTruck1.id,
      transportMode: TransportMode.INLAND,
      bizMode: BizMode.INLAND,
      bound: Bound.DOMESTIC,
      sellingAmount: 26000000,
      buyingAmount: 18000000,
      status: JobFileStatus.CLOSED,
      createdAt: new Date("2026-07-23T16:00:00Z"),
      vesselOrFlight: "TRUCK TRAILER B-9333-KPA",
      originPort: "IDJKT (Tanjung Priok, Jakarta)",
      destinationPort: "IDSUB (Tanjung Perak, Surabaya)",
      grossWeightKg: 21000,
      volumeWeightCbm: 60,
      packageCount: 1,
      packageType: "Trailer",
      masterBillOfLading: "TRK-JUL-003",
      houseBillOfLading: "SJ-2607-03",
    },
    // August 2026
    {
      jobFileNumber: "JF/2026/08/00001",
      customerId: customer1.id,
      vendorId: vendorSea1.id,
      transportMode: TransportMode.SEA,
      bizMode: BizMode.SEA,
      bound: Bound.EXPORT,
      sellingAmount: 72000000,
      buyingAmount: 51000000,
      status: JobFileStatus.DELIVERED,
      createdAt: new Date("2026-08-04T08:30:00Z"),
      vesselOrFlight: "MAERSK TANGERANG",
      originPort: "IDJKT (Tanjung Priok, Jakarta)",
      destinationPort: "SGSIN (Port of Singapore)",
      originPortId: portJktId,
      destinationPortId: portSinId,
      grossWeightKg: 35000,
      volumeWeightCbm: 90,
      packageCount: 3,
      packageType: "40'HC",
      masterBillOfLading: "MSK-AUG-001",
      houseBillOfLading: "D1-EXP-2608-01",
    },
    {
      jobFileNumber: "JF/2026/08/00002",
      customerId: customer2.id,
      vendorId: vendorAir2.id,
      transportMode: TransportMode.AIR,
      bizMode: BizMode.AIR,
      bound: Bound.EXPORT,
      sellingAmount: 46000000,
      buyingAmount: 33000000,
      status: JobFileStatus.DELIVERED,
      createdAt: new Date("2026-08-14T11:20:00Z"),
      vesselOrFlight: "AIR ASIA AK-358",
      originPort: "IDCGK (Soekarno-Hatta, Jakarta)",
      destinationPort: "SIN (Changi Airport, Singapore)",
      originPortId: portCgkId,
      destinationPortId: portSinAirId,
      grossWeightKg: 750,
      volumeWeightCbm: 3.2,
      packageCount: 75,
      packageType: "Cartons",
      masterBillOfLading: "807-3344-5566",
      houseBillOfLading: "HAWB-2608-02",
    },
    {
      jobFileNumber: "JF/2026/08/00003",
      customerId: customer3.id,
      vendorId: vendorSea1.id,
      transportMode: TransportMode.SEA,
      bizMode: BizMode.SEA,
      bound: Bound.IMPORT,
      sellingAmount: 52000000,
      buyingAmount: 37000000,
      status: JobFileStatus.DELIVERED,
      createdAt: new Date("2026-08-21T13:45:00Z"),
      vesselOrFlight: "MAERSK SURABAYA",
      originPort: "SGSIN (Port of Singapore)",
      destinationPort: "IDJKT (Tanjung Priok, Jakarta)",
      originPortId: portSinId,
      destinationPortId: portJktId,
      grossWeightKg: 22000,
      volumeWeightCbm: 60,
      packageCount: 1,
      packageType: "40'HC",
      masterBillOfLading: "MSK-AUG-003",
      houseBillOfLading: "D1-IMP-2608-03",
    },
    {
      jobFileNumber: "JF/2026/08/00004",
      customerId: customer1.id,
      vendorId: vendorTruck1.id,
      transportMode: TransportMode.INLAND,
      bizMode: BizMode.INLAND,
      bound: Bound.DOMESTIC,
      sellingAmount: 30000000,
      buyingAmount: 21000000,
      status: JobFileStatus.CLOSED,
      createdAt: new Date("2026-08-28T16:00:00Z"),
      vesselOrFlight: "TRUCK WINGBOX B-9444-KPA",
      originPort: "IDJKT (Tanjung Priok, Jakarta)",
      destinationPort: "IDSUB (Tanjung Perak, Surabaya)",
      grossWeightKg: 18000,
      volumeWeightCbm: 45,
      packageCount: 1,
      packageType: "Wingbox",
      masterBillOfLading: "TRK-AUG-004",
      houseBillOfLading: "SJ-2608-04",
    },
    // September 2026
    {
      jobFileNumber: "JF/2026/09/00001",
      customerId: customer3.id,
      vendorId: vendorSea1.id,
      transportMode: TransportMode.SEA,
      bizMode: BizMode.SEA,
      bound: Bound.EXPORT,
      sellingAmount: 78000000,
      buyingAmount: 55000000,
      status: JobFileStatus.DELIVERED,
      createdAt: new Date("2026-09-05T09:00:00Z"),
      vesselOrFlight: "MAERSK JAKARTA",
      originPort: "IDJKT (Tanjung Priok, Jakarta)",
      destinationPort: "SGSIN (Port of Singapore)",
      originPortId: portJktId,
      destinationPortId: portSinId,
      grossWeightKg: 40000,
      volumeWeightCbm: 110,
      packageCount: 3,
      packageType: "40'HC",
      masterBillOfLading: "MSK-SEP-001",
      houseBillOfLading: "D1-EXP-2609-01",
    },
    {
      jobFileNumber: "JF/2026/09/00002",
      customerId: customer1.id,
      vendorId: vendorAir2.id,
      transportMode: TransportMode.AIR,
      bizMode: BizMode.AIR,
      bound: Bound.EXPORT,
      sellingAmount: 51000000,
      buyingAmount: 36500000,
      status: JobFileStatus.DELIVERED,
      createdAt: new Date("2026-09-13T11:40:00Z"),
      vesselOrFlight: "AIR ASIA AK-354",
      originPort: "IDCGK (Soekarno-Hatta, Jakarta)",
      destinationPort: "SIN (Changi Airport, Singapore)",
      originPortId: portCgkId,
      destinationPortId: portSinAirId,
      grossWeightKg: 820,
      volumeWeightCbm: 3.5,
      packageCount: 80,
      packageType: "Cartons",
      masterBillOfLading: "807-5566-7788",
      houseBillOfLading: "HAWB-2609-02",
    },
    {
      jobFileNumber: "JF/2026/09/00003",
      customerId: customer2.id,
      vendorId: vendorSea1.id,
      transportMode: TransportMode.SEA,
      bizMode: BizMode.SEA,
      bound: Bound.IMPORT,
      sellingAmount: 62000000,
      buyingAmount: 44000000,
      status: JobFileStatus.DELIVERED,
      createdAt: new Date("2026-09-21T14:10:00Z"),
      vesselOrFlight: "MAERSK BINTAN",
      originPort: "SGSIN (Port of Singapore)",
      destinationPort: "IDJKT (Tanjung Priok, Jakarta)",
      originPortId: portSinId,
      destinationPortId: portJktId,
      grossWeightKg: 26000,
      volumeWeightCbm: 72,
      packageCount: 2,
      packageType: "40'HC",
      masterBillOfLading: "MSK-SEP-003",
      houseBillOfLading: "D1-IMP-2609-03",
    },
    {
      jobFileNumber: "JF/2026/09/00004",
      customerId: customer2.id,
      vendorId: vendorTruck1.id,
      transportMode: TransportMode.INLAND,
      bizMode: BizMode.INLAND,
      bound: Bound.DOMESTIC,
      sellingAmount: 34000000,
      buyingAmount: 23500000,
      status: JobFileStatus.CLOSED,
      createdAt: new Date("2026-09-27T17:00:00Z"),
      vesselOrFlight: "TRUCK TRAILER B-9555-KPA",
      originPort: "IDJKT (Tanjung Priok, Jakarta)",
      destinationPort: "IDSUB (Tanjung Perak, Surabaya)",
      grossWeightKg: 24000,
      volumeWeightCbm: 65,
      packageCount: 1,
      packageType: "Trailer",
      masterBillOfLading: "TRK-SEP-004",
      houseBillOfLading: "SJ-2609-04",
    },
  ];

  for (const s of historicalShipments) {
    await prisma.jobFile.upsert({
      where: {
        tenantId_jobFileNumber: {
          tenantId: tenant1.id,
          jobFileNumber: s.jobFileNumber,
        },
      },
      update: {
        customerId: s.customerId,
        vendorId: s.vendorId,
        transportMode: s.transportMode,
        bizMode: s.bizMode,
        bound: s.bound,
        sellingAmount: s.sellingAmount,
        buyingAmount: s.buyingAmount,
        status: s.status,
        createdAt: s.createdAt,
        vesselOrFlight: s.vesselOrFlight,
        originPort: s.originPort,
        destinationPort: s.destinationPort,
        originPortId: s.originPortId,
        destinationPortId: s.destinationPortId,
        grossWeightKg: s.grossWeightKg,
        volumeWeightCbm: s.volumeWeightCbm,
        packageCount: s.packageCount,
        packageType: s.packageType,
        masterBillOfLading: s.masterBillOfLading,
        houseBillOfLading: s.houseBillOfLading,
      },
      create: {
        tenantId: tenant1.id,
        jobFileNumber: s.jobFileNumber,
        customerId: s.customerId,
        vendorId: s.vendorId,
        transportMode: s.transportMode,
        bizMode: s.bizMode,
        bound: s.bound,
        sellingAmount: s.sellingAmount,
        buyingAmount: s.buyingAmount,
        status: s.status,
        createdAt: s.createdAt,
        vesselOrFlight: s.vesselOrFlight,
        originPort: s.originPort,
        destinationPort: s.destinationPort,
        originPortId: s.originPortId,
        destinationPortId: s.destinationPortId,
        grossWeightKg: s.grossWeightKg,
        volumeWeightCbm: s.volumeWeightCbm,
        packageCount: s.packageCount,
        packageType: s.packageType,
        masterBillOfLading: s.masterBillOfLading,
        houseBillOfLading: s.houseBillOfLading,
        currencyId: idrCurrencyId,
        currency: "IDR",
      },
    });
  }

  // ==============================================================================
  // 8. TENANT 2: PT. Demo 2 Company (Subdomain: demo2)
  // Complete isolated workspace setup
  // ==============================================================================
  console.log("-> Seeding Tenant 2: PT. Demo 2 Company (demo2)...");
  const tenant2 = await prisma.tenant.upsert({
    where: { subdomain: "demo2" },
    update: {
      companyName: "PT. Demo 2 Company",
      legalName: "PT. Demo 2 Company",
      taxId: "02.345.678.9-022.000",
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionTier: "ENTERPRISE",
      settings: {
        address: "Kawasan Industri MM2100, Cikarang Barat, Bekasi, Jawa Barat, Indonesia",
        city: "BEKASI - INDONESIA",
        bankName: "Bank Central Asia (BCA) Tbk",
        bankAccountNumber: "882-019-2831",
        bankAccountName: "PT. Demo 2 Company",
        swiftCode: "CENAIDJA",
        bankBranch: "KCU Cikarang",
        iataCode: "15-3 0882",
        accountNo: "98-100455",
      },
    },
    create: {
      subdomain: "demo2",
      companyName: "PT. Demo 2 Company",
      legalName: "PT. Demo 2 Company",
      taxId: "02.345.678.9-022.000",
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionTier: "ENTERPRISE",
      settings: {
        address: "Kawasan Industri MM2100, Cikarang Barat, Bekasi, Jawa Barat, Indonesia",
        city: "BEKASI - INDONESIA",
        bankName: "Bank Central Asia (BCA) Tbk",
        bankAccountNumber: "882-019-2831",
        bankAccountName: "PT. Demo 2 Company",
        swiftCode: "CENAIDJA",
        bankBranch: "KCU Cikarang",
        iataCode: "15-3 0882",
        accountNo: "98-100455",
      },
    },
  });

  // Financial settings for Demo 2
  await prisma.financialSettings.upsert({
    where: { tenantId: tenant2.id },
    update: {
      baseCurrencyId: idrCurrencyId,
      baseCurrency: "IDR",
      fiscalYearStartMonth: 1,
      defaultPaymentTermDays: 30,
    },
    create: {
      tenantId: tenant2.id,
      baseCurrencyId: idrCurrencyId,
      baseCurrency: "IDR",
      fiscalYearStartMonth: 1,
      defaultPaymentTermDays: 30,
    },
  });

  // Tax for Demo 2
  await prisma.masterTax.upsert({
    where: {
      tenantId_taxCode: {
        tenantId: tenant2.id,
        taxCode: "PPN_JPT_1_1",
      },
    },
    update: {
      taxName: "PPN Jasa Pengurusan Transportasi (PMK 71) 1.1%",
      taxRatePercent: 1.1,
      isDefault: true,
    },
    create: {
      tenantId: tenant2.id,
      taxCode: "PPN_JPT_1_1",
      taxName: "PPN Jasa Pengurusan Transportasi (PMK 71) 1.1%",
      taxRatePercent: 1.1,
      isDefault: true,
    },
  });

  // Master Prefixes for Demo 2
  await prisma.masterPrefix.upsert({
    where: {
      tenantId_prefixType: {
        tenantId: tenant2.id,
        prefixType: PrefixType.JOB_FILE,
      },
    },
    update: {
      prefixCode: "JF",
      zeroPadding: 5,
      formatPattern: "{PREFIX}/{YEAR}/{MONTH}/{SEQ}",
    },
    create: {
      tenantId: tenant2.id,
      prefixType: PrefixType.JOB_FILE,
      prefixCode: "JF",
      zeroPadding: 5,
      currentSequence: 0,
      delimiter: "/",
      formatPattern: "{PREFIX}/{YEAR}/{MONTH}/{SEQ}",
    },
  });

  await prisma.masterPrefix.upsert({
    where: {
      tenantId_prefixType: {
        tenantId: tenant2.id,
        prefixType: PrefixType.INVOICE,
      },
    },
    update: {
      prefixCode: "INV",
      zeroPadding: 5,
      formatPattern: "{PREFIX}/{YEAR}/{SEQ}",
    },
    create: {
      tenantId: tenant2.id,
      prefixType: PrefixType.INVOICE,
      prefixCode: "INV",
      zeroPadding: 5,
      currentSequence: 0,
      delimiter: "/",
      formatPattern: "{PREFIX}/{YEAR}/{SEQ}",
    },
  });

  await prisma.masterPrefix.upsert({
    where: {
      tenantId_prefixType: {
        tenantId: tenant2.id,
        prefixType: PrefixType.PAYMENT_VOUCHER,
      },
    },
    update: {
      prefixCode: "PV",
      zeroPadding: 5,
      formatPattern: "{PREFIX}/{YEAR}/{MONTH}/{SEQ}",
    },
    create: {
      tenantId: tenant2.id,
      prefixType: PrefixType.PAYMENT_VOUCHER,
      prefixCode: "PV",
      zeroPadding: 5,
      currentSequence: 0,
      delimiter: "/",
      formatPattern: "{PREFIX}/{YEAR}/{MONTH}/{SEQ}",
    },
  });

  // Users for Demo 2
  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant2.id,
        email: "demo2@sistemforwarding.com",
      },
    },
    update: {
      name: "Admin PT Demo 2",
      role: UserRole.TENANT_ADMIN,
    },
    create: {
      tenantId: tenant2.id,
      email: "demo2@sistemforwarding.com",
      name: "Admin PT Demo 2",
      role: UserRole.TENANT_ADMIN,
      phone: "+628120000002",
    },
  });

  // Vendors for Demo 2
  const demo2VendorSea = await prisma.masterVendor.upsert({
    where: {
      tenantId_vendorCode: {
        tenantId: tenant2.id,
        vendorCode: "D2-VND-001",
      },
    },
    update: {
      name: "ONE Line (Ocean Network Express)",
      category: VendorCategory.CARRIER_SEA,
    },
    create: {
      tenantId: tenant2.id,
      vendorCode: "D2-VND-001",
      name: "ONE Line (Ocean Network Express)",
      category: VendorCategory.CARRIER_SEA,
      contactPerson: "Bapak Satria",
      email: "id.sales@one-line.com",
      creditLimit: 800000000,
      paymentTermDays: 30,
    },
  });

  // Customer for Demo 2
  const demo2Customer = await prisma.masterCustomer.upsert({
    where: {
      tenantId_customerCode: {
        tenantId: tenant2.id,
        customerCode: "D2-CUST-001",
      },
    },
    update: {
      name: "PT Nusantara Jaya Sentosa",
      provinceId: provJabar.id,
      cityId: cityBandung.id,
      districtId: distSumurBandung.id,
    },
    create: {
      tenantId: tenant2.id,
      customerCode: "D2-CUST-001",
      name: "PT Nusantara Jaya Sentosa",
      contactPerson: "Bapak Dian",
      email: "dian@nusantarajaya.co.id",
      address: "Jl. Asia Afrika No. 100, Sumur Bandung",
      city: "Kota Bandung",
      provinceId: provJabar.id,
      cityId: cityBandung.id,
      districtId: distSumurBandung.id,
      taxId: "03.777.888.9-023.000",
      creditLimit: 300000000,
      paymentTermDays: 30,
    },
  });

  // Job File for Demo 2
  await prisma.jobFile.upsert({
    where: {
      tenantId_jobFileNumber: {
        tenantId: tenant2.id,
        jobFileNumber: "JF/2026/10/00001",
      },
    },
    update: {
      status: JobFileStatus.IN_TRANSIT,
      originPort: "IDJKT (Tanjung Priok, Jakarta)",
      destinationPort: "SGSIN (Port of Singapore)",
      originPortId: portJktId,
      destinationPortId: portSinId,
      currencyId: idrCurrencyId,
      packageUnitId: unitMap.get("FEU"),
      containerUnitId: unitMap.get("40DC") || unitMap.get("FEU"),
      itemTypeId: itemTypeMap.get("AUTO"),
      sellingAmount: 48000000,
      buyingAmount: 35000000,
    },
    create: {
      tenantId: tenant2.id,
      jobFileNumber: "JF/2026/10/00001",
      customerId: demo2Customer.id,
      vendorId: demo2VendorSea.id,
      status: JobFileStatus.IN_TRANSIT,
      transportMode: TransportMode.SEA,
      shipmentType: ShipmentType.EXPORT,
      originPortId: portJktId,
      originPort: "IDJKT (Tanjung Priok, Jakarta)",
      destinationPortId: portSinId,
      destinationPort: "SGSIN (Port of Singapore)",
      vesselOrFlight: "ONE COMMITMENT",
      grossWeightKg: 19500,
      volumeWeightCbm: 52,
      packageCount: 1,
      packageType: "40'DC",
      packageUnitId: unitMap.get("FEU"),
      containerUnitId: unitMap.get("40DC") || unitMap.get("FEU"),
      containerSummary: "1x40'DC (ONEU1234567 / SEAL1123)",
      itemTypeId: itemTypeMap.get("AUTO"),
      commodityDescription: "Automotive Engine Parts and Industrial Components",
      currencyId: idrCurrencyId,
      sellingAmount: 48000000,
      buyingAmount: 35000000,
      currency: "IDR",
    },
  });

  console.log("✅ Comprehensive Enterprise Multi-Tenant DB Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
