INSERT INTO activity_types (name, slug, icon)
VALUES
  ('Badminton', 'badminton', 'shuttlecock'),
  ('Pickleball', 'pickleball', 'circle-dot'),
  ('General', 'general', 'users')
ON CONFLICT (slug) DO NOTHING;
