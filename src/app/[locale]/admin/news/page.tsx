import { prisma } from "@/lib/prisma";
import NewsClient from "./_components/NewsClient";

export const dynamic = "force-dynamic";

export default async function NewsAdminPage() {
  const items = await prisma.news.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const serialized = items.map((item) => ({
    ...item,
    publishAt: item.publishAt?.toISOString() ?? null,
    expireAt: item.expireAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return <NewsClient initialItems={serialized} />;
}
