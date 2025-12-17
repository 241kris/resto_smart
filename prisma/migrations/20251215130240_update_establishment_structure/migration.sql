/*
  Warnings:

  - You are about to drop the column `image_cover` on the `Establishment` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Establishment` table. All the data in the column will be lost.
  - The `address` column on the `Establishment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `images` to the `Establishment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phones` to the `Establishment` table without a default value. This is not possible if the table is not empty.
  - Made the column `slug` on table `Establishment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Establishment" DROP COLUMN "image_cover",
DROP COLUMN "phone",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "images" JSONB NOT NULL,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "phones" JSONB NOT NULL,
DROP COLUMN "address",
ADD COLUMN     "address" JSONB,
ALTER COLUMN "slug" SET NOT NULL;
