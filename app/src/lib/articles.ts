import prisma from "@/lib/prisma";

export interface Article {
  slug: string;
  title: string;
  category: string;
  summary: string;
  author: string;
  authorRole: string;
  readTime: string;
  date: string;
  icon: string;
  accentColor: string;
  coverImage: string;
  content: {
    intro: string;
    sections: {
      heading: string;
      body: string[];
      callout?: string;
    }[];
    takeaways: string[];
  };
}

export const ARTICLES: Article[] = [
  {
    slug: 'mengapa-harus-multi-tenant-cloud-tms',
    title: 'Mengapa Perusahaan Forwarding Wajib Beralih dari Excel ke Cloud Multi-Tenant TMS?',
    category: 'Teknologi TMS',
    summary:
      'Risiko kebocoran data vendor dan margin buying/selling saat menggunakan spreadsheet manual, serta keuntungan subdomain mandiri untuk keamanan data logistik.',
    author: 'Rifki Pratama, M.Kom',
    authorRole: 'Chief Technology Officer PT. Rafa Kreasindo Teknologi',
    readTime: '5 menit baca',
    date: '25 Oktober 2026',
    icon: '🔒',
    accentColor: 'from-indigo-500 to-purple-600',
    coverImage: '/blog/cloud-tms.jpg',
    content: {
      intro:
        'Di era digitalisasi logistik yang bergerak serba cepat, keamanan data operasional dan kerahasiaan tarif kontrak adalah aset terbesar perusahaan freight forwarder. Menggunakan spreadsheet manual yang dibagikan lewat chat atau email adalah pintu masuk tercepat bagi terjadinya kebocoran data bisnis ke pihak eksternal.',
      sections: [
        {
          heading: '1. Ancaman Kerahasiaan Tarif Buying dan Selling',
          body: [
            'Dalam model bisnis freight forwarding, keunggulan bersaing Anda terletak pada selisih (margin) antara tarif negosiasi Anda dengan pihak pelayaran (shipping lines/airlines) dan penawaran yang diberikan ke klien.',
            'File spreadsheet yang tidak terenkripsi dapat dengan mudah disalin, diunduh, atau dibagikan ke pihak ketiga tanpa izin. Ketika tarif rahasia ini bocor, margin keuntungan perusahaan Anda bisa runtuh dalam semalam.',
          ],
        },
        {
          heading: '2. Kekuatan Arsitektur Multi-Tenant dengan Subdomain Mandiri',
          body: [
            'Platform modern seperti Sistem Forwarding menerapkan pola arsitektur Multi-Tenant berbasis PostgreSQL dengan isolasi tingkat database dan subdomain unik (contoh: pt-maju.sistemforwarding.com).',
            'Setiap perusahaan memiliki ruang lingkup data (data boundary) yang sepenuhnya terpisah. Data pengiriman, daftar pelanggan eksklusif, maupun laporan keuangan tidak akan pernah dapat diakses oleh tenant lain.',
          ],
          callout:
            'Keamanan Enterprise: Data setiap tenant dienkripsi saat transit (in-transit) dan saat diam (at-rest) menggunakan standar enkripsi perbankan TLS 256-bit.',
        },
        {
          heading: '3. Hak Akses Staf Berbasis Peran (Role-Based Access Control)',
          body: [
            'Dengan Cloud TMS profesional, staf operasional hanya memiliki akses untuk memperbarui status Job File dan mengunggah dokumen kargo. Mereka tidak dapat melihat margin laba perusahaan atau laporan pembukuan kas yang hanya boleh diakses oleh Superadmin atau Direktur.',
          ],
        },
        {
          heading: '4. Akses Real-Time dari Mana Saja Tanpa Kendala Server Fisik',
          body: [
            'Mengelola server fisik di kantor membutuhkan biaya pemeliharaan tinggi, pendingin ruangan 24 jam, serta teknisi dedicated. Cloud TMS menghilangkan semua biaya ini dengan jaminan SLA uptime 99.9% dan backup otomatis setiap malam.',
          ],
        },
      ],
      takeaways: [
        'Spreadsheet manual menyimpan risiko kebocoran tarif rahasia dan tidak memiliki kontrol hak akses per pengguna.',
        'Arsitektur Multi-Tenant memberikan ruang kerja privat berstandar enterprise bagi setiap tenant.',
        'Role-Based Access Control (RBAC) melindungi laporan laba/rugi sensitif dari akses staf non-otoritas.',
        'Cloud TMS memangkas biaya infrastruktur IT kantor hingga 80% dengan keandalan server 24/7.',
      ],
    },
  },
  {
    slug: 'panduan-lengkap-job-file-freight-forwarding',
    title: 'Panduan Lengkap Penyusunan Job File Freight Forwarding Tanpa Human Error',
    category: 'Operasional Kargo',
    summary:
      'Job File adalah tulang punggung operasional ekspedisi. Pelajari bagaimana sistem penomoran otomatis dan isolasi data relasional mencegah kesalahan rute serta salah kirim kargo.',
    author: 'Capt. Hendro Santoso, M.Mar',
    authorRole: 'Head of Logistics Operations PT. Rafa Kreasindo Teknologi',
    readTime: '6 menit baca',
    date: '30 Oktober 2026',
    icon: '📦',
    accentColor: 'from-blue-500 to-blue-600',
    coverImage: '/blog/job-file.jpg',
    content: {
      intro:
        'Dalam industri freight forwarding, setiap pergerakan kargo—baik melalui jalur laut (Ocean Freight), udara (Air Freight), maupun darat (Inland Trucking)—selalu diawali dan dikendalikan oleh satu berkas operasional utama: Job File. Kesalahan kecil pada pencatatan nomor dokumen, nama shipper, atau instruksi handling berpotensi menimbulkan biaya demurrage/detention hingga ratusan juta rupiah.',
      sections: [
        {
          heading: '1. Anatomi dan Struktur Ideal Sebuah Job File Kargo',
          body: [
            'Sebuah Job File modern bukan sekadar folder map kertas atau tab pada lembar kerja spreadsheet. Job File adalah kumpulan data relasional yang menghubungkan entitas kargo, finansial, dan pihak ketiga secara utuh.',
            'Unsur wajib yang harus tercatat dalam Job File terstruktur meliputi: Nomor unik pengidentifikasi (Job Reference Number), Data Pihak Terlibat (Shipper, Consignee, Notify Party), Detail Transportasi (Vessel/Flight No, Voyage, Port of Loading/POL, Port of Discharge/POD), serta Spesifikasi Muatan (Gross Weight, CBM, Jumlah Colly, tipe kontainer FCL 20ft/40ft atau LCL).',
          ],
          callout:
            'Prinsip Utama: Jangan pernah membiarkan staf operasional mengetik ulang data shipper atau rute pelabuhan secara manual di luar Job File utama untuk mencegah ketidaksinkronan dokumen.',
        },
        {
          heading: '2. Bahaya Laten Pencatatan Manual Menggunakan Excel',
          body: [
            'Sebagian besar perusahaan freight forwarding skala menengah ke bawah di Indonesia masih mengandalkan Microsoft Excel atau Google Sheets. Meskipun fleksibel, metode ini menyimpan risiko operasional yang sangat besar.',
            'Beberapa risiko yang paling sering memicu kerugian finansial antara lain: rumus sel tertimpa (overwritten formulas), penomoran invoice ganda karena bentrok antar staf, serta tidak adanya riwayat perubahan data (audit trail) saat terjadi selisih kurs mata uang valas.',
          ],
        },
        {
          heading: '3. Otomasi Penomoran MasterPrefix & Penerbitan Dokumen',
          body: [
            'Sistem modern menerapkan format MasterPrefix cerdas seperti "JF-202610-0012" yang secara otomatis mengunci urutan transaksi dan langsung mengaitkan pencetakan House Bill of Lading (HBL), Air Waybill (AWB), Shipping Instruction (SI), hingga Surat Pengantar Pengeluaran Barang.',
            'Dengan mengikat seluruh dokumen turunan ke satu induk Job File, proses pencarian dokumen saat pemeriksaan bea cukai (Customs Clearance) dapat dilakukan dalam hitungan detik.',
          ],
          callout:
            'Tips Efisiensi: Di Sistem Forwarding, satu klik tombol langsung menghasilkan dokumen HBL atau AWB dalam format PDF siap cetak dengan penomoran unik yang tersinkronisasi.',
        },
        {
          heading: '4. Transisi ke Sistem ERP Autopilot',
          body: [
            'Bagi pimpinan perusahaan ekspedisi, visibilitas atas margin laba kotor per job file merupakan metrik paling krusial. Sistem yang baik langsung menghitung selisih antara Freight Buying (biaya sewa slot dari pelayaran) dengan Freight Selling (tagihan ke pelanggan eksportir/importir).',
            'Ketika job file ditutup (job closed), laba rugi riil langsung tercatat di neraca keuangan tanpa menunggu tutup buku bulanan.',
          ],
        },
      ],
      takeaways: [
        'Job File adalah pusat komando operasional kargo: semua dokumen kargo dan tagihan wajib merujuk ke satu nomor induk.',
        'Spreadsheet manual memiliki celah fatal seperti duplikasi nomor dan hilangnya jejak audit biaya tambahan.',
        'Otomasi dokumen mengurangi waktu administrasi staf operasional hingga lebih dari 65%.',
        'Penghitungan margin laba per Job File secara real-time melindungi arus kas dari pembengkakan biaya pelabuhan yang tak terduga.',
      ],
    },
  },
  {
    slug: 'perhitungan-ppn-1-1-persen-invoice-forwarding',
    title: 'Penerapan PPN 1.1% pada Faktur Freight Forwarding: Aturan & Contoh Nyata',
    category: 'Perpajakan & Finansial',
    summary:
      'Memahami mekanisme besaran tertentu PPN 1.1% atas jasa pengurusan transportasi (JPT) sesuai PMK terbaru dan cara mengotomasikannya ke dalam tagihan komersial.',
    author: 'Wahyu Hidayat, S.E., BKP',
    authorRole: 'Senior Tax & Financial Specialist PT. Rafa Kreasindo Teknologi',
    readTime: '8 menit baca',
    date: '28 Oktober 2026',
    icon: '📊',
    accentColor: 'from-cyan-500 to-blue-500',
    coverImage: '/blog/tax-ppn.jpg',
    content: {
      intro:
        'Regulasi perpajakan bagi industri Jasa Pengurusan Transportasi (Freight Forwarding) di Indonesia memiliki kekhususan tersendiri. Penerapan PPN dengan tarif efektif "Besaran Tertentu" sebesar 1,1% sering kali memicu kebingungan bagi divisi penagihan (billing) saat memisahkan komponen Freight Charges murni dengan biaya penanganan (reimbursement).',
      sections: [
        {
          heading: '1. Landasan Hukum PPN Besaran Tertentu atas JPT',
          body: [
            'Berdasarkan peraturan menteri keuangan terkait penyesuaian tarif PPN undang-undang HPP, atas penyerahan Jasa Pengurusan Transportasi (freight forwarding) yang di dalam tagihannya menyertakan biaya transportasi (freight charges), dikenakan PPN dengan besaran tertentu yaitu sebesar 10% dari tarif PPN normal (11%), yang menghasilkan tarif efektif sebesar 1,1% dari jumlah yang ditagihkan.',
            'Aturan ini dirancang agar pengusaha forwarder tidak dibebani kewajiban PPN penuh atas biaya tiket pesawat atau slot kapal yang sebenarnya merupakan komponen biaya titipan dari maskapai atau shipping lines.',
          ],
          callout:
            'Rumus Baku: Nilai PPN JPT = 10% × 11% × Total Nilai Tagihan Jasa = 1,1% × DPP Nilai Lain.',
        },
        {
          heading: '2. Perbedaan Krusial: Freight Selling vs Reimbursement',
          body: [
            'Satu kesalahan fatal yang kerap menjadi temuan dalam audit pajak adalah mencampuradukkan biaya jasa dengan biaya reimbursement murni.',
            'Biaya reimbursement (seperti biaya storage pelabuhan resmi yang kuitansinya langsung atas nama importir/shipper) tidak boleh dikenai PPN 1.1% jika dilampirkan bukti tagihan aslinya. Namun bila forwarder menagihkan all-in rate (lump sum), maka seluruh jumlah yang ditagihkan wajib dipungut PPN 1.1%.',
          ],
        },
        {
          heading: '3. Contoh Simulasi Perhitungan Faktur Komersial',
          body: [
            'Sebagai contoh nyata: PT Maju Logistics menerbitkan invoice pengiriman 1 kontainer FCL 40ft rute Jakarta ke Surabaya untuk klien PT Sentosa Jaya.',
            'Komponen tagihan: Ocean Freight Rp 12.000.000 + Biaya Trucking & Handling Rp 3.000.000 = Total DPP Rp 15.000.000. Besaran PPN 1.1% yang dipungut adalah Rp 165.000. Total akhir yang wajib dibayar pelanggan adalah Rp 15.165.000.',
          ],
          callout:
            'Peringatan Pajak: Pastikan penulisan kode faktur pajak (Faktur Pajak dengan kode transaksi 04 untuk DPP Nilai Lain) dilakukan secara konsisten dengan sistem e-Faktur Direktorat Jenderal Pajak.',
        },
        {
          heading: '4. Menghilangkan Risiko Human Error dengan Otomasi Software',
          body: [
            'Di sistemforwarding.com, perhitungan PPN 1.1% dikonfigurasi secara baku (out-of-the-box). Staf penagihan cukup memilih jenis komponen biaya (Freight, Handling, Storage, atau Reimbursement), dan sistem secara otomatis menghitung proporsi pajak yang sah sesuai regulasi PMK terbaru.',
          ],
        },
      ],
      takeaways: [
        'Tarif efektif PPN untuk jasa freight forwarding yang mencakup freight charges adalah 1,1% (besaran tertentu).',
        'Pemisahan komponen biaya jasa dan reimbursement murni sangat krusial untuk mencegah sanksi kurang bayar pajak.',
        'Sistem penagihan otomatis menjamin faktur komersial dan faktur pajak selalu sinkron hingga digit rupiah terakhir.',
      ],
    },
  },
  {
    slug: 'manajemen-piutang-dan-aging-invoice-forwarding',
    title: 'Strategi Manajemen Piutang & Pengendalian Aging Invoice Freight Forwarding',
    category: 'Manajemen Finansial',
    summary:
      'Siklus penagihan jasa pengurusan transportasi (JPT) menuntut kontrol ketat. Pelajari cara mengendalikan aging piutang, mitigasi gagal bayar, dan penahanan Delivery Order (DO) secara disiplin.',
    author: 'Wahyu Hidayat, S.E., BKP',
    authorRole: 'Senior Tax & Financial Specialist PT. Rafa Kreasindo Teknologi',
    readTime: '6 menit baca',
    date: '20 Oktober 2026',
    icon: '📑',
    accentColor: 'from-emerald-500 to-teal-600',
    coverImage: '/blog/tax-ppn.jpg',
    content: {
      intro:
        'Bisnis freight forwarding beroperasi dengan perputaran modal kerja yang sangat intensif. Forwarder sering kali harus mendalangi (menalangi) pembayaran Ocean Freight ke pelayaran atau Airlines sebelum pelanggan melunasi tagihannya. Jika piutang pelanggan (Account Receivable) tidak dikontrol dengan sistematis, cash flow perusahaan dapat terancam macet.',
      sections: [
        {
          heading: '1. Tantangan Siklus Penagihan JPT & Aging Invoice',
          body: [
            'Dalam praktik lapangan, eksportir atau importir sering meminta term of payment (TOP) 14 hingga 30 hari. Sementara itu, pihak shipping line dan otoritas pelabuhan memberlakukan aturan bayar tunai sebelum pelepasan dokumen muatan.',
            'Tanpa pencatatan jatuh tempo yang terintegrasi langsung dengan nomor Job File, divisi billing sering kali terlambat menagihkan invoice, atau bahkan tidak menyadari ketika piutang tertentu telah menunggak melampaui 60 hari (aging).',
          ],
        },
        {
          heading: '2. SOP Pengendalian Dokumen: Penahanan DO Sebelum Pelunasan',
          body: [
            'Salah satu instrumen paling efektif untuk menekan risiko piutang macet adalah disiplin penahanan Delivery Order (DO) atau rilis telex. Forwarder berhak menahan rilis dokumen kargo sampai invoice pengiriman yang bersangkutan telah dipastikan lunas.',
            'Di sistem ERP yang baik, status Job File dan status Invoice saling terkunci. Staf operasional di lapangan tidak dapat mencetak dokumen pengeluaran barang bila status penagihan masih berstatus UNPAID dan melampaui batas toleransi kredit.',
          ],
          callout:
            'Prinsip Utama: Jangan pernah melepaskan Delivery Order (DO) original atau endorse B/L kepada consignee sebelum staf finance memverifikasi pelunasan transfer bank.',
        },
        {
          heading: '3. Pemisahan Invoice Freight Buying, Selling, dan Reimbursement',
          body: [
            'Kejelasan rincian tagihan adalah kunci percepatan pembayaran oleh klien korporat. Invoice yang memuat rincian jelas antara biaya sewa kargo, jasa handling, dan reimbursement bea masuk/storage resmi akan lebih cepat disetujui oleh divisi finance pelanggan.',
            'Sebaliknya, invoice yang ambigu atau terlambat dikirim sering kali dijadikan alasan oleh klien untuk menunda pembayaran.',
          ],
        },
        {
          heading: '4. Visibilitas Status Piutang Real-Time di Sistem Forwarding',
          body: [
            'Melalui platform Sistem Forwarding, pimpinan perusahaan dapat memantau dashboard umur piutang (Aging AR) setiap hari. Sistem menyajikan daftar invoice yang mendekati jatuh tempo dan menghitung laba kotor riil per job secara otomatis begitu invoice diterbitkan.',
          ],
        },
      ],
      takeaways: [
        'Keterlambatan penagihan invoice JPT berisiko menggerus modal kerja operasional perusahaan forwarder.',
        'Integrasi status Job File dan status Invoice mencegah pelepasan dokumen kargo (DO) sebelum tagihan diselesaikan.',
        'Format tagihan yang jelas dan rinci mempercepat siklus persetujuan pembayaran oleh pelanggan eksportir/importir.',
        'Monitoring umur piutang (Aging AR) harian menjaga kesehatan arus kas dan stabilitas likuiditas usaha.',
      ],
    },
  },
];

