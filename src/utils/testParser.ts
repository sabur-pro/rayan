import { TestData, TestQuestion, TestAnswer } from '../types/test';

/**
 * Parses a .txt file content into TestData structure
 * Format:
 * - First line: Test title
 * - Lines starting with "?": Questions
 * - Lines starting with "+": Correct answers
 * - Lines starting with "-": Incorrect answers
 */
export const parseTestFile = (content: string): TestData => {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) {
    throw new Error('Empty test file');
  }

  // First non-empty line is the title
  const title = lines[0];
  
  const questions: TestQuestion[] = [];
  let currentQuestion: Partial<TestQuestion> | null = null;
  let questionId = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('?')) {
      // Save previous question if exists
      if (currentQuestion && currentQuestion.question) {
        questions.push({
          id: questionId++,
          question: currentQuestion.question,
          answers: currentQuestion.answers || [],
          userAnswer: undefined,
        });
      }
      
      // Start new question
      currentQuestion = {
        question: line.substring(1).trim(),
        answers: [],
      };
    } else if (line.startsWith('+')) {
      // Correct answer
      if (currentQuestion) {
        const answerText = line.substring(1).trim();
        currentQuestion.answers = currentQuestion.answers || [];
        currentQuestion.answers.push({
          text: answerText,
          isCorrect: true,
        });
      }
    } else if (line.startsWith('-')) {
      // Incorrect answer
      if (currentQuestion) {
        const answerText = line.substring(1).trim();
        currentQuestion.answers = currentQuestion.answers || [];
        currentQuestion.answers.push({
          text: answerText,
          isCorrect: false,
        });
      }
    }
  }

  // Add last question
  if (currentQuestion && currentQuestion.question) {
    questions.push({
      id: questionId++,
      question: currentQuestion.question,
      answers: currentQuestion.answers || [],
      userAnswer: undefined,
    });
  }

  return {
    title,
    questions,
  };
};

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Prepares test questions based on setup configuration
 */
export const prepareTestQuestions = (
  allQuestions: TestQuestion[],
  setup: {
    mode: 'all' | 'range';
    rangeStart?: number;
    rangeEnd?: number;
    questionCount: number | 'all';
    shuffleAnswers: boolean;
  }
): TestQuestion[] => {
  let selectedQuestions = [...allQuestions];

  // Filter by range if needed
  if (setup.mode === 'range' && setup.rangeStart !== undefined && setup.rangeEnd !== undefined) {
    const start = Math.max(0, setup.rangeStart - 1);
    const end = Math.min(allQuestions.length, setup.rangeEnd);
    selectedQuestions = selectedQuestions.slice(start, end);
  }

  // Select random questions if count is specified
  if (setup.questionCount !== 'all' && typeof setup.questionCount === 'number') {
    if (selectedQuestions.length > setup.questionCount) {
      selectedQuestions = shuffleArray(selectedQuestions).slice(0, setup.questionCount);
      // Sort back by id to maintain order
      selectedQuestions.sort((a, b) => a.id - b.id);
    }
  }

  // Shuffle answers if needed
  if (setup.shuffleAnswers) {
    selectedQuestions = selectedQuestions.map(question => ({
      ...question,
      answers: shuffleArray(question.answers),
    }));
  }

  return selectedQuestions;
};
