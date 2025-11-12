// Types for test/quiz functionality

export interface TestAnswer {
  text: string;
  isCorrect: boolean;
}

export interface TestQuestion {
  id: number;
  question: string;
  answers: TestAnswer[];
  userAnswer?: number; // Index of selected answer
}

export interface TestData {
  title: string;
  questions: TestQuestion[];
}

export interface TestSetup {
  mode: 'all' | 'range';
  rangeStart?: number;
  rangeEnd?: number;
  questionCount: number | 'all';
  timeLimit: number; // in minutes
  shuffleAnswers: boolean;
}

export interface TestResult {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
  timeSpent: number; // in seconds
  questions: TestQuestion[];
}
