import { useRequireAuth } from '../hooks/useRequireAuth';
import ProgressDashboard from '../components/ProgressDashboard';
import RecentPracticeList from '../components/RecentPracticeList';
import TopicProgressList from '../components/TopicProgressList';
import { PageContainer, PageHeader } from '../components/ui/Page';

const ProgressPage = () => {
  useRequireAuth();

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Progress"
        title="Your Learning Progress"
        description="How you are doing in each topic, plus your Sentence Check and quiz totals."
      />
      <div className="space-y-12">
        <TopicProgressList />

        <section aria-labelledby="totals-heading">
          <h2 id="totals-heading" className="mb-4 text-h2 text-brand-forest">Sentence Check and quizzes</h2>
          <ProgressDashboard />
        </section>

        <RecentPracticeList />
      </div>
    </PageContainer>
  );
};

export default ProgressPage;
