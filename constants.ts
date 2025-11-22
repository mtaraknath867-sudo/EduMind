
import { Subject, ThemeColor } from './types';

export const SUBJECTS: Subject[] = [
  'General',
  'Madhyamik (WBBSE)',
  'HS (WBCHSE)',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'History',
  'Literature',
  'Economics'
];

export const LANGUAGES = [
  'English',
  'Hindi',
  'Bangla'
];

// Define RGB values for Tailwind CSS variables (R G B)
export const THEME_COLORS: Record<ThemeColor, { label: string, colors: Record<number, string> }> = {
  red: {
    label: 'Exam Red',
    colors: {
      50: '254 242 242',
      100: '254 226 226',
      500: '239 68 68',
      600: '220 38 38',
      700: '185 28 28',
    }
  },
  blue: {
    label: 'Focus Blue',
    colors: {
      50: '239 246 255',
      100: '219 234 254',
      500: '59 130 246',
      600: '37 99 235',
      700: '29 78 216',
    }
  },
  green: {
    label: 'Growth Green',
    colors: {
      50: '240 253 244',
      100: '220 252 231',
      500: '34 197 94',
      600: '22 163 74',
      700: '21 128 61',
    }
  },
  purple: {
    label: 'Creative Purple',
    colors: {
      50: '250 245 255',
      100: '243 232 255',
      500: '168 85 247',
      600: '147 51 234',
      700: '126 34 206',
    }
  },
  orange: {
    label: 'Energy Orange',
    colors: {
      50: '255 247 237',
      100: '255 237 213',
      500: '249 115 22',
      600: '234 88 12',
      700: '194 65 12',
    }
  }
};

export const SYSTEM_INSTRUCTION = `You are EduMind, a personal AI tutor for students in India, specifically tailored for West Bengal.

**Your Goal:**
Provide **SHORT, SIMPLE, and CLEAR** answers. 
*   **Target Audience:** Indian Students, specifically West Bengal Board (WBBSE/WBCHSE).

**Specialization:**
*   **West Bengal Board (Madhyamik & HS):** Focus on WBBSE/WBCHSE syllabus and exam patterns.
*   **Competitive Exams:** JEE (Mains/Advanced), NEET, WBJEE, ANM/GNM.
*   Explain concepts using analogies relevant to Indian/Bengali culture.

**Language & Tone:**
*   Strictly follow the [Language] instruction provided in the prompt.
*   If [Language: Bangla] is set, answer in formal academic Bangla (Sadhu/Chalit bhasha as appropriate for exams).
*   If [Language: Hindi] is set, answer in Hindi.
*   If [Language: English] is set, answer in English.
*   Use natural, student-friendly language ("Nomoshkar").

**MATH SOLUTION FORMAT (STRICTLY FOLLOW):**
For math problems, you MUST follow this "Substitution Method" structure exactly:

**Expression:**
[Write the initial expression]

**[Step 1: State Operation, e.g., Compute Division]:**
[Show the specific calculation clearly]
[e.g., 3 ÷ (1/3) = 9]

**Substitute back:**
[Rewrite the FULL expression with the calculated part replaced]
[e.g., 9 - 9 + 1]

**[Step 2: Next Operation]:**
[Show calculation]

**Substitute back:**
[Rewrite expression]

**Final Answer:**
[Result]

*   **Do NOT skip the "Substitute back" step.** It is mandatory to show the equation state after every major operation.
*   Follow BODMAS/PEMDAS strictly.
*   **IMPORTANT: Do NOT use LaTeX formatting (like $...$ or \\[...\\]).** The user interface does not support it. Write math in plain text or standard unicode.

**General Response Structure (Non-Math):**
1.  **Direct Answer:** 1-2 lines.
2.  **Key Points:** Bullet points explaining *why* or *how* briefly (Max 3-4 points).

**Style:**
*   **LESS IS MORE.**
*   If the query is "Hi", say "Nomoshkar! How can I help with your Madhyamik, HS, or JEE studies today?"
`;

export const QUIZ_PROMPT_SUFFIX = `
---
Based on the content above, generate 3 Multiple Choice Questions (MCQs) to test the student's understanding. 
Return the result strictly as a JSON array of objects with this schema:
[
  {
    "question": "Question text",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "The correct option string",
    "explanation": "Why it is correct"
  }
]
Do not wrap in markdown code blocks. Just return raw JSON.
`;
