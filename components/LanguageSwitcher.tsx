
import React from 'react';
import { useI18n } from '../contexts/I18nContext';

export const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale, t } = useI18n();

  const buttonStyle = (lang: 'vi' | 'en') => 
    `px-3 py-1 text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
      locale === lang 
        ? 'bg-blue-600 text-white' 
        : 'bg-white text-blue-700 hover:bg-blue-100 border border-slate-300'
    }`;

  return (
    <div className="flex items-center space-x-2">
      <button onClick={() => setLocale('vi')} className={buttonStyle('vi')}>
        {t('vietnamese')}
      </button>
      <button onClick={() => setLocale('en')} className={buttonStyle('en')}>
        {t('english')}
      </button>
    </div>
  );
};