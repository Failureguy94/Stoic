/**
 * Results of our Google Form survey of 17 first-year students (IIIT Nagpur).
 * Raw counts only. Percentages are computed from TOTAL_RESPONDENTS.
 */

export const TOTAL_RESPONDENTS = 17;

export interface SurveyQuestion {
  id: string;
  question: string;
  /** Extra context, e.g. "pick 2" questions where counts add up to more than 17. */
  note?: string;
  answers: { label: string; count: number }[];
}

export const SURVEY: SurveyQuestion[] = [
  {
    id: "device",
    question: "Main study device",
    answers: [
      { label: "Windows laptop", count: 11 },
      { label: "Android phone/tablet", count: 3 },
      { label: "Mac", count: 2 },
      { label: "iPad", count: 1 },
    ],
  },
  {
    id: "phone-time",
    question: "Daily phone time",
    answers: [
      { label: "Under 2 hours", count: 1 },
      { label: "2 to 4 hours", count: 3 },
      { label: "4 to 6 hours", count: 10 },
      { label: "More than 6 hours", count: 3 },
    ],
  },
  {
    id: "distractions",
    question: "Biggest distractions",
    note: "Each person picked up to 2, so counts add up to more than 17.",
    answers: [
      { label: "YouTube / reels", count: 10 },
      { label: "Social media", count: 8 },
      { label: "Notifications", count: 4 },
      { label: "Games", count: 4 },
      { label: "Late-night use", count: 2 },
    ],
  },
  {
    id: "checks",
    question: "Phone checks per hour while studying",
    answers: [
      { label: "Rarely", count: 2 },
      { label: "A few times", count: 10 },
      { label: "Many times", count: 4 },
      { label: "Lose track", count: 1 },
    ],
  },
  {
    id: "tools-used",
    question: "Tools already used",
    note: "Multiple answers allowed.",
    answers: [
      { label: "Android Digital Wellbeing", count: 9 },
      { label: "None", count: 4 },
      { label: "Focus mode / Do Not Disturb", count: 4 },
      { label: "App blockers", count: 2 },
      { label: "Browser extensions", count: 2 },
      { label: "iPhone Screen Time", count: 1 },
    ],
  },
  {
    id: "wanted",
    question: "What would help most",
    note: "Multiple answers allowed.",
    answers: [
      { label: "Short trusted list", count: 12 },
      { label: "Step-by-step guides", count: 11 },
      { label: "Free tools only", count: 5 },
      { label: "Privacy advice", count: 2 },
      { label: "Sleep tips", count: 2 },
    ],
  },
  {
    id: "why-failed",
    question: "Why tools failed",
    note: "Multiple answers allowed.",
    answers: [
      { label: "Too many permissions", count: 6 },
      { label: "Cost", count: 6 },
      { label: "Forgot to use it", count: 6 },
      { label: "Too complicated", count: 3 },
    ],
  },
];

/** 14 of 17 had already tried to cut down. */
export const TRIED_TO_CUT_DOWN = 14;

export function getQuestion(id: string): SurveyQuestion {
  const q = SURVEY.find((s) => s.id === id);
  if (!q) throw new Error(`Unknown survey question: ${id}`);
  return q;
}
