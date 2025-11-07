export interface LessonPlanInput {
  teacherName: string;
  subject: string;
  grade: string;
  periods: number;
  template: 'cv1001' | 'cv5512';
}

export interface FileWithPreview extends File {
  preview: string;
}

export interface Activity {
  activityName: string;
  objective: string;
  // For CV1001
  teacherActivity?: string;
  studentActivity?: string;
  // For CV5512
  content?: string;
  product?: string;
  implementation?: string;
}

export interface LessonPlan {
  template: 'cv1001' | 'cv5512';
  subject: string;
  grade: string;
  lessonTitle: string;
  periods: number;
  executionTime: string;
  requiredOutcomes: {
    knowledge?: string; // For CV5512
    generalCompetencies: string;
    specificCompetencies: string;
    qualities: string;
    integratedContent?: string;
  };
  teachingAids: {
    teacher: string;
    student: string;
  };
  teachingActivities: Activity[];
  postLessonAdjustments: string;
}
