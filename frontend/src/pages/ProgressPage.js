import React from 'react';
import { useRequireAuth } from '../hooks/useRequireAuth';
import ProgressDashboard from '../components/ProgressDashboard';

const ProgressPage = () => {
  useRequireAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-12">Your Learning Progress</h1>
        <ProgressDashboard />
      </div>
    </div>
  );
};

export default ProgressPage;
