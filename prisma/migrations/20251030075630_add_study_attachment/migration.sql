-- CreateTable
CREATE TABLE "StudyAttachment" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyAttachment_studyId_idx" ON "StudyAttachment"("studyId");

-- AddForeignKey
ALTER TABLE "StudyAttachment" ADD CONSTRAINT "StudyAttachment_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE CASCADE ON UPDATE CASCADE;
