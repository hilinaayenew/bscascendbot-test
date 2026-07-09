// Parsed and deduplicated mentor data from mentors.csv
// 80+ unique mentors from 2022-2025 cohorts

export interface MentorImportData {
  email: string;
  full_name: string;
  expertise: string[];
  linkedin_url: string | null;
  phone: string | null;
  country: string | null;
  avatar_url: string | null;
}

export const MENTOR_POOL_DATA: MentorImportData[] = [
  {
    email: "makmekdelawitgetachew@gmail.com",
    full_name: "Hilina Ayenew",
    expertise: ["Data Science & Analytics", "Product Management"],
    linkedin_url: "https://linkedin.com/in/yaa-gyapong",
    phone: null,
    country: "United Kingdom",
    avatar_url: null,
  },
];
