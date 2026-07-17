// Realistic mock data for the PTE Academy frontend demo.
// All data is internally consistent and demo-only.

export interface MockStudent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  targetScore: number;
  estimatedScore: number;
  streakDays: number;
  joinDate: string;
  plan: 'free' | 'premium' | 'pro';
  country: string;
  timezone: string;
  goals: string[];
}

export interface MockTeacher {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  title: string;
  bio: string;
  specialties: string[];
  rating: number;
  students: number;
  country: string;
}

export interface MockCourse {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  accessLevel: 'free' | 'paid';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedDurationMinutes: number;
  lessons: number;
  enrolled: number;
  rating: number;
  image?: string;
  tags: string[];
  skills: string[];
}

export interface MockLesson {
  id: string;
  courseId: string;
  title: string;
  summary: string;
  durationMinutes: number;
  order: number;
  videoUrl?: string;
  hasTranscript: boolean;
  hasQuiz: boolean;
  completed: boolean;
  progress: number;
}

export interface MockPracticeTask {
  id: string;
  type: string;
  title: string;
  description: string;
  instructions: string;
  timeLimitSeconds: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  skill: 'Speaking' | 'Writing' | 'Reading' | 'Listening';
}

export interface MockNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  date: string;
}

export interface MockInvoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  plan: string;
}

export interface MockActivity {
  id: string;
  type: string;
  title: string;
  score?: number;
  date: string;
  durationMinutes: number;
}

export interface MockAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
  progress: number;
  total: number;
}

export const MOCK_STUDENTS: MockStudent[] = [
  {
    id: 'student-1',
    name: 'Alex Johnson',
    email: 'alex.j@example.com',
    targetScore: 79,
    estimatedScore: 72,
    streakDays: 12,
    joinDate: '2026-05-12',
    plan: 'premium',
    country: 'Australia',
    timezone: 'Australia/Sydney',
    goals: ['Reach 79+ in speaking', 'Improve reading speed', 'Master essay structure'],
  },
  {
    id: 'student-2',
    name: 'Priya Sharma',
    email: 'priya.s@example.com',
    targetScore: 65,
    estimatedScore: 68,
    streakDays: 8,
    joinDate: '2026-06-01',
    plan: 'pro',
    country: 'India',
    timezone: 'Asia/Kolkata',
    goals: ['Pass PTE first attempt', 'Build listening vocabulary'],
  },
  {
    id: 'student-3',
    name: 'Wei Chen',
    email: 'wei.c@example.com',
    targetScore: 85,
    estimatedScore: 80,
    streakDays: 24,
    joinDate: '2026-04-20',
    plan: 'premium',
    country: 'China',
    timezone: 'Asia/Shanghai',
    goals: ['Score 85+ for visa', 'Perfect pronunciation'],
  },
  {
    id: 'student-4',
    name: 'Maria Gonzalez',
    email: 'maria.g@example.com',
    targetScore: 58,
    estimatedScore: 55,
    streakDays: 3,
    joinDate: '2026-06-15',
    plan: 'free',
    country: 'Philippines',
    timezone: 'Asia/Manila',
    goals: ['Improve overall fluency', 'Learn collocations'],
  },
  {
    id: 'student-5',
    name: 'Ahmed Al-Farsi',
    email: 'ahmed.a@example.com',
    targetScore: 65,
    estimatedScore: 62,
    streakDays: 5,
    joinDate: '2026-06-08',
    plan: 'premium',
    country: 'UAE',
    timezone: 'Asia/Dubai',
    goals: ['Writing coherence', 'Listening spelling'],
  },
];

