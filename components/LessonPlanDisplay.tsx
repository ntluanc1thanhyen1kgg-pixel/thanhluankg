
import React from 'react';
import type { LessonPlan } from '../types';
import { DownloadIcon, BrainCircuitIcon } from './icons';
import { useI18n } from '../contexts/I18nContext';

interface LessonPlanDisplayProps {
  lessonPlan: LessonPlan[] | null;
  isLoading: boolean;
  error: string | null;
  onDownload: () => void;
}

const ActivityDisplay: React.FC<{ activities: LessonPlan['teachingActivities'], template: LessonPlan['template'], t: (key: string) => string }> = ({ activities, template, t }) => {
  if (template === 'cv5512') {
    return (
      <div className="space-y-6">
        {activities.map((activity, index) => (
          <div key={index} className="border border-slate-200 p-4 rounded-md bg-slate-50/50">
            <p className="font-bold text-blue-700">{activity.activityName}</p>
            <p className="mt-2 text-slate-600"><b>{t('objective')}</b> {activity.objective}</p>
            <div className="mt-3">
              <p className="font-semibold text-slate-800">{t('content')}</p>
              <div className="whitespace-pre-wrap pl-4 text-slate-700">{activity.content}</div>
            </div>
            <div className="mt-3">
              <p className="font-semibold text-slate-800">{t('product')}</p>
              <div className="whitespace-pre-wrap pl-4 text-slate-700">{activity.product}</div>
            </div>
            <div className="mt-3">
              <p className="font-semibold text-slate-800">{t('implementation')}</p>
              <div className="whitespace-pre-wrap pl-4 text-slate-700">{activity.implementation}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Fallback to CV1001 table style
  return (
    <table className="min-w-full border-collapse border border-slate-300">
      <thead className="bg-slate-50">
        <tr>
          <th className="font-bold border border-slate-300 p-4 text-left text-blue-800">{t('teacherActivityHeader')}</th>
          <th className="font-bold border border-slate-300 p-4 text-left text-blue-800">{t('studentActivityHeader')}</th>
        </tr>
      </thead>
      <tbody>
        {activities.map((activity, index) => (
          <React.Fragment key={index}>
            <tr className="bg-transparent">
               <td colSpan={2} className="border border-slate-300 p-4">
                <p className="font-bold text-blue-700">{activity.activityName}</p>
                <p className="italic mt-1 text-slate-600"><b>{t('objective')}</b> {activity.objective}</p>
              </td>
            </tr>
            <tr>
                <td className="border border-slate-300 p-4 align-top whitespace-pre-wrap">
                    <p className="font-bold">{t('teachingMethod')}</p>
                    {activity.teacherActivity}
                </td>
                <td className="border border-slate-300 p-4 align-top whitespace-pre-wrap">
                    {activity.studentActivity}
                </td>
            </tr>
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
};


export const LessonPlanDisplay: React.FC<LessonPlanDisplayProps> = ({ lessonPlan, isLoading, error, onDownload }) => {
  const { t } = useI18n();
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-semibold text-slate-800">{t('loadingMessage')}</p>
          <p className="text-slate-600">{t('loadingSubMessage')}</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-red-600">
           <p className="text-lg font-semibold">{t('errorMessage')}</p>
           <p className="text-sm">{error}</p>
        </div>
      );
    }
    if (!lessonPlan) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
          <BrainCircuitIcon />
          <h3 className="mt-2 text-lg font-medium text-slate-800">{t('emptyStateTitle')}</h3>
          <p className="mt-1 text-base text-slate-600">{t('emptyStateSubtitle')}</p>
        </div>
      );
    }

    const planTitle = lessonPlan[0].template === 'cv5512' ? t('teachingPlanTitle') : t('lessonPlanTitle');

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-blue-900">{t('previewTitle')}</h2>
          <button onClick={onDownload} className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            <DownloadIcon />
            <span className="ml-2">{t('downloadButton')}</span>
          </button>
        </div>
        {lessonPlan.map((plan, index) => (
          <div key={index} className="prose prose-base max-w-none font-times text-[13pt] leading-relaxed text-slate-700 mb-12 last:mb-0 border-b-2 border-slate-200 pb-8 last:border-b-0 last:pb-0">
            <h1 className="text-center font-bold text-blue-900">{planTitle} ({t('period')} {index + 1})</h1>
            <p className="text-center"><b>{t('subject')}:</b> {plan.subject}; <b>{t('grade')}:</b> {plan.grade}</p>
            <p className="text-center"><b>{t('lessonTitleLabel')}:</b> {plan.lessonTitle}; <b>{t('periods')}:</b> {plan.periods}</p>
            <p className="text-center"><b>{t('executionTime')}:</b> {plan.executionTime}</p>
            
            <h2 className="font-bold text-blue-800">{t('requiredOutcomes')}</h2>
            {plan.template === 'cv5512' && plan.requiredOutcomes.knowledge && <p><b>{t('knowledge')}</b> {plan.requiredOutcomes.knowledge}</p>}
            <p><b>{plan.template === 'cv5512' ? t('competencies') : t('generalCompetencies')}</b> {plan.requiredOutcomes.generalCompetencies}</p>
            {plan.template !== 'cv5512' && <p><b>{t('specificCompetencies')}</b> {plan.requiredOutcomes.specificCompetencies}</p>}
            <p><b>{t('qualities')}</b> {plan.requiredOutcomes.qualities}</p>
            {plan.requiredOutcomes.integratedContent && <p><b>{t('integratedContent')}</b> {plan.requiredOutcomes.integratedContent}</p>}


            <h2 className="font-bold text-blue-800">{t('teachingAids')}</h2>
            <p><b>{t('teacherAids')}</b> {plan.teachingAids.teacher}</p>
            <p><b>{t('studentAids')}</b> {plan.teachingAids.student}</p>

            <h2 className="font-bold text-blue-800">{t('teachingActivities')}</h2>
            <ActivityDisplay activities={plan.teachingActivities} template={plan.template} t={t} />
            
            <h2 className="font-bold text-blue-800">{t('postLessonAdjustments')}</h2>
            <div className="space-y-6 mt-4">
              <div className="border-b-2 border-dotted border-slate-300"></div>
              <div className="border-b-2 border-dotted border-slate-300"></div>
              <div className="border-b-2 border-dotted border-slate-300"></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return <div className="h-full">{renderContent()}</div>;
};
