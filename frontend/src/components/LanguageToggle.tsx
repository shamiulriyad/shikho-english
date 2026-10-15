import { useLanguage, type Language } from '../context/LanguageContext';

const OPTIONS: { value: Language; label: string; lang: string }[] = [
  { value: 'en', label: 'English', lang: 'en' },
  { value: 'bn', label: 'বাংলা', lang: 'bn' }
];

/** Switches the explanation language everywhere and remembers the choice. */
const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div role="group" aria-label="Explanation language" className="inline-flex rounded-md border border-line-strong bg-white p-0.5">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          lang={option.lang}
          aria-pressed={language === option.value}
          onClick={() => setLanguage(option.value)}
          className={`rounded px-3 py-1 text-sm font-semibold transition-colors ${
            language === option.value ? 'bg-brand-forest text-brand-ivory' : 'text-brand-forest hover:bg-info-soft'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageToggle;
