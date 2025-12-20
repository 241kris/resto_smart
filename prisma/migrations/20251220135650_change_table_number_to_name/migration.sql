-- AlterTable
ALTER TABLE "Table" RENAME COLUMN "number" TO "name";

-- AlterTable
ALTER TABLE "Table" ALTER COLUMN "name" TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Table_restaurantId_name_key" ON "Table"("restaurantId", "name");
