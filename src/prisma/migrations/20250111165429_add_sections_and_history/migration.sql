/*
  Warnings:

  - You are about to drop the column `content` on the `Proposal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Proposal" DROP COLUMN "content";

-- CreateTable
CREATE TABLE "Section" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "order" INTEGER NOT NULL,
    "proposalId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalHistory" (
    "id" SERIAL NOT NULL,
    "proposalId" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Section_proposalId_order_idx" ON "Section"("proposalId", "order");

-- CreateIndex
CREATE INDEX "ProposalHistory_proposalId_version_idx" ON "ProposalHistory"("proposalId", "version");

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalHistory" ADD CONSTRAINT "ProposalHistory_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