export const MOCK_TEACHERS: MockTeacher[] = [
  {
    id: 'teacher-1',
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@pte.academy',
    title: 'Senior PTE Instructor',
    bio: 'Former PTE examiner with 10+ years of experience helping students reach 79+ across all skills.',
    specialties: ['Speaking', 'Pronunciation', 'Fluency'],
    rating: 4.9,
    students: 342,
    country: 'Australia',
  },
  {
    id: 'teacher-2',
    name: 'James O’Connor',
    email: 'james.oconnor@pte.academy',
    title: 'Writing Specialist',
    bio: 'Cambridge-certified English teacher focused on essay structure, grammar, and vocabulary range.',
    specialties: ['Writing', 'Grammar', 'Vocabulary'],
    rating: 4.8,
    students: 218,
    country: 'Ireland',
  },
  {
    id: 'teacher-3',
    name: 'Anita Patel',
    email: 'anita.patel@pte.academy',
    title: 'Reading & Listening Coach',
    bio: 'Expert in time-management strategies and active listening techniques for high-stakes exams.',
    specialties: ['Reading', 'Listening', 'Time management'],
    rating: 4.9,
    students: 276,
    country: 'UK',
  },
  {
    id: 'teacher-4',
    name: 'David Kim',
    email: 'david.kim@pte.academy',
    title: 'AI Feedback Lead',
    bio: 'Combines linguistics and machine learning insights to deliver actionable speaking feedback.',
    specialties: ['AI scoring', 'Speaking analysis', 'Pronunciation'],
    rating: 4.7,
    students: 189,
    country: 'Canada',
  },
];

export const MOCK_COURSES: MockCourse[] = [
  {
    id: 'course-1',
    slug: 'pte-academic-complete',
    title: 'PTE Academic Complete Preparation',
    summary: 'A comprehensive guided course covering every PTE task type with strategy lessons and practice sets.',
    description:
      'This course walks you through every PTE Academic task type, from Read Aloud to Write from Dictation. Each module includes video strategy lessons, worked examples, timed practice, and AI feedback so you build confidence and consistency before test day.',
    level: 'Intermediate',
    accessLevel: 'paid',
    difficulty: 'Medium',
    estimatedDurationMinutes: 1840,
    lessons: 42,
    enrolled: 1240,
    rating: 4.8,
    tags: ['All skills', 'Self-paced', 'AI feedback'],
    skills: ['Speaking', 'Writing', 'Reading', 'Listening'],
  },
  {
    id: 'course-2',
    slug: 'speaking-mastery',
    title: 'Speaking Mastery',
    summary: 'Targeted drills for Read Aloud, Repeat Sentence, Describe Image, and Retell Lecture.',
    description:
      'Speaking Mastery focuses on the four speaking tasks that carry the most weight. Learn pacing, pronunciation, and content selection strategies, then practise with realistic prompts and receive instant AI feedback.',
    level: 'Advanced',
    accessLevel: 'paid',
    difficulty: 'Hard',
    estimatedDurationMinutes: 620,
    lessons: 18,
    enrolled: 856,
    rating: 4.7,
    tags: ['Speaking', 'Fluency', 'Pronunciation'],
    skills: ['Speaking'],
  },
  {
    id: 'course-3',
    slug: 'writing-foundations',
    title: 'Writing Foundations',
    summary: 'Master Summarise Written Text and Essay structure with templates and grammar review.',
    description:
      'Writing Foundations covers the two writing tasks in depth. Build a reusable essay template, practise summarising complex arguments, and receive feedback on grammar, vocabulary, form, and structure.',
    level: 'Beginner',
    accessLevel: 'free',
    difficulty: 'Easy',
    estimatedDurationMinutes: 340,
    lessons: 10,
    enrolled: 2310,
    rating: 4.6,
    tags: ['Writing', 'Grammar', 'Free'],
    skills: ['Writing'],
  },
  {
    id: 'course-4',
    slug: 'reading-speed',
    title: 'Reading Speed & Accuracy',
    summary: 'Strategies for Multiple-choice, Re-order Paragraphs, and Reading Fill in the Blanks.',
    description:
      'Improve reading speed without sacrificing accuracy. This course teaches skimming, scanning, and elimination techniques for every reading task, with vocabulary and collocations practice built in.',
    level: 'Intermediate',
    accessLevel: 'paid',
    difficulty: 'Medium',
    estimatedDurationMinutes: 480,
    lessons: 14,
    enrolled: 672,
    rating: 4.7,
    tags: ['Reading', 'Vocabulary', 'Speed'],
    skills: ['Reading'],
  },
  {
    id: 'course-5',
    slug: 'listening-intensive',
    title: 'Listening Intensive',
    summary: 'Drills for Summarise Spoken Text, Fill in the Blanks, and Write from Dictation.',
    description:
      'Listening Intensive trains your ear for accents, spelling, and note-taking. Practise with authentic lecture clips and receive instant feedback on content, spelling, and form.',
    level: 'Advanced',
    accessLevel: 'paid',
    difficulty: 'Hard',
    estimatedDurationMinutes: 560,
    lessons: 16,
    enrolled: 534,
    rating: 4.8,
    tags: ['Listening', 'Spelling', 'Dictation'],
    skills: ['Listening'],
  },
];

