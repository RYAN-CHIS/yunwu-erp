import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 10);

  const existing = await prisma.user.findUnique({
    where: { email: "admin@yunwu.com" },
  });

  if (existing) {
    console.log("管理员账号已存在，跳过创建");
    return;
  }

  await prisma.user.create({
    data: {
      email: "admin@yunwu.com",
      password,
      role: "admin",
      name: "Admin",
    },
  });

  console.log("✅ 管理员账号创建成功");
  console.log("   邮箱: admin@yunwu.com");
  console.log("   密码: admin123");

  // ── 作品种子数据（幂等：已存在则跳过）──
  const existingWorks = await prisma.works.count();
  if (existingWorks === 0) {
    const seriesList = await prisma.series.findMany({ select: { id: true, code: true } });
    const seriesMap = Object.fromEntries(seriesList.map((s) => [s.code, s.id]));

    const works = [
      { code: "W001", name: "空相", seriesCode: "qichi" },
      { code: "W002", name: "止观", seriesCode: "fuchu" },
      { code: "W003", name: "见素", seriesCode: "fusu" },
      { code: "W004", name: "归处", seriesCode: "cangming" },
      { code: "W005", name: "初见", seriesCode: "jiming" },
      { code: "W006", name: "物之初", seriesCode: "guanfu" },
    ];

    for (const w of works) {
      const sid = seriesMap[w.seriesCode];
      if (!sid) continue;
      await prisma.works.create({
        data: { code: w.code, name: w.name, seriesId: sid, status: "READY" },
      });
    }
    console.log(`✅ 作品种子数据创建成功 (${works.length} 条)`);
  }
}

main()
  .catch((e) => {
    console.error("❌ 种子数据失败:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
