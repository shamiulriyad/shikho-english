import { useRequireAuth } from '../hooks/useRequireAuth';
import QuizComponent from '../components/QuizComponent';
import { PageContainer, PageHeader } from '../components/ui/Page';

const QuizPage = () => {
  useRequireAuth();

  return (
    <PageContainer width="reading">
      <PageHeader
        eyebrow="Article quiz"
        title="Grammar Quiz"
        description="A short multiple-choice quiz on a, an and the."
      />
      <QuizComponent />
    </PageContainer>
  );
};

export default QuizPage;
