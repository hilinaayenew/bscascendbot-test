-- Restrict direct SELECT on help_contacts to admins only.
-- Expose curated public-safe contact data via a SECURITY DEFINER RPC so authenticated
-- users can still render the Help Center "Key contacts" section without granting
-- broad table-level access to email/phone/whatsapp columns.

DROP POLICY IF EXISTS "Authenticated can read active help contacts" ON public.help_contacts;

CREATE POLICY "Admins can read help contacts"
ON public.help_contacts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.get_public_help_contacts()
RETURNS TABLE (
  id uuid,
  name text,
  role text,
  email text,
  phone text,
  whatsapp text,
  notes text,
  sort_order int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, role, email, phone, whatsapp, notes, sort_order
  FROM public.help_contacts
  WHERE is_active = true
  ORDER BY sort_order, name;
$$;

REVOKE ALL ON FUNCTION public.get_public_help_contacts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_help_contacts() TO authenticated;
