import { Link } from "react-router-dom";

const Footer = () => {
  const links: Record<string, { label: string; href: string }[]> = {
    Platform: [
      { label: "Pathways", href: "#" },
      { label: "Free Cohort", href: "#" },
      { label: "Marketplace", href: "#" },
      { label: "AI Matching", href: "#" },
    ],
    Business: [
      { label: "Enterprise Solutions", href: "#" },
      { label: "Staff Training", href: "#" },
      { label: "Analytics", href: "#" },
      { label: "Request Demo", href: "#" },
    ],
    Company: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#" },
    ],
    Legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "FAQ", href: "/faq" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
    ],
  };

  return (
    <footer className="bg-accent text-accent-foreground py-16">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span className="font-display text-2xl font-bold">Ascendency</span>
            <p className="font-body text-xs text-accent-foreground/60 mt-2 sora-light">
              by Because She Can
            </p>
            <p className="font-body text-sm text-accent-foreground/60 mt-3 leading-relaxed sora-light">
              The trusted mentorship ecosystem for ambitious Africans.
            </p>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-body text-sm sora-semibold mb-4">{category}</h4>
              <ul className="flex flex-col gap-2">
                {items.map((item) => {
                  const isInternal = item.href.startsWith("/");
                  return (
                    <li key={item.label}>
                      {isInternal ? (
                        <Link
                          to={item.href}
                          className="font-body text-sm text-accent-foreground/60 hover:text-primary transition-colors sora-regular"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <a
                          href={item.href}
                          className="font-body text-sm text-accent-foreground/60 hover:text-primary transition-colors sora-regular"
                        >
                          {item.label}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-accent-foreground/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-sm text-accent-foreground/40 sora-light">
            © {new Date().getFullYear()} Because She Can. All rights reserved.
          </p>
          <p className="font-body text-sm text-accent-foreground/40 sora-light">
            Built with 🤎 for Africa
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
