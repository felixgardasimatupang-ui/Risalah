-- Add domain field to Organization
ALTER TABLE "Organization" ADD COLUMN "domain" TEXT;
UPDATE "Organization" SET "domain" = "slug" WHERE "domain" IS NULL;
ALTER TABLE "Organization" ALTER COLUMN "domain" SET NOT NULL;
CREATE UNIQUE INDEX "Organization_domain_key" ON "Organization"("domain");
