/**
 * Purpose: Shared content block for the Help Center — Key contacts, Helpful information, Help desk (FAQs + mailto).
 * DB tables: help_contacts, help_articles, help_faqs
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, Phone, MessageCircle, BookOpen, Users, HelpCircle, MessageSquare, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { WALKTHROUGHS, WalkthroughRole, getRoleForUser } from "@/lib/walkthroughContent";
import { Button } from "@/components/ui/button";

type Contact = { id: string; name: string; role: string | null; email: string | null; phone: string | null; whatsapp: string | null; notes: string | null };
type Article = { id: string; title: string; body: string; category: string | null };
type Faq = { id: string; question: string; answer: string; category: string | null };

const PRIVACY_PHRASE = "Read our Privacy Policy";

const renderAnswer = (answer: string) => {
  if (!answer.includes(PRIVACY_PHRASE)) return answer;
  const parts = answer.split(PRIVACY_PHRASE);
  return parts.flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <Link
            key={`pp-${i}`}
            to="/privacy"
            className="text-primary underline hover:no-underline"
          >
            {PRIVACY_PHRASE}
          </Link>,
          part,
        ],
  );
};

const HelpContent = ({ compact = false }: { compact?: boolean }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const { roles } = useAuth();
  const defaultRole: WalkthroughRole = getRoleForUser(roles || []);
  const [tourRole, setTourRole] = useState<WalkthroughRole>(defaultRole);
  useEffect(() => { setTourRole(defaultRole); }, [defaultRole]);
  const guide = WALKTHROUGHS[tourRole];

  useEffect(() => {
    let mounted = true;
    Promise.all([
      (supabase.rpc as any)("get_public_help_contacts"),
      supabase.from("help_articles").select("*").eq("is_active", true).order("sort_order").order("title"),
      supabase.from("help_faqs").select("*").eq("is_active", true).order("sort_order").order("question"),
    ]).then(([c, a, f]) => {
      if (!mounted) return;
      setContacts((c.data as Contact[]) || []);
      setArticles((a.data as Article[]) || []);
      setFaqs((f.data as Faq[]) || []);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const faqsByCategory = faqs.reduce<Record<string, Faq[]>>((acc, f) => {
    const key = f.category || "Other";
    (acc[key] ||= []).push(f);
    return acc;
  }, {});

  return (
    <div className={compact ? "space-y-6" : "space-y-10"}>
      {/* Getting started walkthrough */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-bold">Getting started</h2>
        </div>
        <p className="font-body text-sm text-muted-foreground mb-3">
          A step-by-step walkthrough of Ascendency. Switch the view to see it from another role's perspective.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(WALKTHROUGHS) as WalkthroughRole[]).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={tourRole === r ? "default" : "outline"}
              onClick={() => setTourRole(r)}
              className="font-body"
            >
              {WALKTHROUGHS[r].label}
            </Button>
          ))}
        </div>
        <p className="font-body text-sm text-foreground/80 mb-4">{guide.intro}</p>
        <ol className="space-y-3">
          {guide.steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={i} className="flex items-start gap-3 p-3 border rounded-lg bg-card">
                <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-sm">
                    <span className="text-muted-foreground mr-1">{i + 1}.</span>
                    {step.title}
                  </p>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed mt-0.5">
                    {step.body}
                  </p>
                  {step.href && step.cta && (
                    <Link
                      to={step.href}
                      className="font-body text-sm text-primary underline hover:no-underline inline-block mt-1"
                    >
                      {step.cta} →
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Key contacts */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-bold">Key contacts</h2>
        </div>
        {loading ? (
          <p className="font-body text-sm text-muted-foreground">Loading…</p>
        ) : contacts.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">No contacts available yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {contacts.map((c) => (
              <div key={c.id} className="p-4 space-y-1 border rounded-lg bg-card">
                <p className="font-body font-semibold">{c.name}</p>
                {c.role && <p className="font-body text-xs text-muted-foreground">{c.role}</p>}
                {c.notes && <p className="font-body text-sm mt-1">{c.notes}</p>}
                <div className="flex flex-wrap gap-3 pt-2 text-sm font-body">
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-primary hover:underline break-all">
                      <Mail className="h-3.5 w-3.5 shrink-0" />{c.email}
                    </a>
                  )}
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Phone className="h-3.5 w-3.5 shrink-0" />{c.phone}
                    </a>
                  )}
                  {c.whatsapp && (
                    <a
                      href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <MessageCircle className="h-3.5 w-3.5 shrink-0" />WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Helpful information */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-bold">Helpful information</h2>
        </div>
        {loading ? (
          <p className="font-body text-sm text-muted-foreground">Loading…</p>
        ) : (
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="bsc-admin-messages">
              <AccordionTrigger className="font-body text-left">
                <span>Message the BSC Admin</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="font-body text-sm whitespace-pre-wrap leading-relaxed text-foreground/80">
                  You can message the BSC Admin directly at any time through the{" "}
                  <Link to="/dashboard/messages" className="text-primary underline hover:no-underline">Messages</Link>{" "}
                  tab. Whether you have a question, need support, or want to share feedback, the BSC Admin is available to help.
                </div>
              </AccordionContent>
            </AccordionItem>
            {articles.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground py-2">No additional articles yet.</p>
            ) : (
              articles.map((a) => (
                <AccordionItem key={a.id} value={a.id}>
                  <AccordionTrigger className="font-body text-left">
                    <span>
                      {a.title}
                      {a.category && (
                        <span className="ml-2 text-xs text-muted-foreground font-normal">· {a.category}</span>
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="font-body text-sm whitespace-pre-wrap leading-relaxed text-foreground/80">
                      {a.body}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))
            )}
          </Accordion>
        )}
      </section>

      {/* FAQs */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-bold">FAQs</h2>
        </div>
        {loading ? (
          <p className="font-body text-sm text-muted-foreground">Loading…</p>
        ) : faqs.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">No FAQs yet.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(faqsByCategory).map(([category, items]) => (
              <div key={category}>
                <h3 className="font-body font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  {category}
                </h3>
                <Accordion type="multiple" className="w-full">
                  {items.map((f) => (
                    <AccordionItem key={f.id} value={f.id}>
                      <AccordionTrigger className="font-body text-left">{f.question}</AccordionTrigger>
                      <AccordionContent>
                        <div className="font-body text-sm whitespace-pre-wrap leading-relaxed text-foreground/80">
                          {renderAnswer(f.answer)}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default HelpContent;