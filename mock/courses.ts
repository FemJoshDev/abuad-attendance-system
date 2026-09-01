export type Semester = "First Semester" | "Second Semester";

export type Course = {
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
  status: "Good standing" | "Watch closely";
};

export const courses: Record<Semester, Course[]> = {
  "First Semester": [
    { id: "mbbs-501", code: "MBBS 501", title: "Anatomy", description: "Structure of the human body, with emphasis on regional and systemic anatomy.", lecturer: "Dr. O. Williams", learners: 84, resources: 12, updated: "Updated 2 days ago", present: 18, total: 20, status: "Good standing" },
    { id: "mbbs-503", code: "MBBS 503", title: "Physiology", description: "The functions of the human body and the systems that sustain healthy life.", lecturer: "Prof. A. Salami", learners: 84, resources: 10, updated: "Updated yesterday", present: 15, total: 20, status: "Good standing" },
    { id: "mbbs-505", code: "MBBS 505", title: "Biochemistry", description: "Chemical processes in living organisms and their application to medical practice.", lecturer: "Dr. K. Nwachukwu", learners: 84, resources: 9, updated: "Updated 5 days ago", present: 13, total: 21, status: "Watch closely" },
  ],
  "Second Semester": [
    { id: "mbbs-502", code: "MBBS 502", title: "Pathology", description: "The causes and effects of disease, including changes in cells, tissues, and organs.", lecturer: "Dr. E. Ajayi", learners: 84, resources: 11, updated: "Updated 4 days ago", present: 16, total: 18, status: "Good standing" },
    { id: "mbbs-504", code: "MBBS 504", title: "Pharmacology", description: "Drugs, their mechanisms of action, therapeutic uses, and safe clinical application.", lecturer: "Dr. E. Ajayi", learners: 84, resources: 13, updated: "Updated last week", present: 14, total: 18, status: "Good standing" },
    { id: "mbbs-506", code: "MBBS 506", title: "Clinical Medicine", description: "Integrated clinical assessment and management of common medical conditions.", lecturer: "Prof. A. Salami", learners: 84, resources: 8, updated: "Updated 3 days ago", present: 11, total: 17, status: "Watch closely" },
  ],
};