/// <reference types="npm:@types/react@18.3.1" />
import * as React from "npm:react@18.3.1";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
  Button,
  Section,
  Row,
  Column,
} from "npm:@react-email/components@0.0.22";
import type { TemplateEntry } from "./registry.ts";

interface MentorPoolInviteProps {
  name?: string;
  inviteUrl?: string;
}

const MentorPoolInviteEmail = ({ name, inviteUrl }: MentorPoolInviteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're already on Ascendency — come claim your space 🚀</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Logo / Brand bar */}
        <Section style={brandBar}>
          <Text style={brandName}>Ascendency</Text>
          <Text style={brandTagline}>by Because She Can</Text>
        </Section>

        {/* Hero heading */}
        <Heading style={h1}>You're already on Ascendency&nbsp;— come claim your space&nbsp;🚀</Heading>

        <Text style={text}>Hi {name || "there"},</Text>

        <Text style={text}>
          Big news — <strong>Ascendency is here</strong>, and you're already part of it.
        </Text>

        <Text style={text}>
          Ascendency is Because She Can's brand-new mentorship platform, built to connect Africa's most talented
          professionals with the next generation of tech leaders. We've been building something special, and as one of
          our trusted mentors, we've gone ahead and created your profile using the information you shared with us when
          you joined the BSC mentor community.
        </Text>

        <Text style={text}>
          <strong>All that's left? You.</strong>
        </Text>

        {/* Primary CTA */}
        <Section style={ctaSection}>
          <Button style={button} href={inviteUrl || "#"}>
            Accept your invitation and set up your account today →
          </Button>
        </Section>

        <Hr style={hr} />

        {/* Profile note */}
        <Section style={noteBox}>
          <Text style={noteTitle}>A QUICK NOTE ON YOUR PROFILE</Text>
          <Text style={noteText}>
            Your profile is <strong>not publicly visible</strong>. It is only accessible to people who have signed up on
            the Ascendency platform — so you're in a trusted, curated space from day one. If at any point you'd prefer
            not to be on the platform, simply reply to this email and we'll take care of it, no questions asked.
          </Text>
        </Section>

        <Hr style={hr} />

        {/* Features */}
        <Section style={noteBox}>
          <Text style={noteTitle}>WHAT ASCENDENCY MEANS FOR YOU</Text>
          <Text style={text}>
            This isn't just a mentorship directory. Ascendency is a full ecosystem designed to help you grow, earn, and
            lead:
          </Text>
        </Section>

        <FeatureItem
          icon="✦"
          title="A Vetted Mentee Pool"
          body="No cold outreach, no guesswork. Connect with mentees who have been carefully screened and are genuinely ready to learn from someone like you."
        />
        <FeatureItem
          icon="✦"
          title="A Marketplace to Monetise Your Expertise — coming soon"
          body="List your freelance services, offer coaching packages, and get paid for the value you bring. Ascendency gives you a platform to turn your skills into income."
        />
        <FeatureItem
          icon="✦"
          title="Professional Growth Resources"
          body="Access educational courses and learning materials curated for your career stage — because the best mentors never stop growing."
        />
        <FeatureItem
          icon="✦"
          title="Industry Experts & Career Insights"
          body="Learn from leaders across the continent who are sharing their real career journeys, lessons, and breakthroughs — exclusively on the platform."
        />
        <FeatureItem
          icon="✦"
          title="A Community of Peers"
          body="Network with a cohort of ambitious, like-minded mentors. Collaborate, refer, and grow together as part of a recognised community of excellence."
        />

        <Hr style={hr} />

        <Text style={text}>
          You've already done the work to get here. Ascendency is the platform that finally matches your level.
        </Text>
        <Text style={text}>
          Claim your profile, complete your account, and let's build something extraordinary together.
        </Text>

        {/* Secondary CTA */}
        <Section style={ctaSection}>
          <Button style={button} href={inviteUrl || "#"}>
            Accept your invitation and set up your account today →
          </Button>
        </Section>

        <Hr style={hr} />

        {/* Footer */}
        <Text style={footer}>
          With excitement,
          <br />
          The Because She Can Team
          <br />
          <a href="https://becauseshecan.tech" style={footerLink}>
            becauseshecan.tech
          </a>
        </Text>
        <Text style={footer}>
          Your profile is only visible to signed-up Ascendency members. To opt out at any time, simply reply to this
          email.
        </Text>
      </Container>
    </Body>
  </Html>
);

