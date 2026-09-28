-- Preserve historical product and order records, but remove non-Nariño origins
-- from the active catalog before enforcing the new sourcing policy.
UPDATE "Product"
SET "active" = false,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "active" = true
  AND translate(lower("origin"), 'áéíóúüñ', 'aeiouun') NOT LIKE '%narino%';

ALTER TABLE "Product"
ADD CONSTRAINT "Product_active_origin_must_be_narino"
CHECK (
  NOT "active"
  OR translate(lower("origin"), 'áéíóúüñ', 'aeiouun') LIKE '%narino%'
);
