const {PrismaClient}=require("/app/node_modules/@prisma/client");
const prisma=new PrismaClient();
async function main(){
  await prisma.mirrorRuntimeControl.upsert({
    where:{key:"drap_mirror:control"},
    update:{state:"running",updatedAt:new Date()},
    create:{key:"drap_mirror:control",state:"running",updatedAt:new Date()}
  });
  console.log("Control state set to running");
}
main().catch(console.error);