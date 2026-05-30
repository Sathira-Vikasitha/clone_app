CREATE TABLE IF NOT EXISTS "StoreDownload" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StoreDownload_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StoreDownload_itemId_idx"
ON "StoreDownload"("itemId");

CREATE INDEX IF NOT EXISTS "StoreDownload_userId_idx"
ON "StoreDownload"("userId");

CREATE INDEX IF NOT EXISTS "StoreDownload_createdAt_idx"
ON "StoreDownload"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'StoreDownload_itemId_fkey'
  ) THEN
    ALTER TABLE "StoreDownload"
    ADD CONSTRAINT "StoreDownload_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "StoreItem"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'StoreDownload_userId_fkey'
  ) THEN
    ALTER TABLE "StoreDownload"
    ADD CONSTRAINT "StoreDownload_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
