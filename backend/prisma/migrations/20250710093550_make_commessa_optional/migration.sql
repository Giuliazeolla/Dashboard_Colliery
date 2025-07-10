-- DropForeignKey
ALTER TABLE "Attivita" DROP CONSTRAINT "Attivita_commessaId_fkey";

-- AlterTable
ALTER TABLE "Attivita" ALTER COLUMN "commessaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Attivita" ADD CONSTRAINT "Attivita_commessaId_fkey" FOREIGN KEY ("commessaId") REFERENCES "Commessa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