export const MOCK_LESSONS: MockLesson[] = [
  {
    id: 'l-1',
    courseId: 'course-3',
    title: 'Understanding the PTE Essay Prompt',
    summary: 'Learn how to analyse prompts and plan your response.',
    durationMinutes: 22,
    order: 1,
    hasTranscript: true,
    hasQuiz: true,
    completed: true,
    progress: 100,
  },
  {
    id: 'l-2',
    courseId: 'course-3',
    title: 'Building Your Essay Template',
    summary: 'Create a flexible template for any opinion essay.',
    durationMinutes: 28,
    order: 2,
    hasTranscript: true,
    hasQuiz: true,
    completed: true,
    progress: 100,
  },
  {
    id: 'l-3',
    courseId: 'course-3',
    title: 'Summarise Written Text Strategy',
    summary: 'Condense long passages into one clean sentence.',
    durationMinutes: 25,
    order: 3,
    hasTranscript: true,
    hasQuiz: true,
    completed: false,
    progress: 45,
  },
  {
    id: 'l-4',
    courseId: 'course-3',
    title: 'Grammar Clinic: Common Errors',
    summary: 'Fix the ten errors that lower writing scores.',
    durationMinutes: 35,
    order: 4,
    hasTranscript: true,
    hasQuiz: true,
    completed: false,
    progress: 0,
  },
  {
    id: 'l-5',
    courseId: 'course-1',
    title: 'PTE Test Format Overview',
    summary: 'Navigate the test structure, timing, and scoring.',
    durationMinutes: 30,
    order: 1,
    hasTranscript: true,
    hasQuiz: true,
    completed: true,
    progress: 100,
  },
  {
    id: 'l-6',
    courseId: 'course-1',
    title: 'Speaking: Read Aloud Basics',
    summary: 'Pacing, chunking, and clarity for Read Aloud.',
    durationMinutes: 24,
    order: 2,
    hasTranscript: true,
    hasQuiz: false,
    completed: true,
    progress: 100,
  },
  {
    id: 'l-7',
    courseId: 'course-1',
    title: 'Speaking: Repeat Sentence',
    summary: 'Memory and delivery strategies for Repeat Sentence.',
    durationMinutes: 26,
    order: 3,
    hasTranscript: true,
    hasQuiz: true,
    completed: false,
    progress: 60,
  },
  {
    id: 'l-8',
    courseId: 'course-2',
    title: 'Describe Image Framework',
    summary: 'A four-step framework for any image.',
    durationMinutes: 32,
    order: 1,
    hasTranscript: true,
    hasQuiz: true,
    completed: false,
    progress: 20,
  },
];

