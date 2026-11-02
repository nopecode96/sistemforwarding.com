import { PrismaClient, Prisma } from "@prisma/client";
import { ARTICLES } from "../src/lib/articles";

const prisma = new PrismaClient();

const COVER_IMAGES: Record<string, string> = {
  "panduan-lengkap-job-file-freight-forwarding": "/blog/job-file.jpg",
  "perhitungan-ppn-1-1-persen-invoice-forwarding": "/blog/tax-ppn.jpg",
  "mengapa-harus-multi-tenant-cloud-tms": "/blog/cloud-tms.jpg",
  "manajemen-piutang-dan-aging-invoice-forwarding": "/blog/tax-ppn.jpg",
};

async function main() {
  console.log("Seeding articles into PostgreSQL...");

  // Hapus artikel lama tentang QRIS klien jika ada
  await prisma.article.deleteMany({
    where: {
      slug: "rekonsiliasi-qris-otomatis-bisnis-logistik",
    },
  });

  for (const a of ARTICLES) {
    const coverImage = COVER_IMAGES[a.slug] || "/blog/cloud-tms.jpg";
    await prisma.article.upsert({
      where: { slug: a.slug },
      update: {
        title: a.title,
        category: a.category,
        summary: a.summary,
        author: a.author,
        authorRole: a.authorRole,
        readTime: a.readTime,
        coverImage,
        content: a.content as unknown as Prisma.InputJsonValue,
        isPublished: true,
      },
      create: {
        slug: a.slug,
        title: a.title,
        category: a.category,
        summary: a.summary,
        author: a.author,
        authorRole: a.authorRole,
        readTime: a.readTime,
        coverImage,
        content: a.content as unknown as Prisma.InputJsonValue,
        isPublished: true,
        publishedAt: new Date(),
      },
    });
    console.log(`✓ Article synced: ${a.slug}`);
  }

  const count = await prisma.article.count();
  console.log(`Total articles in PostgreSQL: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
