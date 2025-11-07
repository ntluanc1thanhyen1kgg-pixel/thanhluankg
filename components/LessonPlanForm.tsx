
import React, { useState, useCallback } from 'react';
import type { LessonPlanInput, FileWithPreview } from '../types';
import { UploadIcon, FileIcon, XIcon, RefreshCwIcon } from './icons';
import { useI18n } from '../contexts/I18nContext';

interface LessonPlanFormProps {
  onSubmit: (data: LessonPlanInput, files: FileWithPreview[]) => void;
  isLoading: boolean;
  onReset: () => void;
}

const initialFormData: LessonPlanInput = {
  teacherName: '',
  subject: '',
  grade: '',
  periods: 1,
  template: 'cv1001',
};

const subjectsByLevel = {
  "Cấp 1 (Tiểu học)": [
    "Tiếng Việt",
    "Toán",
    "Đạo đức",
    "Tự nhiên và Xã hội",
    "Lịch sử và Địa lí",
    "Khoa học",
    "Tin học",
    "Công nghệ",
    "Âm nhạc",
    "Mĩ thuật",
    "Giáo dục thể chất",
    "Hoạt động trải nghiệm",
    "Ngoại ngữ (Tiếng Anh)",
  ],
  "Cấp 2 (THCS)": [
    "Ngữ văn",
    "Toán",
    "Ngoại ngữ (Tiếng Anh)",
    "Giáo dục công dân",
    "Lịch sử và Địa lí",
    "Khoa học tự nhiên (Vật lí, Hóa học, Sinh học)",
    "Công nghệ",
    "Tin học",
    "Âm nhạc và Mĩ thuật",
    "Giáo dục thể chất",
    "Hoạt động trải nghiệm, hướng nghiệp",
  ],
  "Cấp 3 (THPT)": [
    "Ngữ văn",
    "Toán",
    "Ngoại ngữ (Tiếng Anh)",
    "Giáo dục thể chất",
    "Giáo dục quốc phòng và an ninh",
    "Hoạt động trải nghiệm, hướng nghiệp",
    "Nội dung giáo dục của địa phương",
    "Vật lí",
    "Hóa học",
    "Sinh học",
    "Lịch sử",
    "Địa lí",
    "Giáo dục kinh tế và pháp luật",
    "Công nghệ",
    "Tin học",
  ],
};

const gradesByLevel = {
  "Cấp 1 (Tiểu học)": ["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"],
  "Cấp 2 (THCS)": ["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9"],
  "Cấp 3 (THPT)": ["Lớp 10", "Lớp 11", "Lớp 12"],
};


export const LessonPlanForm: React.FC<LessonPlanFormProps> = ({ onSubmit, isLoading, onReset }) => {
  const [formData, setFormData] = useState<LessonPlanInput>(initialFormData);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const { t } = useI18n();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isNumberInput = (e.target as HTMLInputElement).type === 'number';
    setFormData(prev => ({ 
      ...prev, 
      [name]: isNumberInput ? parseInt(value, 10) || 1 : value 
    }));
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
        .filter((file: File) => ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type))
        .map((file: File) => Object.assign(file, {
          preview: URL.createObjectURL(file)
        }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, []);
  
  const removeFile = useCallback((fileName: string) => {
    setFiles(prev => prev.filter(file => file.name !== fileName));
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData, files);
  };

  const handleFormReset = useCallback(() => {
    setFormData(initialFormData);
    setFiles([]);
    onReset();
  }, [onReset]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-2xl font-semibold text-blue-900">{t('formTitle')}</h2>
        
        <div>
          <label htmlFor="template" className="block text-base font-medium text-blue-800">{t('templateLabel')}</label>
          <select name="template" id="template" value={formData.template} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base">
            <option value="cv1001">{t('templateOption1001')}</option>
            <option value="cv5512">{t('templateOption5512')}</option>
          </select>
        </div>

        <div>
          <label htmlFor="teacherName" className="block text-base font-medium text-blue-800">{t('teacherNameLabel')}</label>
          <input type="text" name="teacherName" id="teacherName" value={formData.teacherName} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base"/>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="subject" className="block text-base font-medium text-blue-800">{t('subjectLabel')}</label>
            <select name="subject" id="subject" value={formData.subject} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base">
                <option value="" disabled>{t('selectSubjectPlaceholder')}</option>
                 {Object.entries(subjectsByLevel).map(([group, subjectsList]) => (
                    <optgroup label={group} key={group}>
                        {subjectsList.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </optgroup>
                ))}
            </select>
          </div>
          <div>
            <label htmlFor="grade" className="block text-base font-medium text-blue-800">{t('gradeLabel')}</label>
             <select name="grade" id="grade" value={formData.grade} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base">
                <option value="" disabled>{t('selectGradePlaceholder')}</option>
                 {Object.entries(gradesByLevel).map(([group, gradesList]) => (
                    <optgroup label={group} key={group}>
                        {gradesList.map(grade => (
                            <option key={grade} value={grade}>{grade}</option>
                        ))}
                    </optgroup>
                ))}
            </select>
          </div>
        </div>
        
        <div>
          <label htmlFor="periods" className="block text-base font-medium text-blue-800">{t('periodsLabel')}</label>
          <input 
              type="number" 
              name="periods" 
              id="periods" 
              value={formData.periods} 
              onChange={handleChange} 
              required 
              min="1" 
              max="10" 
              className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base"
          />
        </div>
        
        <div>
          <label className="block text-base font-medium text-blue-800">{t('fileSupportLabel')}</label>
           <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <UploadIcon />
              <div className="flex text-base text-slate-600">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <span>{t('uploadButton')}</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
                </label>
                <p className="pl-1">{t('dragAndDrop')}</p>
              </div>
              <p className="text-xs text-slate-500">{t('fileTypes')}</p>
            </div>
          </div>
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map(file => (
                <div key={file.name} className="flex items-center justify-between bg-slate-100 p-2 rounded-md">
                   <div className="flex items-center space-x-2">
                    <FileIcon />
                    <span className="text-sm text-slate-800 truncate">{file.name}</span>
                  </div>
                   <button type="button" onClick={() => removeFile(file.name)} className="text-slate-500 hover:text-slate-800">
                     <XIcon />
                   </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <button type="submit" disabled={isLoading} className="flex-grow w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed">
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : t('generateButton')}
          </button>
           <button
              type="button"
              onClick={handleFormReset}
              disabled={isLoading}
              className="flex-shrink-0 p-3 border border-slate-300 rounded-md shadow-sm text-base font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              aria-label={t('resetFormLabel')}
            >
              <RefreshCwIcon />
            </button>
        </div>
      </form>
    </div>
  );
};
