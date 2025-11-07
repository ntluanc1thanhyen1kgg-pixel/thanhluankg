
import React, { useState, useCallback, useEffect } from 'react';
import { LessonPlanForm } from './components/LessonPlanForm';
import { LessonPlanDisplay } from './components/LessonPlanDisplay';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useI18n } from './contexts/I18nContext';
import { LessonPlan, LessonPlanInput, FileWithPreview } from './types';
import { generateLessonPlan, validateApiKey } from './services/geminiService';
import { exportToDocx } from './utils/docxGenerator';
import { BrainCircuitIcon } from './components/icons';

const Auth: React.FC<{ onAuthSuccess: (apiKey: string) => void; initialError?: string | null }> = ({ onAuthSuccess, initialError }) => {
  const { t } = useI18n();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);

  const handleValidate = async () => {
    const key = apiKeyInput.trim();
    if (!key) {
      setError(t('apiKeyRequiredError'));
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const isValid = await validateApiKey(key);
      if (isValid) {
        onAuthSuccess(key);
      } else {
        setError(t('apiKeyInvalidError'));
      }
    } catch (err) {
      console.error("Validation error:", err);
      setError(t('apiKeyInvalidError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleValidate();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="text-center bg-white p-8 rounded-lg shadow-2xl max-w-md mx-4 w-full">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 text-white">
          <BrainCircuitIcon />
        </div>
        <h1 className="text-3xl font-extrabold text-blue-900 mt-4">{t('authTitle')}</h1>
        <p className="text-slate-600 text-base mt-2 mb-6">{t('authDescription')}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="sr-only">{t('apiKeyLabel')}</label>
            <input
              id="apiKey"
              name="apiKey"
              type="password"
              autoComplete="off"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 bg-slate-50 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-base"
              placeholder={t('apiKeyPlaceholder')}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : t('authButton')}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-4">
          {t('authBillingInfoPre')}{' '}
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
            {t('authBillingInfoLink')}
          </a>
        </p>
      </div>
    </div>
  );
};


export default function App() {
  const [lessonPlan, setLessonPlan] = useState<LessonPlan[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const { t, locale } = useI18n();

  useEffect(() => {
    // Check for a saved API key in local storage on initial load
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    setIsInitializing(false);
  }, []);

  const handleGeneratePlan = useCallback(async (data: LessonPlanInput, files: FileWithPreview[]) => {
    if (!apiKey) {
        setLoginError(t('apiKeyError'));
        return;
    }
    setIsLoading(true);
    setError(null);
    setLessonPlan(null);
    try {
      const result = await generateLessonPlan(data, files, locale, apiKey);
      setLessonPlan(result);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        if (err.message === "API_KEY_INVALID") {
          // The stored key is now invalid, force re-login
          setApiKey(null);
          localStorage.removeItem('gemini_api_key');
          setLoginError(t('apiKeyError'));
        } else {
          setError(err.message);
        }
      } else {
        setError(t('unexpectedError'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, locale, t]);

  const handleLogout = useCallback(() => {
    setApiKey(null);
    localStorage.removeItem('gemini_api_key');
    setLessonPlan(null);
    setError(null);
    setLoginError(null);
  }, []);

  const handleReset = useCallback(() => {
    setLessonPlan(null);
    setError(null);
  }, []);
  
  const handleAuthSuccess = useCallback((newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem('gemini_api_key', newApiKey);
    setLoginError(null);
  }, []);

  // FIX: Define the handleDownload function to be passed to the LessonPlanDisplay component.
  const handleDownload = useCallback(async () => {
    if (lessonPlan) {
      await exportToDocx(lessonPlan, t);
    }
  }, [lessonPlan, t]);
  
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
      </div>
    );
  }

  if (!apiKey) {
    return <Auth onAuthSuccess={handleAuthSuccess} initialError={loginError} />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-10 border-b border-slate-200">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
           <div>
            <h1 className="text-3xl font-bold text-blue-900 leading-tight">
              {t('headerTitle')}
            </h1>
            <p className="text-base text-slate-600">{t('headerSubtitle')}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={handleLogout} className="px-4 py-2 text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 border border-blue-500 text-blue-600 hover:bg-blue-50">
              {t('logoutButton')}
            </button>
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="lg:sticky lg:top-28 self-start">
            <LessonPlanForm onSubmit={handleGeneratePlan} isLoading={isLoading} onReset={handleReset} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg min-h-[600px]">
            <LessonPlanDisplay
              lessonPlan={lessonPlan}
              isLoading={isLoading}
              error={error}
              onDownload={handleDownload}
            />
          </div>
        </div>
      </main>
       <footer className="text-center py-4 text-sm text-slate-500">
        <p>{t('footerText')}</p>
      </footer>
    </div>
  );
}