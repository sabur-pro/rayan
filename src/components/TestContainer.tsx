import React, { useState } from 'react';
import { TestSetupScreen } from '../screens/TestSetupScreen';
import { TestScreen } from '../screens/TestScreen';
import { TestResultsScreen } from '../screens/TestResultsScreen';
import { TestPreviewScreen } from '../screens/TestPreviewScreen';
import { TestData, TestResult } from '../types/test';
import { prepareTestQuestions } from '../utils/testParser';

interface TestContainerProps {
  testData: TestData;
  onBack: () => void;
}

type Screen = 'setup' | 'test' | 'results' | 'preview';

export const TestContainer: React.FC<TestContainerProps> = ({ testData, onBack }) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('setup');
  const [preparedQuestions, setPreparedQuestions] = useState(testData.questions);
  const [timeLimit, setTimeLimit] = useState(30);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleStart = (setup: {
    mode: 'all' | 'range';
    rangeStart?: number;
    rangeEnd?: number;
    questionCount: number | 'all';
    timeLimit: number;
    shuffleAnswers: boolean;
  }) => {
    const questions = prepareTestQuestions(testData.questions, setup);
    setPreparedQuestions(questions);
    setTimeLimit(setup.timeLimit);
    setCurrentScreen('test');
  };

  const handleComplete = (result: TestResult) => {
    setTestResult(result);
    setCurrentScreen('results');
  };

  const handleRetry = () => {
    setCurrentScreen('setup');
    setTestResult(null);
  };

  const handlePreview = () => {
    setCurrentScreen('preview');
  };

  const handleBackFromPreview = () => {
    setCurrentScreen('setup');
  };

  if (currentScreen === 'setup') {
    return (
      <TestSetupScreen
        testData={testData}
        onStart={handleStart}
        onPreview={handlePreview}
        onBack={onBack}
      />
    );
  }

  if (currentScreen === 'preview') {
    return (
      <TestPreviewScreen
        testData={testData}
        onBack={handleBackFromPreview}
      />
    );
  }

  if (currentScreen === 'test') {
    return (
      <TestScreen
        questions={preparedQuestions}
        timeLimit={timeLimit}
        testTitle={testData.title}
        onComplete={handleComplete}
        onBack={onBack}
      />
    );
  }

  if (currentScreen === 'results' && testResult) {
    return (
      <TestResultsScreen
        result={testResult}
        testTitle={testData.title}
        onClose={onBack}
        onRetry={handleRetry}
      />
    );
  }

  return null;
};
