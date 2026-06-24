/**
 * 缓存字段更新辅助函数
 * 在订单状态变更时，自动更新 Works/Products 的 companionsCount 和 remainingQuantity
 */
import { prisma } from "@/lib/prisma";

interface OrderItem {
  productId?: number;
  skuId?: number;
  qty: number;
}

/**
 * 订单完成时：增加陪伴人数、扣减剩余数量
 */
export async function onOrderCompleted(orderId: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { items: true },
  });
  if (!order) return;

  let items: OrderItem[] = [];
  try { items = JSON.parse(order.items || "[]"); } catch {}

  for (const item of items) {
    const productId = item.productId;
    if (!productId) continue;

    // 更新产品缓存
    await prisma.products.update({
      where: { id: productId },
      data: {
        companionsCount: { increment: 1 },
        remainingQuantity: item.qty ? { decrement: item.qty } : undefined,
      },
    }).catch(() => {});

    // 同步更新作品缓存
    const product = await prisma.products.findUnique({
      where: { id: productId },
      select: { workId: true },
    });
    if (product?.workId) {
      await prisma.works.update({
        where: { id: product.workId },
        data: {
          companionsCount: { increment: 1 },
          remainingQuantity: item.qty ? { decrement: item.qty } : undefined,
        },
      }).catch(() => {});
    }
  }
}

/**
 * 订单取消/退款时：恢复剩余数量（companionsCount 不减，因为物品曾陪伴过）
 */
export async function onOrderCancelled(orderId: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { items: true },
  });
  if (!order) return;

  let items: OrderItem[] = [];
  try { items = JSON.parse(order.items || "[]"); } catch {}

  for (const item of items) {
    const productId = item.productId;
    if (!productId) continue;

    // 仅恢复剩余数量，不减陪伴人数
    if (item.qty) {
      await prisma.products.update({
        where: { id: productId },
        data: { remainingQuantity: { increment: item.qty } },
      }).catch(() => {});

      const product = await prisma.products.findUnique({
        where: { id: productId },
        select: { workId: true },
      });
      if (product?.workId) {
        await prisma.works.update({
          where: { id: product.workId },
          data: { remainingQuantity: { increment: item.qty } },
        }).catch(() => {});
      }
    }
  }
}
