export interface CourseModule {
  id: string;
  title: string;
}

export interface Course {
  id: string;
  title: string;
  moduleCount: number;
  estimatedHours: number;
  modules: CourseModule[];
  accent: string; // tailwind color class prefix
  mentorOnly?: boolean;
}

export const COURSES: Course[] = [
  {
    id: "professional-networking",
    title: "Professional Networking Fundamentals",
    moduleCount: 6,
    estimatedHours: 3,
    accent: "purple",
    modules: [
      { id: "pn-1", title: "Introduction to professional networking" },
      { id: "pn-2", title: "Building your personal brand online" },
      { id: "pn-3", title: "LinkedIn and digital presence" },
      { id: "pn-4", title: "Reaching out to mentors and professionals" },
      { id: "pn-5", title: "Navigating industry events and conferences" },
      { id: "pn-6", title: "Sustaining long-term professional relationships" },
    ],
  },
  {
    id: "career-clarity",
    title: "Career Clarity & Goal Setting for Africans",
    moduleCount: 5,
    estimatedHours: 2.5,
    accent: "teal",
    modules: [
      { id: "cc-1", title: "Understanding your values and strengths" },
      { id: "cc-2", title: "Mapping career paths in the African context" },
      { id: "cc-3", title: "Setting SMART goals with cultural awareness" },
      { id: "cc-4", title: "Dealing with family expectations and pressure" },
      { id: "cc-5", title: "Building your 12-month career roadmap" },
    ],
  },
  {
    id: "effective-mentorship",
    title: "Effective Mentorship Techniques",
    moduleCount: 5,
    estimatedHours: 2,
    accent: "coral",
    mentorOnly: true,
    modules: [
      { id: "em-1", title: "What makes a great mentor" },
      { id: "em-2", title: "Active listening and asking better questions" },
      { id: "em-3", title: "Giving feedback that lands" },
      { id: "em-4", title: "Navigating difficult mentoring moments" },
      { id: "em-5", title: "Measuring impact and mentee growth" },
    ],
  },
];

export const getCourseById = (id: string) => COURSES.find((c) => c.id === id);

export const ACCENT_COLORS: Record<string, { bg: string; fill: string; bar: string; badge: string; border: string }> = {
  purple: {
    bg: "bg-purple-50",
    fill: "bg-purple-600",
    bar: "bg-purple-600",
    badge: "bg-purple-100 text-purple-800",
    border: "border-purple-200",
  },
  teal: {
    bg: "bg-teal-50",
    fill: "bg-teal-600",
    bar: "bg-teal-600",
    badge: "bg-teal-100 text-teal-800",
    border: "border-teal-200",
  },
  coral: {
    bg: "bg-orange-50",
    fill: "bg-orange-500",
    bar: "bg-orange-500",
    badge: "bg-orange-100 text-orange-800",
    border: "border-orange-200",
  },
};
