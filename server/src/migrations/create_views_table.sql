-- Create views table
CREATE TABLE IF NOT EXISTS views (
  id SERIAL PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  viewer_identifier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_views_post_id ON views (post_id);
CREATE INDEX IF NOT EXISTS idx_views_viewer_identifier ON views (viewer_identifier, post_id);
CREATE INDEX IF NOT EXISTS idx_views_created_at ON views (created_at);

-- Add a comment to the table
COMMENT ON TABLE views IS 'Stores post view information including anonymous views'; 