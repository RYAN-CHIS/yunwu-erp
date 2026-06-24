import { prisma } from "@/lib/prisma";
import HomeSectionsClient from "./HomeSectionsClient";

/**
 * 首页结构管理 — Server Component
 */
export default async function HomeSectionsPage() {
  const sections = await prisma.homeSection.findMany({
    orderBy: { sortOrder: "asc" },
    include: { work: { select: { id: true, name: true, code: true } } },
  });

  const works = await prisma.works.findMany({
    where: { status: { notIn: ["ARCHIVED"] } },
    orderBy: { code: "asc" },
    select: { id: true, name: true, code: true },
  });

  return <HomeSectionsClient sections={sections} works={works} />;
}
