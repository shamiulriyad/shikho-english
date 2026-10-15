import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PracticePage from './pages/PracticePage';
import QuizPage from './pages/QuizPage';
import ProgressPage from './pages/ProgressPage';
import AnalyzePage from './pages/AnalyzePage';
import HistoryPage from './pages/HistoryPage';
import QuestionDetailPage from './pages/QuestionDetailPage';
import PracticeSetPage from './pages/PracticeSetPage';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/questions/:id" element={<QuestionDetailPage />} />
        <Route path="/practice-sets/:id" element={<PracticeSetPage />} />
      </Routes>
    </Router>
  );
}

export default App;