/* ── Small helper component for feature bullets ── */
const FeatureItem = ({ icon, title, body }: { icon: string; title: string; body: string }) => (
  <Section style={featureSection}>
    <Row>
      <Column style={featureIcon}>{icon}</Column>
      <Column>
        <Text style={featureTitle}>{title}</Text>
        <Text style={featureBody}>{body}</Text>
      </Column>
    </Row>
  </Section>
);

export const template = {
  component: MentorPoolInviteEmail,
  subject: `You're already on Ascendency — come claim your space 🚀`,
  displayName: "Mentor pool invitation",
  previewData: { name: "Sarah", inviteUrl: "https://example.com/magic-link" },
} satisfies TemplateEntry;

/* ── Styles ── */
const main = { backgroundColor: "#faf8f9", fontFamily: "'Sora', Arial, sans-serif" };

const container = {
  backgroundColor: "#ffffff",
  padding: "0 0 40px",
  maxWidth: "600px",
  margin: "32px auto",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
};

const brandBar = {
  backgroundColor: "#4B0A2D",
  padding: "20px 32px 14px",
  textAlign: "left" as const,
};
const brandName = {
  fontSize: "22px",
  fontWeight: "700" as const,
  color: "#ffffff",
  margin: "0",
  lineHeight: "1.2",
};
const brandTagline = {
  fontSize: "12px",
  color: "#e8c4d4",
  margin: "2px 0 0",
  letterSpacing: "0.04em",
};

const h1 = {
  fontSize: "22px",
  fontWeight: "700" as const,
  color: "#4B0A2D",
  margin: "32px 32px 16px",
  lineHeight: "1.4",
};

const text = {
  fontSize: "15px",
  color: "#333333",
  lineHeight: "1.7",
  margin: "0 32px 16px",
};

const ctaSection = { textAlign: "center" as const, margin: "24px 32px" };

const button = {
  display: "inline-block",
  padding: "14px 28px",
  backgroundColor: "#4B0A2D",
  color: "#ffffff",
  borderRadius: "6px",
  fontWeight: "600" as const,
  fontSize: "15px",
  textDecoration: "none",
};

const hr = { borderColor: "#e8e0e4", margin: "24px 32px" };

const noteBox = { margin: "0 32px" };
const noteTitle = {
  fontSize: "11px",
  fontWeight: "700" as const,
  color: "#4B0A2D",
  letterSpacing: "0.1em",
  margin: "0 0 10px",
  textTransform: "uppercase" as const,
};
const noteText = {
  fontSize: "14px",
  color: "#555555",
  lineHeight: "1.7",
  margin: "0",
};

const featureSection = { margin: "0 32px 16px" };
const featureIcon = {
  width: "24px",
  color: "#4B0A2D",
  fontWeight: "700" as const,
  fontSize: "16px",
  verticalAlign: "top",
  paddingTop: "2px",
};
const featureTitle = {
  fontSize: "14px",
  fontWeight: "700" as const,
  color: "#222222",
  margin: "0 0 4px",
};
const featureBody = {
  fontSize: "14px",
  color: "#555555",
  lineHeight: "1.6",
  margin: "0",
};

const footer = {
  fontSize: "13px",
  color: "#999999",
  lineHeight: "1.6",
  margin: "0 32px 10px",
};
const footerLink = { color: "#4B0A2D", textDecoration: "none" };
