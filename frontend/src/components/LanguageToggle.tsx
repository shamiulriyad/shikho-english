import { useLanguage, type Language } from '../context/LanguageContext';

const OPTIONS: { value: Language; label: string; lang: string }[] = [
  { value: 'en', label: 'English', lang: 'en' },
  { value: 'bn', label: 'বাংলা', lang: 'bn' }
];

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div role="group" aria-label="Explanation language" className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          lang={option.lang}
          aria-pressed={language === option.value}
          onClick={() => setLanguage(option.value)}
          className={`px-4 py-1.5 text-sm font-semibold transition ${
            language === option.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-blue-50'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageToggle;
