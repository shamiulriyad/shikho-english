/** "1 question", "3 questions" */
export const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? '' : 's'}`;

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};
