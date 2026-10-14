import React from 'react';
import { useRequireAuth } from '../hooks/useRequireAuth';
import QuizComponent from '../components/QuizComponent';

const QuizPage = () => {
  useRequireAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12 px-4 flex items-center justify-center">
      <QuizComponent />
    </div>
  );
};

export default QuizPage;
