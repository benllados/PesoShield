-- Allow users to delete their own account via RPC
-- Cascades to profiles table via existing FK constraint
CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
