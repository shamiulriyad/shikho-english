// Response shapes of the ASP.NET Core API (Backend/DTOs). Keep in sync with the backend.
// Dates arrive as ISO 8601 strings; nullable backend fields arrive as null.

export interface User {
  id: number;
  email: string;
  username: string;
  fullName: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string | null;
  user: User | null;
}

export interface Mistake {
  type: string;
  original: string;
  correction: string;
  reason: string;
}

export interface PracticeResult {
  id: number;
  originalSentence: string;
  correctedSentence: string;
  mistakes: Mistake[];
  explanation: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface UserProgress {
  totalPractices: number;
  correctPractices: number;
  correctPercentage: number;
  totalQuizzes: number;
  averageQuizScore: number;
  correctArticleCount: number;
  totalArticleCount: number;
}

// Answer fields stay null until the student has answered the question
export interface QuizQuestion {
  id: number;
  question: string;
  incorrectSentence: string;
  correctAnswer: string | null;
  userAnswer: string | null;
  isAnsweredCorrectly: boolean | null;
  explanation: string | null;
  /** "articles": choose a, an or the. "text": type the answer (practice sets) */
  answerType: 'articles' | 'text';
  explanationBn: string | null;
  feedbackEn: string | null;
  feedbackBn: string | null;
}

export interface Quiz {
  id: number;
  title: string;
  score: number;
  totalQuestions: number;
  isCompleted: boolean;
  createdAt: string;
  completedAt: string | null;
  questions: QuizQuestion[];
  /** Set for practice sets generated from a question analysis */
  topic: Topic | null;
  sourceAnalysisId: number | null;
}

// RFC 7807 error body. "message" is the backend's legacy field and mirrors detail (or title).
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  message?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}

export interface Topic {
  code: string;
  nameEn: string;
  nameBn: string;
}

export interface BilingualText {
  en: string;
  bn: string;
}

export interface StudentAnswerFeedback extends BilingualText {
  answer: string;
  isCorrect: boolean;
}

export interface QuestionAnalysis {
  id: number;
  topic: Topic;
  questionText: string;
  correctAnswer: string;
  steps: BilingualText[];
  rule: BilingualText;
  commonMistakes: BilingualText[];
  studentAnswer: StudentAnswerFeedback | null;
  createdAt: string;
}

export interface QuestionAnalysisSummary {
  id: number;
  topic: Topic;
  questionText: string;
  correctAnswer: string;
  studentAnswerIsCorrect: boolean | null;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface TopicProgress {
  topic: Topic;
  questionsAnalysed: number;
  practiceAnswered: number;
  answersMarked: number;
  answersCorrect: number;
  /** null until at least one answer has been marked */
  accuracyPercentage: number | null;
  needsPractice: boolean;
  lastActivityAt: string | null;
}
