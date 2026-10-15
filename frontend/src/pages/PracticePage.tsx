import { useEffect } from 'react';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { usePractice } from '../context/PracticeContext';
import PracticeSentenceInput from '../components/PracticeSentenceInput';
import PracticeHistory from '../components/PracticeHistory';
import { PageContainer, PageHeader } from '../components/ui/Page';

const PracticePage = () => {
  const { token } = useRequireAuth();
  const { practices, getHistory } = usePractice();

  useEffect(() => {
    if (token) {
      getHistory().catch((error) => console.error('Failed to load history:', error));
    }
  }, [token, getHistory]);

  return (
    <PageContainer width="reading">
      <PageHeader
        eyebrow="Sentence Check"
        title="Check your own sentence"
        description="Write a sentence and see it corrected, with each article mistake explained."
      />
      <div className="space-y-10">
        <PracticeSentenceInput />
        <PracticeHistory practices={practices} />
      </div>
    </PageContainer>
  );
};

export default PracticePage;
