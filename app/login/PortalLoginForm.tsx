"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type PortalRole = "STUDENT" | "LECTURER" | "ADMIN";

const portalConfig: Record<PortalRole, { title: string; label: string; placeholder: string; destination: string }> = {
  STUDENT: { title: "Student Portal", label: "Matriculation Number", placeholder: "ABUAD/20/4521", destination: "/student/dashboard" },
  LECTURER: { title: "Lecturer Portal", label: "ABUAD Email", placeholder: "lecturer@abuad.edu.ng", destination: "/lecturer/dashboard" },
  ADMIN: { title: "Admin Portal", label: "Admin Email", placeholder: "admin@abuad.edu.ng", destination: "/admin/dashboard" },
};

export default function PortalLoginForm({ role }: { role: PortalRole }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const config = portalConfig[role];
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session.user.role === role) router.replace(config.destination);
  }, [config.destination, role, router, session?.user?.role, status]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identifier.trim() || !password) { setError(`Enter your ${config.label.toLowerCase()} and password.`); return; }
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      email: identifier.trim(),
      password,
      callbackUrl: config.destination,
      redirect: false,
    });
    if (result?.error) {
      setError(`Invalid ${config.label.toLowerCase()} or password, or this account is not authorized for the ${config.title}.`);
    } else {
      const destination = role === "ADMIN" ? "/admin/dashboard" : role === "LECTURER" ? "/lecturer/dashboard" : "/student/dashboard";
      router.replace(destination);
    }
    setLoading(false);
  }

  return <main className="login-page"><div className="login-photo" aria-hidden="true" /><div className="login-overlay" aria-hidden="true" /><section className="login-card" aria-label={`${config.title} login`}><div className="brand"><div className="crest">A</div><div><strong>ABUAD</strong><span>Attendance Management System</span></div></div><div className="login-heading"><p className="eyebrow">{config.title.toUpperCase()}</p><h1>{config.title}</h1><p>College of Medicine &amp; Health Sciences</p></div><form onSubmit={submit} noValidate><label htmlFor="identifier">{config.label}</label><input id="identifier" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={config.placeholder} autoComplete="username" /><label htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />{error && <p className="form-error" role="alert">{error}</p>}<button className="login-button" type="submit" disabled={loading}>{loading ? "Signing in..." : "Login"}</button></form></section></main>;
}
