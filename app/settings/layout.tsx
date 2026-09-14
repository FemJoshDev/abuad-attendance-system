import type { ReactNode } from "react";

import StudentLayout from "../student/layout";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <StudentLayout>{children}</StudentLayout>;
}
