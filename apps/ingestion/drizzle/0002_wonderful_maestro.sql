ALTER TABLE "events" ADD COLUMN "visitor_id" uuid;
UPDATE "events" SET "visitor_id" = gen_random_uuid() WHERE "visitor_id" IS NULL;
ALTER TABLE "events" ALTER COLUMN "visitor_id" SET NOT NULL;