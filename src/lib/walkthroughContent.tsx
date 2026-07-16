/**
 * Purpose: Role-based getting-started walkthroughs shown in the first-run tour
 * dialog and in the Help Center "Getting started" tab.
 */
import {
  Compass,
  UserCircle,
  Users,
  Calendar,
  MessageSquare,
  Target,
  GraduationCap,
  BookOpen,
  BarChart3,
  Building2,
  Store,
  ClipboardList,
  CreditCard,
  Sparkles,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

export type WalkthroughRole = "mentee" | "mentor" | "employer";

export type WalkthroughStep = {
  title: string;
  body: string;
  icon: LucideIcon;
  href?: string;
  cta?: string;
};

export type WalkthroughGuide = {
  role: WalkthroughRole;
  label: string;
  intro: string;
  steps: WalkthroughStep[];
};

export const WALKTHROUGHS: Record<WalkthroughRole, WalkthroughGuide> = {
  mentee: {
    role: "mentee",
    label: "Mentee",
    intro:
      "Ascendency helps you grow with expert mentors, courses, and a community. Here's how to get the most out of your account.",
    steps: [
      {
        title: "Complete your profile",
        body:
          "Head to Profile Settings and add your bio, country, skills and goals. A complete profile helps our matching engine pair you with the right mentors.",
        icon: UserCircle,
        href: "/dashboard/settings",
        cta: "Open Profile Settings",
      },
      {
        title: "Pick a subscription",
        body:
          "Subscriptions unlock messaging, pairings and bookings. Choose the tier that matches how much support you want each month.",
        icon: CreditCard,
        href: "/dashboard/subscribe",
        cta: "View plans",
      },
      {
        title: "Explore mentors",
        body:
          "Browse approved mentors in the Explore directory. Filter by expertise and country to find someone who fits your goals.",
        icon: Compass,
        href: "/dashboard/explore",
        cta: "Explore mentors",
      },
      {
        title: "Request a pairing",
        body:
          "When you find a mentor you like, request a pairing. An admin reviews and approves matches so both sides are set up for success.",
        icon: Users,
        href: "/dashboard/pairings",
        cta: "See My Pairings",
      },
      {
        title: "Book a session",
        body:
          "Once paired (or if you've bought a single session), book time using your mentor's calendar. You'll get email reminders automatically.",
        icon: Calendar,
        href: "/dashboard/sessions",
        cta: "Go to Sessions",
      },
      {
        title: "Take courses",
        body:
          "Work through internal courses at your own pace. Progress is saved for you and shows on your dashboard.",
        icon: GraduationCap,
        href: "/dashboard/courses",
        cta: "Browse courses",
      },
      {
        title: "Message your mentor",
        body:
          "Use Messages to keep in touch between sessions. You can also reach the BSC Coordinator anytime for help.",
        icon: MessageSquare,
        href: "/dashboard/messages",
        cta: "Open Messages",
      },
      {
        title: "Share feedback",
        body:
          "Your monthly feedback keeps the programme strong and helps us match you better over time.",
        icon: ClipboardList,
        href: "/dashboard/feedback",
        cta: "Give feedback",
      },
      {
      title: "Add Ascendency to your home screen",
      body:
        "Ascendency is a Progressive Web App. Add it to your home screen for one tap access, no app store needed. Use the Share icon in Safari or the three dot menu in Chrome, then tap Add to Home Screen.",
      icon: Smartphone,
      href: "",
      cta: "",
    },
    ],
  },
  mentor: {
    role: "mentor",
    label: "Mentor",
    intro:
      "Thanks for mentoring on Ascendency. Here's how to set up your profile, availability and get the most out of your pairings.",
    steps: [
      {
        title: "Finish your mentor profile",
        body:
          "Add your bio, expertise, country and profile photo in Profile Settings. This is what mentees see when they choose you.",
        icon: UserCircle,
        href: "/dashboard/settings",
        cta: "Open Profile Settings",
      },
      {
        title: "Set your availability",
        body:
          "Configure recurring weekly slots, blocked dates, session duration and notice period so bookings only land at good times.",
        icon: Calendar,
        href: "/dashboard/settings",
        cta: "Update availability",
      },
      {
        title: "List yourself on the marketplace",
        body:
          "Create a marketplace listing so employers can discover and reach out to you directly.",
        icon: Store,
        href: "/dashboard/marketplace/listing",
        cta: "Edit my listing",
      },
      {
        title: "Review your pairings",
        body:
          "See mentees you've been paired with, agree the mentorship agreement, and track shared goals from the Pairings tab.",
        icon: Users,
        href: "/dashboard/pairings",
        cta: "Open My Pairings",
      },
      {
        title: "Log every session",
        body:
          "After each session, log it so mentees can see progress and payouts are calculated correctly.",
        icon: ClipboardList,
        href: "/dashboard/sessions",
        cta: "Go to Sessions",
      },
      {
        title: "Stay in touch",
        body:
          "Use Messages to check in between sessions. Read receipts and the BSC Coordinator thread live here too.",
        icon: MessageSquare,
        href: "/dashboard/messages",
        cta: "Open Messages",
      },
      {
        title: "Join the community",
        body:
          "Drop into the Forum to swap advice with other mentors and share what's working with your mentees.",
        icon: Sparkles,
        href: "/dashboard/forum",
        cta: "Open Forum",
      },
      {
      title: "Add Ascendency to your home screen",
      body:
        "Ascendency is a Progressive Web App. Add it to your home screen for one tap access, no app store needed. Use the Share icon in Safari or the three dot menu in Chrome, then tap Add to Home Screen.",
      icon: Smartphone,
      href: "",
      cta: "",
    },
    ],
  },
  employer: {
    role: "employer",
    label: "Employer",
    intro:
      "Your employer workspace hosts your team, courses, marketplace access and analytics — all in one place.",
    steps: [
      {
        title: "Set up your company profile",
        body:
          "Add your company name, logo and description so mentors and learners recognise you across the platform.",
        icon: Building2,
        href: "/employer/profile",
        cta: "Edit company profile",
      },
      {
        title: "Invite your team",
        body:
          "Send email invites to teammates so they can access courses and analytics under your employer account.",
        icon: Users,
        href: "/employer/team",
        cta: "Manage team",
      },
      {
        title: "Upload a course",
        body:
          "Create courses for your team or the wider Ascendency community. You choose the reach for each course when you publish.",
        icon: BookOpen,
        href: "/employer/courses",
        cta: "Add a course",
      },
      {
        title: "Browse the marketplace",
        body:
          "See approved profile listings, view ratings, and message anyone directly to build your company or team talent.",
        icon: Store,
        href: "/employer/marketplace",
        cta: "Open marketplace",
      },
      {
        title: "Track analytics",
        body:
          "Monitor course enrolments, completions and team engagement in one dashboard so you can prove impact.",
        icon: BarChart3,
        href: "/employer/analytics",
        cta: "See analytics",
      },
      {
        title: "Return to your dashboard",
        body:
          "The employer dashboard summarises everything above. Come back here anytime for a quick overview.",
        icon: Target,
        href: "/employer",
        cta: "Open dashboard",
      },
      {
      title: "Add Ascendency to your home screen",
      body:
        "Ascendency is a Progressive Web App. Add it to your home screen for one tap access, no app store needed. Use the Share icon in Safari or the three dot menu in Chrome, then tap Add to Home Screen.",
      icon: Smartphone,
      href: " ",
      cta: " ",
    },
    ],
  },
};

export const getRoleForUser = (roles: string[]): WalkthroughRole => {
  if (roles.includes("employer") && !roles.includes("mentor") && !roles.includes("mentee")) return "employer";
  if (roles.includes("mentor")) return "mentor";
  return "mentee";
};

export const WALKTHROUGH_STORAGE_PREFIX = "ascendency_walkthrough_seen_v1_";
