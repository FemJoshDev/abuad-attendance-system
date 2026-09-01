export type CourseStatus = "Good standing" | "Watch closely";

export type CourseSummary = {
  id: string;
  code: string;
  title: string;
  description: string;
  lecturer: string;
  learners: number;
  resources: number;
  updated: string;
  present: number;
  total: number;
  status: CourseStatus;
  unit?: number;
  semester?: string;
  academicSession?: string;
};

export type CourseApiResponse = {
  success: boolean;
  data: CourseSummary[];
  error?: string;
};
