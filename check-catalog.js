const {PrismaClient}=require("/app/node_modules/@prisma/client");
const prisma=new PrismaClient();
async function main(){
  const counts = {};
  counts.products = await prisma.product.count();
  counts.productCompositions = await prisma.productComposition.count();
  counts.compositionGroups = await prisma.compositionGroup.count();
  counts.canonicalProducts = await prisma.canonicalProduct.count();
  console.log(JSON.stringify(counts, null, 2));
}
main().catch(console.error);