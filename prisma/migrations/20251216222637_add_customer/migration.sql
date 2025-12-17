-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "tableId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "customer" JSONB;
