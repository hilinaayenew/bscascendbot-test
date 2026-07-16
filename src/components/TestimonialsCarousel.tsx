import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Quote } from "lucide-react";
import { SmartAvatarImg } from "@/components/SmartAvatarImage";

type Testimonial = {
  id: string;
  content: string;
  role: string;
  user_id: string;
  full_name?: string | null;
  country?: string | null;
  avatar_url?: string | null;
};

const TestimonialsCarousel = () => {
  const [items, setItems] = useState<Testimonial[]>([]);

  useEffect(() => {
    (async () => {
      const { data: rows } = await supabase
        .from("testimonials" as any)
        .select("id, content, role, user_id, created_at")
        .eq("display_on_homepage", true)
        .order("created_at", { ascending: false })
        .limit(20);
      const list = (rows as any[]) || [];
      if (list.length === 0) {
        setItems([]);
        return;
      }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, country, avatar_url")
        .in("user_id", list.map((t) => t.user_id));
      const map = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      setItems(
        list.map((t) => ({
          ...t,
          full_name: map.get(t.user_id)?.full_name,
          country: map.get(t.user_id)?.country,
          avatar_url: map.get(t.user_id)?.avatar_url,
        })),
      );
    })();
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-muted">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="font-body text-xs tracking-widest uppercase text-primary mb-3">In Their Words</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-accent">
            Voices from Ascendency
          </h2>
        </div>

        <Carousel
          opts={{ loop: true, align: "start" }}
          plugins={[Autoplay({ delay: 6000, stopOnInteraction: true })]}
          className="max-w-4xl mx-auto"
        >
          <CarouselContent>
            {items.map((t) => (
              <CarouselItem key={t.id}>
                <div className="px-2 md:px-8">
                  <div className="bg-card rounded-lg shadow-card p-8 md:p-12 relative">
                    <Quote className="absolute top-6 left-6 h-8 w-8 text-primary/15" />
                    <p className="font-body text-base md:text-lg text-foreground/85 leading-relaxed italic relative z-10">
                      "{t.content}"
                    </p>
                    <div className="mt-8 flex items-center gap-3">
                      {t.avatar_url ? (
                        <SmartAvatarImg
                          avatarUrl={t.avatar_url}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-body text-sm font-semibold">
                          {(t.full_name || "?")[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-body text-sm font-semibold text-accent">
                          {t.full_name || "Ascendency member"}
                        </p>
                        <p className="font-body text-xs text-muted-foreground capitalize">
                          {t.role}
                          {t.country ? ` · ${t.country}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {items.length > 1 && (
            <>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </>
          )}
        </Carousel>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;