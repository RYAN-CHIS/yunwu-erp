/**
 * 允物 Brand OS V2.1 — Seed: CTA 配置 + 术语映射 + 首页 CMS
 * 基准：允物品牌宪章
 * 用法: npx tsx scripts/seed-v2-brand-config.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── CTA 配置 ──
const ctaConfigs = [
  { category: "explore",    forbidden: JSON.stringify(["了解更多","Learn more","查看详情","View details"]),  allowed: JSON.stringify(["观其意","看诸物"]),           primary: "观其意",  description: "通用探索引导 · 作品/文章入口" },
  { category: "collection", forbidden: JSON.stringify(["收藏作品","Add to wishlist","加入收藏","Wishlist"]), allowed: JSON.stringify(["留此念","所留之念"]),          primary: "留此念",   description: "收藏操作按钮" },
  { category: "purchase",   forbidden: JSON.stringify(["立即购买","Buy now","购买","Purchase"]),             allowed: JSON.stringify(["结缘此物"]),                 primary: "结缘此物", description: "购买确认按钮 · 作品详情页" },
  { category: "cart",       forbidden: JSON.stringify(["加入购物车","Add to cart","购物车","Cart"]),           allowed: JSON.stringify(["暂寄此念","六会"]),           primary: "暂寄此念", description: "加入购物车操作" },
  { category: "detail",     forbidden: JSON.stringify(["产品详情","Product details","商品详情"]),              allowed: JSON.stringify(["器物履历"]),                  primary: "器物履历", description: "详情页标题 · 替代 Product Spec" },
  { category: "order",      forbidden: JSON.stringify(["确认订单","Checkout","提交订单"]),                    allowed: JSON.stringify(["确认缘起"]),                  primary: "确认缘起", description: "订单确认页标题/按钮" },
  { category: "search",     forbidden: JSON.stringify(["搜索","Search","搜索产品"]),                          allowed: JSON.stringify(["寻物"]),                     primary: "寻物",     description: "搜索输入框 placeholder" },
  { category: "contact",    forbidden: JSON.stringify(["联系我们","Contact us","客服"]),                      allowed: JSON.stringify(["与允物对话"]),                primary: "与允物对话",description: "联系入口/客服标题" },
];

// ── 术语映射 ──
const termConfigs = [
  { concept: "product",    forbidden: JSON.stringify(["产品","Product","商品","Item","Goods"]),    allowed: "作品",    note: "宪章：器物体系定义，作品是人与器物关系的载体" },
  { concept: "user",       forbidden: JSON.stringify(["用户","User","顾客","Customer","买家"]),   allowed: "同行者",  note: "宪章第十一篇：同行者，不拥有用户，只陪伴同行" },
  { concept: "collection", forbidden: JSON.stringify(["全部作品","All products","产品列表"]),      allowed: "诸物",    note: "诸物 · 作品集合的雅称" },
  { concept: "favorite",   forbidden: JSON.stringify(["收藏","Favorite","Wishlist","喜欢"]),      allowed: "留念",    note: "留念 · 记住而非占有" },
  { concept: "buy",        forbidden: JSON.stringify(["购买","Buy","下单","Order","付款"]),        allowed: "结缘",    note: "结缘 · 人与器物相遇，而非交易" },
  { concept: "shop",       forbidden: JSON.stringify(["商店","Shop","商城","Store"]),             allowed: "器物空间",note: "器物空间 · 数字化器物空间而非电商" },
  { concept: "price",      forbidden: JSON.stringify(["价格","Price","售价"]),                     allowed: "结缘之资",note: "温润表达价格概念，前台不强调" },
];

// ── 首页四段 CMS ──
const homeSections = [
  { type: "SEE",        sortOrder: 1, content: "首屏仅展示一件作品。禁止carousel、多列产品墙、滑动推荐。像展览开场，先见一物。", ctaText: null, ctaLink: null },
  { type: "ORIGIN",     sortOrder: 2, content: "展示材质来源、地域来源、工艺来源。先让物成立。", ctaText: null, ctaLink: null },
  { type: "MEANING",    sortOrder: 3, content: "器物为何存在。不是卖点，是意义。叙事段落，不是产品规格。", ctaText: null, ctaLink: null },
  { type: "CONNECTION", sortOrder: 4, content: "最后才允许CTA。先见→再知→再懂→再缘。", ctaText: "结缘此物", ctaLink: "/works" },
];

async function main() {
  console.log("── Seed V2.1 Brand Config ──");

  // CtaConfig
  for (const cfg of ctaConfigs) {
    const result = await prisma.ctaConfig.upsert({
      where: { category: cfg.category },
      update: cfg,
      create: cfg,
    });
    console.log(`  CtaConfig: ${result.category} → ${result.primary}`);
  }

  // TermConfig
  for (const term of termConfigs) {
    const result = await prisma.termConfig.upsert({
      where: { concept: term.concept },
      update: term,
      create: term,
    });
    console.log(`  TermConfig: ${result.concept} → ${result.allowed}`);
  }

  // HomeSection
  for (const section of homeSections) {
    const result = await prisma.homeSection.upsert({
      where: { id: section.sortOrder },  // 使用 sortOrder 作为临时 ID
      update: { type: section.type, sortOrder: section.sortOrder, content: section.content, ctaText: section.ctaText, ctaLink: section.ctaLink },
      create: { type: section.type, sortOrder: section.sortOrder, content: section.content, ctaText: section.ctaText, ctaLink: section.ctaLink },
    });
    console.log(`  HomeSection: ${section.type} (order: ${section.sortOrder})`);
  }

  console.log("── Seed complete ──");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
