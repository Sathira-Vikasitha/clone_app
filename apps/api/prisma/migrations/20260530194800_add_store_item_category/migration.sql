ALTER TABLE "StoreItem"
ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'Other';

CREATE INDEX IF NOT EXISTS "StoreItem_category_idx"
ON "StoreItem"("category");
