import { prisma } from "@/lib/prisma";
import BomClient from "./BomClient";

export const dynamic = 'force-dynamic';

export default async function BomPage() {
  const list = await prisma.bom.findMany({ include:{ sku:true, material:true }, orderBy:{ id:"asc" } });
  const skus = await prisma.productSku.findMany({ include:{ product:{ include:{ work:true } } } });
  const materials = await prisma.rawMaterial.findMany({ orderBy:{ name:"asc" } });
  return <BomClient list={list} skus={skus} materials={materials} />;
}
