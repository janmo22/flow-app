-- Repair Competitors Table Columns
-- Adds missing columns that are expected by the application code

ALTER TABLE competitors ADD COLUMN IF NOT EXISTS followers integer DEFAULT 0;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS analysis_data jsonb DEFAULT '{}'::jsonb;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS last_scraped_at timestamp with time zone;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS last_content_scrape timestamp with time zone;
