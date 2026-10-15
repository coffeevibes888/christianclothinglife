-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "imageColors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "subCategory" TEXT;
