import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const { user, loading } = useAuth();

  const navLinks = [
    { label: "Pathways", href: "#pathways" },
    { label: "For Business", href: "#business" },
    { label: "Free Cohort", href: "#cohort" },
    { label: "Marketplace", href: "#marketplace" },
  ];

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-accent text-accent-foreground py-2 text-center">
        <p className="font-body text-xs sora-medium tracking-wide">
          BSC Mentorship 2026 Applications Now Open · <a href="#cohort" className="underline">Apply Now</a>
        </p>
      </div>

      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-body text-2xl sora-bold text-accent tracking-tight">
                Ascendency
              </span>
              <span className="font-body text-[10px] sora-light text-muted-foreground hidden sm:block">
                by Because She Can
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="font-body text-sm sora-medium text-foreground/70 hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-3">
              {!loading && user ? (
                <Link to="/dashboard">
                  <Button variant="default" size="sm" className="font-body sora-semibold">Dashboard</Button>
                </Link>
              ) : (
                <div
                  className="relative pb-2"
                  onMouseEnter={() => setHoverOpen(true)}
                  onMouseLeave={() => setHoverOpen(false)}
                >
                  <Button variant="default" size="sm" className="font-body sora-semibold">
                    Sign In
                  </Button>

                  {hoverOpen && (
                    <div className="absolute right-0 top-full w-48 z-50">
                      <div className="bg-card rounded-lg border border-border shadow-elevated overflow-hidden">
                        <Link
                          to="/auth?role=mentee"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                          onClick={() => setHoverOpen(false)}
                        >
                          <Users className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-body text-sm sora-semibold text-foreground">Mentee</p>
                            <p className="font-body text-[11px] text-muted-foreground">Find a mentor</p>
                          </div>
                        </Link>
                        <div className="border-t border-border" />
                        <Link
                          to="/auth?role=mentor"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                          onClick={() => setHoverOpen(false)}
                        >
                          <Sparkles className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-body text-sm sora-semibold text-foreground">Mentor</p>
                            <p className="font-body text-[11px] text-muted-foreground">Guide others</p>
                          </div>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="font-body text-base sora-medium text-foreground py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-3 border-t border-border">
                {!loading && user ? (
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="default" className="w-full">Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth?role=mentee" onClick={() => setMobileOpen(false)}>
                      <Button variant="default" className="w-full">Sign In as Mentee</Button>
                    </Link>
                    <Link to="/auth?role=mentor" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full">Sign In as Mentor</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
