-- Add stack ranking metadata fields
ALTER TABLE "User"
ADD COLUMN "initialStackRanked" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Rating"
ADD COLUMN "position" DECIMAL(65,30),
ADD COLUMN "cachedTitle" TEXT,
ADD COLUMN "cachedPosterPath" TEXT,
ADD COLUMN "cachedReleaseDate" TEXT;
