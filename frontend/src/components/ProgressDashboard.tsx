import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../utils/api';
import type { UserProgress } from '../types/api';

const ProgressDashboard = () => {
  const { token } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchProgress = async () => {
      try {
        setProgress(await apiCall<UserProgress>('/practice/progress'));
      } catch (error) {
        console.error('Failed to fetch progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [token]);

  if (isLoading) {
    return <div className="text-center text-gray-600">Loading progress...</div>;
  }

  if (!progress) {
    return <div className="text-center text-gray-600">No progress data available</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl w-full">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-gray-600 text-sm font-semibold uppercase mb-2">Total Practices</h3>
        <p className="text-4xl font-bold text-blue-600">{progress.totalPractices}</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-gray-600 text-sm font-semibold uppercase mb-2">Correct Practices</h3>
        <p className="text-4xl font-bold text-green-600">{progress.correctPractices}</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-gray-600 text-sm font-semibold uppercase mb-2">Accuracy</h3>
        <p className="text-4xl font-bold text-purple-600">{progress.correctPercentage.toFixed(1)}%</p>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full"
            style={{ width: `${progress.correctPercentage}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-gray-600 text-sm font-semibold uppercase mb-2">Quiz Average</h3>
        <p className="text-4xl font-bold text-orange-600">{progress.averageQuizScore.toFixed(1)}%</p>
      </div>
    </div>
  );
};

export default ProgressDashboard;
