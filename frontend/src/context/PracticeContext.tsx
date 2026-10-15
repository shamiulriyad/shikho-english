import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { apiCall } from '../utils/api';
import type { PracticeResult } from '../types/api';

interface PracticeContextValue {
  practices: PracticeResult[];
  submitSentence: (sentence: string) => Promise<PracticeResult>;
  getHistory: () => Promise<PracticeResult[]>;
}

const PracticeContext = createContext<PracticeContextValue | null>(null);

export const PracticeProvider = ({ children }: { children: ReactNode }) => {
  const [practices, setPractices] = useState<PracticeResult[]>([]);

  const submitSentence = async (sentence: string) => {
    const data = await apiCall<PracticeResult>('/practice/submit', {
      method: 'POST',
      body: JSON.stringify({ sentence })
    });
    setPractices((prev) => [data, ...prev]);
    return data;
  };

  const getHistory = useCallback(async () => {
    const data = await apiCall<PracticeResult[]>('/practice/history');
    setPractices(data);
    return data;
  }, []);

  return (
    <PracticeContext.Provider value={{ practices, submitSentence, getHistory }}>
      {children}
    </PracticeContext.Provider>
  );
};

export const usePractice = (): PracticeContextValue => {
  const context = useContext(PracticeContext);
  if (!context) {
    throw new Error('usePractice must be used inside a PracticeProvider');
  }
  return context;
};
