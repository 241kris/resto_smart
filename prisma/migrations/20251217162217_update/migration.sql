/*
  Warnings:

  - You are about to drop the column `customer` on the `OrderItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customer" JSONB;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "customer";
