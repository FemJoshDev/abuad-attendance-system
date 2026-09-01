"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`}>
      <div className="crest">A</div>
      <div>
        <strong>ABUAD</strong>
        <span>{compact ? "Attendance" : "Attendance Management System"}</span>
      </div>
    </div>
  );
}

function Icon({ name }: { name: "eye" | "eye-off" }) {
  const icons: Record<string, string> = { eye: "◉", "eye-off": "⊘" };
  return <span aria-hidden="true">{icons[name]}</span>;
}

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/student/dashboard");
    }
  }, [router, status]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Enter your email or matric number and password to continue.");
      return;
    }

    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/student/dashboard");
    }

    setLoading(false);
  }

  return (
    <main className="login-page">
      <div className="login-photo" aria-hidden="true" />
      <div className="login-overlay" aria-hidden="true" />
      <section className="login-card" aria-label="Student login">
        <Brand />
        <div className="login-heading">
          <p className="eyebrow">STUDENT PORTAL</p>
          <h1>ABUAD Attendance<br />Management System</h1>
          <p>College of Medicine &amp; Health Sciences</p>
        </div>
        <form onSubmit={submit} noValidate>
          <label htmlFor="email">Email or Matric Number</label>
          <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. joshua.ojo@abuad.edu.ng or ABUAD/20/4521" autoComplete="username" />

          <label htmlFor="password">Password</label>
          <div className="password-field">
            <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" />
            <button type="button" className="input-action" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
              <Icon name={showPassword ? "eye-off" : "eye"} />
            </button>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>

          <button type="button" className="forgot" onClick={() => setError("Please contact your college administrator to reset your password.")}>
            Forgot password?
          </button>
        </form>

        <div className="login-footer">
          <p>
            Developed by <strong>OJO JOSHUA OLUWAPELUMI</strong>
            <span className="developer-nickname">PilotDev✈️ @2026</span>
          </p>
          <p>
            Courtesy of the Dean,
            <br />
            College of Medicine &amp; Health Sciences
          </p>
        </div>
      </section>
    </main>
  );
}
