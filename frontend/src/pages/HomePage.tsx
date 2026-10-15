import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-6">
          Master English Grammar with AI
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Learn English articles (a, an, the) with our AI-powered platform. Get personalized feedback and track your progress.
        </p>

        {!user ? (
          <div className="space-x-4">
            <Link to="/login" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
              Login
            </Link>
            <Link to="/register" className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition">
              Register Now
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/analyze" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
              Analyze a Question
            </Link>
            <Link to="/practice" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
              Start Practice
            </Link>
            <Link to="/quiz" className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
              Try a Quiz
            </Link>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Why Choose Shikho English?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">AI-Powered Feedback</h3>
              <p className="text-gray-600">Get detailed AI explanations for every grammar mistake.</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Track Progress</h3>
              <p className="text-gray-600">Monitor your learning journey with detailed progress analytics.</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Interactive Quizzes</h3>
              <p className="text-gray-600">Test your knowledge with AI-generated grammar quizzes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
