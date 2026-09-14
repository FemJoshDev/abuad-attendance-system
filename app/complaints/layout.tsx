import type { ReactNode } from "react";

import StudentLayout from "../student/layout";

export default function ComplaintsLayout({ children }: { children: ReactNode }) {
  return <StudentLayout>{children}</StudentLayout>;
}
