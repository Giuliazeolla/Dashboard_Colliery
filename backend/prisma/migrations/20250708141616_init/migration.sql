-- CreateTable
CREATE TABLE "Commessa" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "localita" TEXT NOT NULL,
    "coordinate" TEXT,
    "numeroPali" INTEGER NOT NULL,
    "numeroStrutture" INTEGER NOT NULL,
    "numeroModuli" INTEGER NOT NULL,
    "dataInizio" TIMESTAMP(3) NOT NULL,
    "dataFine" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commessa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attivita" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "commessaId" INTEGER,

    CONSTRAINT "Attivita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operaio" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "attivitaId" INTEGER,

    CONSTRAINT "Operaio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mezzo" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "attivitaId" INTEGER,

    CONSTRAINT "Mezzo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attrezzo" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "attivitaId" INTEGER,

    CONSTRAINT "Attrezzo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "resetPasswordToken" TEXT NOT NULL,
    "resetPasswordExpires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Attivita_nome_key" ON "Attivita"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Operaio_nome_key" ON "Operaio"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Mezzo_nome_key" ON "Mezzo"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Attrezzo_nome_key" ON "Attrezzo"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Attivita" ADD CONSTRAINT "Attivita_commessaId_fkey" FOREIGN KEY ("commessaId") REFERENCES "Commessa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operaio" ADD CONSTRAINT "Operaio_attivitaId_fkey" FOREIGN KEY ("attivitaId") REFERENCES "Attivita"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mezzo" ADD CONSTRAINT "Mezzo_attivitaId_fkey" FOREIGN KEY ("attivitaId") REFERENCES "Attivita"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attrezzo" ADD CONSTRAINT "Attrezzo_attivitaId_fkey" FOREIGN KEY ("attivitaId") REFERENCES "Attivita"("id") ON DELETE SET NULL ON UPDATE CASCADE;
