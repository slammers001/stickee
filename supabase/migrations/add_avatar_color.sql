-- Fixed, non-editable avatars: users get one random combo, stored once.
--   #fff1bf background with #735c40 letter
--   #ffc2cc background with #735c40 letter
--   #735c40 background with #ffc2cc or #fff1bf letter

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_color text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_avatar_color_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_avatar_color_check
      CHECK (avatar_color IS NULL OR avatar_color IN ('#fff1bf', '#ffc2cc', '#735c40'));
  END IF;
END $$;

-- Give every user that doesn't have one a random valid background color.
UPDATE public.users
SET avatar_color = CASE WHEN random() < 0.34 THEN '#fff1bf' WHEN random() < 0.67 THEN '#ffc2cc' ELSE '#735c40' END
WHERE avatar_color IS NULL OR avatar_color NOT IN ('#fff1bf', '#ffc2cc', '#735c40');