export const SPEAKING_TASKS: MockPracticeTask[] = [
  {
    id: 'speak-ra-1',
    type: 'Read Aloud',
    title: 'Read Aloud — Science',
    description: 'Practise reading a short academic text aloud.',
    instructions: 'Read the text aloud clearly and naturally. You have 40 seconds to prepare.',
    timeLimitSeconds: 40,
    difficulty: 'Medium',
    skill: 'Speaking',
  },
  {
    id: 'speak-rs-1',
    type: 'Repeat Sentence',
    title: 'Repeat Sentence — Lecture',
    description: 'Listen and repeat the sentence exactly.',
    instructions: 'Listen to the sentence, then repeat it as accurately as possible.',
    timeLimitSeconds: 15,
    difficulty: 'Hard',
    skill: 'Speaking',
  },
  {
    id: 'speak-di-1',
    type: 'Describe Image',
    title: 'Describe Image — Graph',
    description: 'Describe the key information in a graph.',
    instructions: 'You have 25 seconds to prepare. Describe the image in 40 seconds.',
    timeLimitSeconds: 40,
    difficulty: 'Medium',
    skill: 'Speaking',
  },
  {
    id: 'speak-rl-1',
    type: 'Retell Lecture',
    title: 'Retell Lecture — Psychology',
    description: 'Listen to a lecture and retell the main points.',
    instructions: 'You have 10 seconds to prepare. Retell the lecture in 40 seconds.',
    timeLimitSeconds: 40,
    difficulty: 'Hard',
    skill: 'Speaking',
  },
  {
    id: 'speak-rq-1',
    type: 'Answer Short Question',
    title: 'Answer Short Question',
    description: 'Listen to a question and answer in one word.',
    instructions: 'Answer the question with a single word or short phrase.',
    timeLimitSeconds: 10,
    difficulty: 'Easy',
    skill: 'Speaking',
  },
];

export const WRITING_TASKS: MockPracticeTask[] = [
  {
    id: 'write-swt-1',
    type: 'Summarise Written Text',
    title: 'Summarise Written Text — Economy',
    description: 'Summarise a passage in one sentence.',
    instructions: 'Write a single sentence of 5 to 75 words summarising the passage.',
    timeLimitSeconds: 600,
    difficulty: 'Medium',
    skill: 'Writing',
  },
  {
    id: 'write-essay-1',
    type: 'Write Essay',
    title: 'Write Essay — Education',
    description: 'Write a 200–300 word essay.',
    instructions: 'Write an essay of 200–300 words on the topic.',
    timeLimitSeconds: 1200,
    difficulty: 'Hard',
    skill: 'Writing',
  },
];

export const READING_TASKS: MockPracticeTask[] = [
  {
    id: 'read-rwfb-1',
    type: 'Reading & Writing: Fill in the Blanks',
    title: 'Fill in the Blanks — Biology',
    description: 'Choose the correct words to complete the text.',
    instructions: 'Drag and drop the correct words into the blanks.',
    timeLimitSeconds: 300,
    difficulty: 'Medium',
    skill: 'Reading',
  },
  {
    id: 'read-rfb-1',
    type: 'Reading: Fill in the Blanks',
    description: 'Select the correct word for each blank.',
    title: 'Fill in the Blanks — History',
    instructions: 'Select the most appropriate word from the dropdown for each blank.',
    timeLimitSeconds: 300,
    difficulty: 'Medium',
    skill: 'Reading',
  },
  {
    id: 'read-ro-1',
    type: 'Re-order Paragraphs',
    title: 'Re-order Paragraphs',
    description: 'Put the paragraphs in logical order.',
    instructions: 'Drag the paragraphs into the correct order.',
    timeLimitSeconds: 300,
    difficulty: 'Hard',
    skill: 'Reading',
  },
  {
    id: 'read-mc-1',
    type: 'Multiple-choice, Choose Multiple Answers',
    title: 'Reading Multiple Answer',
    description: 'Select all correct answers.',
    instructions: 'Read the passage and select all correct answers.',
    timeLimitSeconds: 300,
    difficulty: 'Medium',
    skill: 'Reading',
  },
];

