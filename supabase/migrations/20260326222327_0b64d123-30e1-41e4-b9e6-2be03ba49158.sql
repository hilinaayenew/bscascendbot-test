
CREATE TABLE public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  redeemed_by uuid,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage discount codes"
  ON public.discount_codes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can view codes to validate them (needed for code entry)
CREATE POLICY "Authenticated can check codes"
  ON public.discount_codes FOR SELECT
  TO authenticated
  USING (true);

-- Mentees can redeem a code (update redeemed_by)
CREATE POLICY "Mentees can redeem codes"
  ON public.discount_codes FOR UPDATE
  TO authenticated
  USING (redeemed_by IS NULL)
  WITH CHECK (redeemed_by = auth.uid());
