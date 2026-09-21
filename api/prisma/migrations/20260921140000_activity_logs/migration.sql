-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "userEmail" TEXT,
    "userName" TEXT,
    "type" TEXT NOT NULL,
    "method" TEXT,
    "path" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" INTEGER,
    "message" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_type_idx" ON "ActivityLog"("type");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");