export const LISTENING_TASKS: MockPracticeTask[] = [
  {
    id: 'listen-sst-1',
    type: 'Summarise Spoken Text',
    title: 'Summarise Spoken Text — Climate',
    description: 'Listen and summarise the lecture.',
    instructions: 'Write a 50–70 word summary of the lecture.',
    timeLimitSeconds: 600,
    difficulty: 'Hard',
    skill: 'Listening',
  },
  {
    id: 'listen-mc-1',
    type: 'Listening Multiple-choice',
    title: 'Listening Multiple Answer',
    description: 'Listen and select all correct answers.',
    instructions: 'Listen to the recording and select all correct answers.',
    timeLimitSeconds: 300,
    difficulty: 'Medium',
    skill: 'Listening',
  },
  {
    id: 'listen-fib-1',
    type: 'Fill in the Blanks',
    title: 'Listening Fill in the Blanks',
    description: 'Type the missing words you hear.',
    instructions: 'Listen and type the missing words into the blanks.',
    timeLimitSeconds: 300,
    difficulty: 'Medium',
    skill: 'Listening',
  },
  {
    id: 'listen-hiw-1',
    type: 'Highlight Incorrect Words',
    title: 'Highlight Incorrect Words',
    description: 'Identify words that differ from the recording.',
    instructions: 'Click the words in the transcript that differ from what you hear.',
    timeLimitSeconds: 180,
    difficulty: 'Medium',
    skill: 'Listening',
  },
  {
    id: 'listen-wfd-1',
    type: 'Write from Dictation',
    title: 'Write from Dictation',
    description: 'Type the sentence you hear.',
    instructions: 'Type the sentence exactly as you hear it.',
    timeLimitSeconds: 60,
    difficulty: 'Hard',
    skill: 'Listening',
  },
];

export const ALL_PRACTICE_TASKS: MockPracticeTask[] = [
  ...SPEAKING_TASKS,
  ...WRITING_TASKS,
  ...READING_TASKS,
  ...LISTENING_TASKS,
];

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: 'n-1',
    title: 'Study reminder',
    message: 'Your daily speaking practice is waiting. Keep your 12-day streak alive.',
    type: 'info',
    read: false,
    date: '2026-07-16T08:00:00Z',
  },
  {
    id: 'n-2',
    title: 'New AI feedback ready',
    message: 'Your Read Aloud response has been analysed. View your feedback now.',
    type: 'success',
    read: false,
    date: '2026-07-15T18:30:00Z',
  },
  {
    id: 'n-3',
    title: 'Mock exam scheduled',
    message: 'Your full mock exam begins tomorrow at 10:00 AM.',
    type: 'warning',
    read: true,
    date: '2026-07-14T12:00:00Z',
  },
  {
    id: 'n-4',
    title: 'Course update',
    message: 'New lessons added to PTE Academic Complete Preparation.',
    type: 'info',
    read: true,
    date: '2026-07-13T09:15:00Z',
  },
  {
    id: 'n-5',
    title: 'Achievement unlocked',
    message: 'You earned "First 7-Day Streak". Great work.',
    type: 'success',
    read: true,
    date: '2026-07-10T20:00:00Z',
  },
];

export const MOCK_INVOICES: MockInvoice[] = [
  { id: 'INV-2026-001', date: '2026-07-01', amount: 29.99, status: 'paid', plan: 'Premium Monthly' },
  { id: 'INV-2026-002', date: '2026-06-01', amount: 29.99, status: 'paid', plan: 'Premium Monthly' },
  { id: 'INV-2026-003', date: '2026-05-01', amount: 299.99, status: 'paid', plan: 'Premium Annual' },
  { id: 'INV-2026-004', date: '2026-08-01', amount: 29.99, status: 'pending', plan: 'Premium Monthly' },
];

export const MOCK_ACTIVITIES: MockActivity[] = [
  {
    id: 'a-1',
    type: 'Practice',
    title: 'Read Aloud — Science',
    score: 78,
    date: '2026-07-16T07:30:00Z',
    durationMinutes: 12,
  },
  { id: 'a-2', type: 'Lesson', title: 'Repeat Sentence Strategy', date: '2026-07-15T19:00:00Z', durationMinutes: 26 },
  {
    id: 'a-3',
    type: 'Mock Exam',
    title: 'Full Mock Exam #4',
    score: 70,
    date: '2026-07-14T10:00:00Z',
    durationMinutes: 150,
  },
  {
    id: 'a-4',
    type: 'Practice',
    title: 'Write Essay — Education',
    score: 74,
    date: '2026-07-13T16:45:00Z',
    durationMinutes: 28,
  },
  {
    id: 'a-5',
    type: 'AI Feedback',
    title: 'Speaking analysis review',
    date: '2026-07-12T11:20:00Z',
    durationMinutes: 10,
  },
];

