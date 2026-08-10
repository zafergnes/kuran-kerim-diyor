-- Reconcile columns/models that existed in schema.prisma but were missing from
-- the historical production migration chain. All additions are non-destructive.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "isBanned" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "reactivatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'USER';

CREATE TABLE IF NOT EXISTS "UserProgress" (
  "userId" TEXT NOT NULL,
  "currentSurah" INTEGER NOT NULL DEFAULT 1,
  "currentAyah" INTEGER NOT NULL DEFAULT 1,
  "completedSurahs" TEXT NOT NULL DEFAULT '[]',
  "seenAchievements" TEXT NOT NULL DEFAULT '[]',
  "hatimCount" INTEGER NOT NULL DEFAULT 0,
  "readCounts" TEXT NOT NULL DEFAULT '{}',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("userId")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserProgress_userId_fkey'
  ) THEN
    ALTER TABLE "UserProgress"
      ADD CONSTRAINT "UserProgress_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
