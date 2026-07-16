
-- help_contacts
CREATE TABLE public.help_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,
  email text,
  phone text,
  whatsapp text,
  notes text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.help_contacts TO authenticated;
GRANT ALL ON public.help_contacts TO service_role;
ALTER TABLE public.help_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read active help contacts"
  ON public.help_contacts FOR SELECT TO authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage help contacts"
  ON public.help_contacts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_help_contacts_updated_at BEFORE UPDATE ON public.help_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- help_articles
CREATE TABLE public.help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  category text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.help_articles TO authenticated;
GRANT ALL ON public.help_articles TO service_role;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read active help articles"
  ON public.help_articles FOR SELECT TO authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage help articles"
  ON public.help_articles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_help_articles_updated_at BEFORE UPDATE ON public.help_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- help_faqs
CREATE TABLE public.help_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.help_faqs TO authenticated;
GRANT ALL ON public.help_faqs TO service_role;
ALTER TABLE public.help_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read active help faqs"
  ON public.help_faqs FOR SELECT TO authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage help faqs"
  ON public.help_faqs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_help_faqs_updated_at BEFORE UPDATE ON public.help_faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed an initial helpdesk contact so the page isn't empty
INSERT INTO public.help_contacts (name, role, email, sort_order) VALUES
  ('BSC Support', 'Help desk', 'support@becauseshecan.com', 0);