export const MOCK_ACHIEVEMENTS: MockAchievement[] = [
  {
    id: 'ach-1',
    title: 'First Steps',
    description: 'Complete your first practice task.',
    icon: '🎯',
    unlocked: true,
    unlockedDate: '2026-05-13',
    progress: 1,
    total: 1,
  },
  {
    id: 'ach-2',
    title: '7-Day Streak',
    description: 'Study for 7 consecutive days.',
    icon: '🔥',
    unlocked: true,
    unlockedDate: '2026-07-10',
    progress: 7,
    total: 7,
  },
  {
    id: 'ach-3',
    title: '30-Day Streak',
    description: 'Study for 30 consecutive days.',
    icon: '🔥',
    unlocked: false,
    progress: 12,
    total: 30,
  },
  {
    id: 'ach-4',
    title: 'Essay Ace',
    description: 'Score 80+ on 5 essays.',
    icon: '✍️',
    unlocked: false,
    progress: 3,
    total: 5,
  },
  {
    id: 'ach-5',
    title: 'Mock Exam Hero',
    description: 'Complete 3 full mock exams.',
    icon: '🎓',
    unlocked: false,
    progress: 1,
    total: 3,
  },
  {
    id: 'ach-6',
    title: 'Feedback Master',
    description: 'Review 20 AI feedback reports.',
    icon: '🤖',
    unlocked: false,
    progress: 14,
    total: 20,
  },
];

export const SKILL_BREAKDOWN = {
  speaking: 72,
  writing: 74,
  reading: 78,
  listening: 71,
  grammar: 76,
  vocabulary: 75,
  pronunciation: 70,
  fluency: 73,
};

export const WEEKLY_PROGRESS = [
  { label: 'Mon', value: 45 },
  { label: 'Tue', value: 60 },
  { label: 'Wed', value: 30 },
  { label: 'Thu', value: 75 },
  { label: 'Fri', value: 50 },
  { label: 'Sat', value: 90 },
  { label: 'Sun', value: 65 },
];

export const MONTHLY_TREND = [
  { label: 'Week 1', value: 62 },
  { label: 'Week 2', value: 65 },
  { label: 'Week 3', value: 68 },
  { label: 'Week 4', value: 72 },
];

export const CALENDAR_HEATMAP = Array.from({ length: 30 }, (_, i) => {
  const date = new Date('2026-07-16');
  date.setDate(date.getDate() - i);
  const value = Math.random() > 0.25 ? Math.floor(Math.random() * 120) : 0;
  return { date: date.toISOString().split('T')[0], value };
}).reverse();

export const UPCOMING_EXAM = {
  date: '2026-08-12',
  time: '09:00 AM',
  location: 'Sydney Pearson Test Centre',
  countdownDays: 27,
  targetScore: 79,
};

export const MOCK_BLOG_POSTS = [
  {
    id: 'blog-1',
    title: 'How to Build a 79+ PTE Speaking Score',
    excerpt: 'Four habits that separate high scorers from average test takers.',
    author: 'Dr. Sarah Chen',
    date: '2026-07-10',
    category: 'Speaking',
  },
  {
    id: 'blog-2',
    title: 'The Complete Guide to PTE Writing Templates',
    excerpt: 'Use templates wisely: when they help, and when they hurt.',
    author: 'James O’Connor',
    date: '2026-07-05',
    category: 'Writing',
  },
  {
    id: 'blog-3',
    title: '5 Common Listening Mistakes and How to Fix Them',
    excerpt: 'Spelling, plurals, and note-taking traps that cost easy points.',
    author: 'Anita Patel',
    date: '2026-06-28',
    category: 'Listening',
  },
  {
    id: 'blog-4',
    title: 'Success Story: From 58 to 82 in Six Weeks',
    excerpt: 'How Maria used a structured plan to jump two PTE bands.',
    author: 'PTE Academy Team',
    date: '2026-06-20',
    category: 'Inspiration',
  },
];

