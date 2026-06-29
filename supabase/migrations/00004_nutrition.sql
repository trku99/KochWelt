ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS calories       integer,
  ADD COLUMN IF NOT EXISTS protein_g      decimal(6,1),
  ADD COLUMN IF NOT EXISTS carbs_g        decimal(6,1),
  ADD COLUMN IF NOT EXISTS fat_g          decimal(6,1);
