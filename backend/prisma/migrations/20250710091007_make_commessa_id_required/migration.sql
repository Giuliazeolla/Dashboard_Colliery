/*
  Warnings:

  - You are about to drop the column `attivitaId` on the `Attrezzo` table. All the data in the column will be lost.
  - You are about to drop the column `attivitaId` on the `Mezzo` table. All the data in the column will be lost.
  - You are about to drop the column `attivitaId` on the `Operaio` table. All the data in the column will be lost.
  - Made the column `commessaId` on table `Attivita` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Attivita" DROP CONSTRAINT "Attivita_commessaId_fkey";

-- DropForeignKey
ALTER TABLE "Attrezzo" DROP CONSTRAINT "Attrezzo_attivitaId_fkey";

-- DropForeignKey
ALTER TABLE "Mezzo" DROP CONSTRAINT "Mezzo_attivitaId_fkey";

-- DropForeignKey
ALTER TABLE "Operaio" DROP CONSTRAINT "Operaio_attivitaId_fkey";

-- AlterTable
ALTER TABLE "Attivita" ALTER COLUMN "commessaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Attrezzo" DROP COLUMN "attivitaId";

-- AlterTable
ALTER TABLE "Mezzo" DROP COLUMN "attivitaId";

-- AlterTable
ALTER TABLE "Operaio" DROP COLUMN "attivitaId";

-- CreateTable
CREATE TABLE "_AttivitaOperai" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AttivitaOperai_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AttivitaMezzi" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AttivitaMezzi_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AttivitaAttrezzi" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AttivitaAttrezzi_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AttivitaOperai_B_index" ON "_AttivitaOperai"("B");

-- CreateIndex
CREATE INDEX "_AttivitaMezzi_B_index" ON "_AttivitaMezzi"("B");

-- CreateIndex
CREATE INDEX "_AttivitaAttrezzi_B_index" ON "_AttivitaAttrezzi"("B");

-- AddForeignKey
ALTER TABLE "Attivita" ADD CONSTRAINT "Attivita_commessaId_fkey" FOREIGN KEY ("commessaId") REFERENCES "Commessa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttivitaOperai" ADD CONSTRAINT "_AttivitaOperai_A_fkey" FOREIGN KEY ("A") REFERENCES "Attivita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttivitaOperai" ADD CONSTRAINT "_AttivitaOperai_B_fkey" FOREIGN KEY ("B") REFERENCES "Operaio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttivitaMezzi" ADD CONSTRAINT "_AttivitaMezzi_A_fkey" FOREIGN KEY ("A") REFERENCES "Attivita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttivitaMezzi" ADD CONSTRAINT "_AttivitaMezzi_B_fkey" FOREIGN KEY ("B") REFERENCES "Mezzo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttivitaAttrezzi" ADD CONSTRAINT "_AttivitaAttrezzi_A_fkey" FOREIGN KEY ("A") REFERENCES "Attivita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttivitaAttrezzi" ADD CONSTRAINT "_AttivitaAttrezzi_B_fkey" FOREIGN KEY ("B") REFERENCES "Attrezzo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
