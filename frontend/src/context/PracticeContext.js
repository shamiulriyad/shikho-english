import React, { createContext, useCallback, useContext, useState } from 'react';
import { apiCall } from '../utils/api';

const PracticeContext = createContext();

export const PracticeProvider = ({ children }) => {
  const [practices, setPractices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const submitSentence = async (sentence) => {
    setIsLoading(true);
    try {
      const data = await apiCall('/practice/submit', {
        method: 'POST',
        body: JSON.stringify({ sentence })
      });
      setPractices((prev) => [data, ...prev]);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const getHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiCall('/practice/history');
      setPractices(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <PracticeContext.Provider value={{ practices, isLoading, submitSentence, getHistory }}>
      {children}
    </PracticeContext.Provider>
  );
};

export const usePractice = () => useContext(PracticeContext);
