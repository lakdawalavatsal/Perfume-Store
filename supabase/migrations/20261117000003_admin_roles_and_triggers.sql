-- ============================================================================
-- MANGAALAM LUXURY PERFUMES — Admin Roles & Supabase Auth Sync
-- Migration: 20261117000003_admin_roles_and_triggers.sql
-- Description: Connects Supabase Auth (auth.users) to admin_profiles
-- ============================================================================

-- Function to assign the owner role to a user registered in Supabase Auth
CREATE OR REPLACE FUNCTION assign_admin_owner(target_email TEXT, owner_name TEXT DEFAULT 'Mrs. Manisha Mehta')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(target_email);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User "%" does not exist in auth.users. Please sign up or invite the user first in Supabase Auth.', target_email;
  END IF;

  INSERT INTO admin_profiles (id, email, name, role)
  VALUES (v_user_id, lower(target_email), owner_name, 'owner')
  ON CONFLICT (id) DO UPDATE SET
    role = 'owner',
    name = EXCLUDED.name,
    updated_at = timezone('utc', now());
END;
$$;

-- Trigger to automatically create admin profile on user creation if metadata contains role
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'role' IN ('owner', 'admin') THEN
    INSERT INTO admin_profiles (id, email, name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', 'Mrs. Manisha Mehta'),
      (NEW.raw_user_meta_data->>'role')::text
    )
    ON CONFLICT (id) DO UPDATE SET
      role = EXCLUDED.role,
      name = EXCLUDED.name,
      updated_at = timezone('utc', now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();
