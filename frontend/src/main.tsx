import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { PracticeProvider } from './context/PracticeContext';
import { LanguageProvider } from './context/LanguageContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <PracticeProvider>
          <App />
        </PracticeProvider>
      </LanguageProvider>
    </AuthProvider>
  </StrictMode>
);
