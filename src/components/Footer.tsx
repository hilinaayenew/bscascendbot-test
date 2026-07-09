const Footer = () => {
  const links = {
    Platform: ["Pathways", "Free Cohort", "Marketplace", "AI Matching"],
    Business: ["Enterprise Solutions", "Staff Training", "Analytics", "Request Demo"],
    Company: ["About Us", "Careers", "Blog", "Contact"],
    Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
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
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="font-body text-sm text-accent-foreground/60 hover:text-primary transition-colors sora-regular"
                    >
                      {item}
                    </a>
                  </li>
                ))}
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