/**
 * getArticlesFromDb
 * Menarik daftar artikel publik langsung dari basis data PostgreSQL dengan fallback ke static.
 */
export async function getArticlesFromDb(): Promise<Article[]> {
  try {
    const totalCount = await prisma.article.count();
    if (totalCount > 0) {
      const dbArticles = await prisma.article.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: "desc" },
      });

      return dbArticles.map((row) => ({
        slug: row.slug,
        title: row.title,
        category: row.category,
        summary: row.summary,
        author: row.author,
        authorRole: row.authorRole,
        readTime: row.readTime,
        date: row.publishedAt.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        icon: getCategoryIcon(row.category),
        accentColor: "from-blue-600 to-cyan-500",
        coverImage: row.coverImage || "/blog/cloud-tms.jpg",
        content: row.content as unknown as Article["content"],
      }));
    }
  } catch (error) {
    console.warn("[getArticlesFromDb] Fallback to static articles due to DB query:", error);
  }

  return ARTICLES;
}

/**
 * getArticleBySlugFromDb
 * Menarik detail satu artikel dari basis data PostgreSQL berdasarkan slug.
 */
export async function getArticleBySlugFromDb(slug: string): Promise<Article | undefined> {
  try {
    const row = await prisma.article.findUnique({
      where: { slug },
    });

    if (row) {
      if (!row.isPublished) {
        return undefined; // Deliberately unpublished / draft
      }
      return {
        slug: row.slug,
        title: row.title,
        category: row.category,
        summary: row.summary,
        author: row.author,
        authorRole: row.authorRole,
        readTime: row.readTime,
        date: row.publishedAt.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        icon: getCategoryIcon(row.category),
        accentColor: "from-blue-600 to-cyan-500",
        coverImage: row.coverImage || "/blog/cloud-tms.jpg",
        content: row.content as unknown as Article["content"],
      };
    }
  } catch (error) {
    console.warn(`[getArticleBySlugFromDb] Fallback for ${slug}:`, error);
  }

  return ARTICLES.find((a) => a.slug === slug);
}

function getCategoryIcon(category: string): string {
  if (category.includes("Kargo")) return "📦";
  if (category.includes("Pajak") || category.includes("Finansial") || category.includes("Piutang")) return "📊";
  if (category.includes("TMS") || category.includes("Teknologi")) return "🔒";
  return "📰";
}
