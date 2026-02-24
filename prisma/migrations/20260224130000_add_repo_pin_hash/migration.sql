-- Add optional repository PIN hash for private-repo unlock flow
ALTER TABLE "Repo"
ADD COLUMN "repo_pin_hash" TEXT;
