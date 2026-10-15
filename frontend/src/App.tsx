import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import RequireAuth from './components/RequireAuth';
import RouteFocus from './components/RouteFocus';
import SiteFooter from './components/SiteFooter';
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
import NotFoundPage from './pages/NotFoundPage';
import TopicsPage from './pages/TopicsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Router>
      <RouteFocus />
      <div className="flex min-h-screen flex-col bg-paper">
        <Navbar />
        {/* The one <main> on every page; the header's skip link jumps here */}
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/topics" element={<TopicsPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/analyze" element={<AnalyzePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/questions/:id" element={<QuestionDetailPage />} />
              <Route path="/practice-sets/:id" element={<PracticeSetPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <SiteFooter />
      </div>
    </Router>
  );
}

export default App;
