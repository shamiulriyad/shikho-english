import { useEffect, useState } from 'react';
import { apiCall } from '../utils/api';
import type { Topic } from '../types/api';

/** Grammar topics for pickers and filters. An empty list just hides the choice. */
export const useTopics = () => {
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    let active = true;
    apiCall<Topic[]>('/topics')
      .then((data) => {
        if (active) setTopics(data);
      })
      .catch((error) => console.error('Failed to load topics:', error));
    return () => {
      active = false;
    };
  }, []);

  return topics;
};
