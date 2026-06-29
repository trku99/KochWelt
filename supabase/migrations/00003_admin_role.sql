-- Add admin role to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Set the admin user
UPDATE profiles SET is_admin = true WHERE username = 'admin';
