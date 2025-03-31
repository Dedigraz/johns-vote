-- AlterTable
ALTER TABLE "SubmissionGroup" ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isJudged" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "isUpvote" BOOLEAN NOT NULL,
    "isDownvote" BOOLEAN NOT NULL,
    "submissionGroupId" TEXT,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_submissionId_key" ON "Vote"("userId", "submissionId");

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_submissionGroupId_fkey" FOREIGN KEY ("submissionGroupId") REFERENCES "SubmissionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