export const MOCK_TESTIMONIALS = [
  {
    id: 't-1',
    name: 'Maria Gonzalez',
    role: 'Student Visa Applicant',
    country: 'Philippines',
    text: 'The AI speaking feedback helped me fix pronunciation habits I never noticed. I went from 58 to 73 in three weeks.',
    score: 73,
  },
  {
    id: 't-2',
    name: 'Wei Chen',
    role: 'Engineering Professional',
    country: 'China',
    text: 'The structured lessons and mock exams made the real test feel routine. I scored 85 overall.',
    score: 85,
  },
  {
    id: 't-3',
    name: 'Ahmed Al-Farsi',
    role: 'Healthcare Worker',
    country: 'UAE',
    text: 'I used the writing templates and grammar clinic every day. My writing score jumped from 62 to 79.',
    score: 79,
  },
  {
    id: 't-4',
    name: 'Priya Sharma',
    role: 'Nurse',
    country: 'India',
    text: 'The teacher feedback was detailed and kind. I always knew exactly what to practise next.',
    score: 68,
  },
];

export const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'month',
    description: 'Placeholder plan — final entitlements from configuration.',
    features: ['Limited daily practice', 'A few free lessons', 'Basic progress tracking', 'Community support'],
    cta: 'Get started',
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 29.99,
    period: 'month',
    description: 'Placeholder plan — final prices and entitlements from configuration.',
    features: [
      'Extended practice access',
      'Full course library',
      'AI speaking feedback',
      'Writing feedback',
      'Progress dashboard',
      'Mock exams',
    ],
    cta: 'Start free trial',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79.99,
    period: 'month',
    description: 'Placeholder plan — final prices and entitlements from configuration.',
    features: [
      'Everything in Premium',
      'Weekly teacher review',
      'Personal study plan',
      'Priority support',
      'Advanced analytics',
      '1-on-1 strategy session',
    ],
    cta: 'Upgrade to Pro',
    popular: false,
  },
];

export const FAQ_ITEMS = [
  {
    question: 'What is PTE Academic?',
    answer:
      'PTE Academic is a computer-based English test for international study and migration. It tests speaking, writing, reading, and listening in a single 2-hour session.',
  },
  {
    question: 'Are PTE Academy scores official?',
    answer:
      'No. Our platform provides estimated training scores and AI feedback to help you prepare. Only Pearson can issue official PTE scores.',
  },
  {
    question: 'Can I practise all PTE task types?',
    answer:
      'Yes. Premium and Pro plans include every PTE Academic task type, with timed prompts and AI feedback where applicable.',
  },
  {
    question: 'Do I need to install software?',
    answer: 'No. PTE Academy runs in your browser. For speaking tasks, you will need a microphone and a quiet room.',
  },
  {
    question: 'How do I cancel my subscription?',
    answer:
      'You can cancel anytime from Account → Billing. Your access continues until the end of the current billing period.',
  },
];

export const SUPPORT_TICKETS = [
  {
    id: 'TK-1001',
    subject: 'Cannot hear audio in practice',
    status: 'open',
    priority: 'high',
    date: '2026-07-16',
    assignee: 'Support Bot',
  },
  {
    id: 'TK-1002',
    subject: 'Request refund for duplicate payment',
    status: 'pending',
    priority: 'medium',
    date: '2026-07-15',
    assignee: 'Billing Team',
  },
  {
    id: 'TK-1003',
    subject: 'How to reset study plan',
    status: 'resolved',
    priority: 'low',
    date: '2026-07-14',
    assignee: 'Support Bot',
  },
  {
    id: 'TK-1004',
    subject: 'AI feedback seems inaccurate',
    status: 'open',
    priority: 'medium',
    date: '2026-07-13',
    assignee: 'AI Team',
  },
];

export function getCourseBySlug(slug: string): MockCourse | undefined {
  return MOCK_COURSES.find((c) => c.slug === slug);
}

export function getCourseById(id: string): MockCourse | undefined {
  return MOCK_COURSES.find((c) => c.id === id);
}

export function getLessonsForCourse(courseId: string): MockLesson[] {
  return MOCK_LESSONS.filter((l) => l.courseId === courseId).sort((a, b) => a.order - b.order);
}

export function getLessonById(id: string): MockLesson | undefined {
  return MOCK_LESSONS.find((l) => l.id === id);
}

export function getTaskById(id: string): MockPracticeTask | undefined {
  return ALL_PRACTICE_TASKS.find((t) => t.id === id);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
}
