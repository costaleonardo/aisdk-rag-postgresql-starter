-- Migration to add file upload support columns to existing documents table
-- Run this if you have an existing database without the file columns

ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_type VARCHAR(50);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'text';

-- Update existing records to have source_type based on whether they have a URL
UPDATE documents 
SET source_type = CASE 
    WHEN url IS NOT NULL AND url != '' THEN 'url'
    ELSE 'text'
END
WHERE source_type IS NULL;