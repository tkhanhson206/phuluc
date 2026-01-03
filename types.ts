
export enum AppendixType {
  PHU_LUC_I = 'PHU_LUC_I',
  PHU_LUC_III = 'PHU_LUC_III'
}

export interface GenerationConfig {
  appendixType: AppendixType;
  inputData: string;
  gradeLevel: string;
  schoolName: string;
  departmentName: string;
  teacherName: string;
  subjectName: string;
  academicYear: string;
  selectedIntegrations: string[];
  textbookSeries: string;
}

export interface GeneratedContent {
  title: string;
  html: string;
}
