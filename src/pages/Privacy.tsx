import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MapPin, Calendar, Scale, Globe } from "lucide-react";
import { useEffect } from "react";

const sections = [
  { id: "who-we-are", title: "Who We Are" },
  { id: "information-we-collect", title: "Information We Collect" },
  { id: "how-we-use", title: "How We Use Your Information" },
  { id: "legal-basis", title: "Legal Basis for Processing" },
  { id: "who-we-share", title: "Who We Share Data With" },
  { id: "data-retention", title: "Data Retention" },
  { id: "your-rights", title: "Your Rights" },
  { id: "data-security", title: "Data Security" },
  { id: "third-party", title: "Third-Party Links" },
  { id: "childrens-privacy", title: "Children's Privacy" },
  { id: "changes", title: "Changes to This Policy" },
  { id: "contact", title: "Contact Us" },
];

const Privacy = () => {
  useEffect(() => {
    document.title = "Privacy Policy — Ascendency by Because She Can";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-body group">
            <div className="text-lg sora-bold text-foreground tracking-tight leading-tight">
              Ascendency
            </div>
            <div className="text-[0.65rem] sora-regular text-muted-foreground uppercase tracking-[0.12em] mt-0.5">
              by Because She Can
            </div>
          </Link>
          <Link
            to="/auth"
            className="font-body text-sm sora-medium text-primary hover:text-primary/70 transition-opacity flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign Up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-16 md:py-20">
          <p className="font-body text-xs sora-medium uppercase tracking-[0.12em] text-primary mb-5">
            Legal & Privacy
          </p>
          <h1 className="font-body text-4xl md:text-5xl sora-bold text-foreground tracking-tight leading-[1.15] mb-6">
            Privacy Policy
          </h1>
          <div className="flex flex-wrap gap-x-8 gap-y-2 font-body text-sm text-muted-foreground sora-regular">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Because She Can · Accra, Ghana
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Effective: June 2025
            </span>
            <span className="flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5" />
              Ghana Data Protection Act, 2012 (Act 843)
            </span>
          </div>
        </div>
      </section>

      {/* Layout */}
      <div className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-12 lg:gap-16 items-start">
        {/* TOC */}
        <aside className="hidden md:block sticky top-24 pt-14">
          <p className="font-body text-[0.68rem] sora-medium uppercase tracking-[0.12em] text-muted-foreground mb-4">
            Contents
          </p>
          <ol className="space-y-1">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="group flex gap-2.5 pl-3 py-1 border-l-2 border-transparent hover:border-primary text-sm font-body sora-regular text-muted-foreground hover:text-primary transition-colors"
                >
                  <span className="text-[0.68rem] text-border group-hover:text-primary/40 mt-0.5 sora-regular">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="leading-tight">{s.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </aside>

        {/* Content */}
        <main className="pt-14 font-body sora-regular">
          {/* Intro */}
          <div className="bg-crimson-light border-l-[3px] border-primary rounded-r-lg px-6 py-5 mb-12 text-sm leading-relaxed text-foreground">
            This Privacy Policy explains how Because She Can ("we", "our", or "us") collects, uses,
            and protects your personal information when you use Ascendency — our mentorship platform
            at bscascend.lovable.app. By creating an account or using the platform, you agree to the
            practices described in this policy.
          </div>

          {/* Section 01 */}
          <Section number="01" id="who-we-are" title="Who We Are">
            <p>
              Ascendency is a mentorship platform operated by Because She Can, an organisation based
              in Ghana dedicated to connecting Africa's most talented professionals with the next
              generation of tech leaders.
            </p>
            <p>
              Because She Can is the data controller responsible for your personal information
              collected through the Ascendency platform. We operate in accordance with the Ghana
              Data Protection Act, 2012 (Act 843) and are committed to handling your data with
              integrity, transparency, and care.
            </p>
            <div className="bg-card border border-border rounded-lg px-6 py-5 mt-4 text-sm text-muted-foreground space-y-1.5">
              <p><span className="text-foreground sora-medium">Data Controller:</span> Because She Can</p>
              <p><span className="text-foreground sora-medium">Platform:</span> Ascendency (bscascend.lovable.app)</p>
              <p><span className="text-foreground sora-medium">Country of Operation:</span> Ghana</p>
              <p>
                <span className="text-foreground sora-medium">Contact:</span>{" "}
                <a href="mailto:hello@becauseshecan.tech" className="text-primary hover:underline">
                  hello@becauseshecan.tech
                </a>
              </p>
            </div>
          </Section>

          {/* Section 02 */}
          <Section number="02" id="information-we-collect" title="Information We Collect">
            <p>
              When you sign up and use Ascendency as a mentee, we collect the following categories
              of information:
            </p>
            <p className="sora-medium text-foreground">Information you provide directly:</p>
            <BulletList
              items={[
                "Full name and email address",
                "Professional background, career goals, and areas of interest",
                "Your responses to the BSC Mentorship Programme application",
                "Coupon or discount codes used during sign-up",
                "Any messages or communications submitted through the platform",
              ]}
            />
            <p className="sora-medium text-foreground">Information collected automatically:</p>
            <BulletList
              items={[
                "Login activity and session information",
                "Device type, browser, and operating system",
                "IP address and approximate location",
                "Pages visited and features used within the platform",
              ]}
            />
            <p>
              We do not collect payment or financial information. Participation in the BSC
              Mentorship Programme as a mentee is provided at no cost.
            </p>
          </Section>

          {/* Section 03 */}
          <Section number="03" id="how-we-use" title="How We Use Your Information">
            <p>We use the information we collect to:</p>
            <BulletList
              items={[
                "Create and manage your Ascendency account",
                "Match you with a suitable mentor based on your profile and goals",
                "Facilitate communication between you and your mentor on the platform",
                "Send you programme-related communications, updates, and announcements",
                "Improve and personalise your experience on the platform",
                "Monitor platform usage to ensure security and resolve technical issues",
                "Comply with our legal obligations under Ghanaian law",
                "Evaluate and improve the BSC Mentorship Programme over time",
              ]}
            />
            <p>
              We will never use your personal information for purposes that are incompatible with
              those listed above without first notifying you and, where required, obtaining your
              consent.
            </p>
          </Section>

          {/* Section 04 */}
          <Section number="04" id="legal-basis" title="Legal Basis for Processing">
            <p>
              Under the Ghana Data Protection Act, 2012 (Act 843), we process your personal data on
              the following grounds:
            </p>
            <BulletList
              items={[
                "Consent — you have provided your information voluntarily by signing up to the Ascendency platform and joining the BSC Mentorship Programme.",
                "Contractual necessity — processing is required to fulfil our obligations to you as a participant in the programme, including facilitating your mentor pairing.",
                "Legitimate interests — we process certain data to operate, improve, and secure the platform in ways that do not override your rights or interests.",
                "Legal compliance — we may process data where required to do so by applicable Ghanaian law.",
              ]}
            />
          </Section>

          {/* Section 05 */}
          <Section number="05" id="who-we-share" title="Who We Share Your Data With">
            <p>
              Your privacy matters to us. We do not sell your personal information to third parties.
              We may share your data only in the following limited circumstances:
            </p>
            <BulletList
              items={[
                "Your mentor — your profile information is visible to your assigned mentor on the Ascendency platform so they can support your growth effectively.",
                "Platform infrastructure providers — Ascendency is built using Lovable and Supabase, which provide hosting and authentication services. These providers process data on our behalf and are bound by appropriate data processing agreements.",
                "BSC programme administrators — internal team members who manage cohort operations may access your information to administer the programme.",
                "Legal authorities — where we are required to disclose information by law, regulation, or court order in Ghana.",
              ]}
            />
            <p>
              All third parties with whom we share data are required to handle it in accordance with
              applicable data protection standards.
            </p>
          </Section>

          {/* Section 06 */}
          <Section number="06" id="data-retention" title="Data Retention">
            <p>
              We retain your personal information for as long as your account is active or as needed
              to provide you with programme services. Specifically:
            </p>
            <BulletList
              items={[
                "Your account data is retained for the duration of your participation in the BSC Mentorship Programme and for a reasonable period thereafter for programme evaluation purposes.",
                "If you request deletion of your account, we will remove your personal data within 30 days, except where retention is required by law or for legitimate business purposes (such as maintaining programme records).",
                "Anonymised or aggregated data that cannot identify you may be retained indefinitely for research and programme improvement purposes.",
              ]}
            />
          </Section>

          {/* Section 07 */}
          <Section number="07" id="your-rights" title="Your Rights">
            <p>
              Under the Ghana Data Protection Act, 2012 (Act 843), you have the following rights
              regarding your personal data:
            </p>
            <BulletList
              items={[
                "Right of access — you may request a copy of the personal information we hold about you.",
                "Right to correction — you may ask us to correct any inaccurate or incomplete information.",
                "Right to deletion — you may request that we delete your personal data, subject to any legal obligations we may have to retain it.",
                "Right to withdraw consent — where processing is based on your consent, you may withdraw it at any time. This will not affect the lawfulness of any processing carried out prior to withdrawal.",
                "Right to opt out — you may opt out of the Ascendency platform at any time by replying to any email from us or contacting us directly. We will remove your profile promptly, no questions asked.",
                "Right to lodge a complaint — you have the right to lodge a complaint with the Data Protection Commission of Ghana if you believe your data has been handled unlawfully.",
              ]}
            />
            <p>
              To exercise any of these rights, please contact us at{" "}
              <a
                href="mailto:hello@becauseshecan.tech"
                className="text-primary sora-medium hover:underline"
              >
                hello@becauseshecan.tech
              </a>
              .
            </p>
          </Section>

          {/* Section 08 */}
          <Section number="08" id="data-security" title="Data Security">
            <p>
              We take the security of your personal information seriously. Ascendency is built on
              Supabase, which provides industry-standard security measures including encrypted data
              storage, secure authentication, and access controls.
            </p>
            <p>
              We implement appropriate technical and organisational measures to protect your data
              against unauthorised access, disclosure, alteration, or destruction. However, no
              online platform can guarantee absolute security. We encourage you to use a strong,
              unique password and to contact us immediately if you suspect any unauthorised access
              to your account.
            </p>
            <p>
              Your Ascendency profile is not publicly visible. It is only accessible to signed-up
              members of the platform — mentors and programme administrators — within a trusted,
              curated environment.
            </p>
          </Section>

          {/* Section 09 */}
          <Section number="09" id="third-party" title="Third-Party Links">
            <p>
              The Ascendency platform and our programme communications may contain links to external
              websites or resources, including the Because She Can website. We are not responsible
              for the privacy practices or content of those third-party sites. We encourage you to
              review the privacy policies of any external sites you visit.
            </p>
          </Section>

          {/* Section 10 */}
          <Section number="10" id="childrens-privacy" title="Children's Privacy">
            <p>
              Ascendency is designed for professional adults and is not intended for use by
              individuals under the age of 18. We do not knowingly collect personal information from
              minors. If you believe a minor has submitted their information through our platform,
              please contact us immediately and we will take steps to remove that information.
            </p>
          </Section>

          {/* Section 11 */}
          <Section number="11" id="changes" title="Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our
              practices, the platform, or applicable law. When we make material changes, we will
              notify you by email and update the effective date at the top of this page.
            </p>
            <p>
              Your continued use of the Ascendency platform after any changes constitutes your
              acceptance of the updated policy. We encourage you to review this page periodically.
            </p>
          </Section>

          {/* Section 12 */}
          <Section number="12" id="contact" title="Contact Us" last>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or the
              way we handle your personal data, please do not hesitate to reach out.
            </p>
            <div className="bg-secondary text-secondary-foreground rounded-xl p-8 mt-6">
              <p className="font-body text-lg sora-bold mb-2">Because She Can — Data Privacy</p>
              <p className="text-sm text-secondary-foreground/70 mb-5">
                We aim to respond to all privacy-related enquiries within 5 business days.
              </p>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 opacity-70" />
                  <a
                    href="mailto:hello@becauseshecan.tech"
                    className="text-primary-foreground sora-medium hover:underline"
                    style={{ color: "hsl(var(--crimson-light))" }}
                  >
                    hello@becauseshecan.tech
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Globe className="h-4 w-4 opacity-70" />
                  <a
                    href="https://becauseshecan.tech"
                    target="_blank"
                    rel="noreferrer"
                    className="sora-medium hover:underline"
                    style={{ color: "hsl(var(--crimson-light))" }}
                  >
                    becauseshecan.tech
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 opacity-70" />
                  Accra, Ghana
                </p>
              </div>
              <p className="text-xs text-secondary-foreground/60 mt-6 leading-relaxed border-t border-secondary-foreground/10 pt-4">
                You also have the right to contact the Data Protection Commission of Ghana if you
                have concerns about how your data is being handled.
              </p>
            </div>
          </Section>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 px-6 text-center font-body text-xs sora-regular text-muted-foreground space-y-1">
        <p>
          © {new Date().getFullYear()} Because She Can · Ascendency Platform ·{" "}
          <a
            href="https://becauseshecan.tech"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            becauseshecan.tech
          </a>
        </p>
        <p>Governed by the Ghana Data Protection Act, 2012 (Act 843)</p>
      </footer>
    </div>
  );
};

const Section = ({
  number,
  id,
  title,
  children,
  last,
}: {
  number: string;
  id: string;
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) => (
  <section
    id={id}
    className={`scroll-mt-24 mb-13 pb-13 ${
      last ? "" : "border-b border-border"
    }`}
    style={{ marginBottom: last ? 0 : "3.25rem", paddingBottom: last ? 0 : "3.25rem" }}
  >
    <p className="font-body text-[0.68rem] sora-medium uppercase tracking-[0.12em] text-primary mb-2.5">
      {number}
    </p>
    <h2 className="font-body text-2xl sora-bold text-foreground tracking-tight leading-tight mb-5">
      {title}
    </h2>
    <div className="space-y-4 text-[0.93rem] leading-[1.8] text-foreground/85">{children}</div>
  </section>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-1.5">
    {items.map((item, i) => (
      <li key={i} className="relative pl-6 leading-[1.8]">
        <span className="absolute left-0 top-0 text-primary sora-medium">–</span>
        {item}
      </li>
    ))}
  </ul>
);

export default Privacy;