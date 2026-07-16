import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

const FAQSection = () => {
  const [faqs, setFaqs] = useState<Faq[]>([]);

  useEffect(() => {
    supabase
      .from("help_faqs")
      .select("id, question, answer, category, sort_order")
      .eq("is_active", true)
      .order("sort_order")
      .order("question")
      .then(({ data }) => setFaqs((data as Faq[]) || []));
  }, []);

  if (faqs.length === 0) return null;

  const grouped = faqs.reduce<Record<string, Faq[]>>((acc, f) => {
    const key = f.category || "Other";
    (acc[key] ||= []).push(f);
    return acc;
  }, {});

  return (
    <section id="faqs" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="font-body text-muted-foreground sora-regular">
            Everything you need to know about Ascendency.
          </p>
        </div>

        <div className="space-y-10">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h3 className="font-display text-xl font-bold mb-3 text-primary">
                {category}
              </h3>
              <Accordion type="multiple" className="w-full">
                {items.map((f) => (
                  <AccordionItem key={f.id} value={f.id}>
                    <AccordionTrigger className="font-body text-left sora-semibold">
                      {f.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="font-body text-sm md:text-base whitespace-pre-wrap leading-relaxed text-foreground/80 sora-regular">
                        {renderAnswer(f.answer)}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;