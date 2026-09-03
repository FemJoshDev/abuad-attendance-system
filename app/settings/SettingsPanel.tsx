"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";
type Profile = { fullName: string; email: string; matricNumber: string | null; role: string };
type Preferences = { emailNotifications: boolean; pushNotifications: boolean; courseNotifications: boolean; systemAnnouncements: boolean; language: string };

const tabs = [{ label: "Profile", path: "/settings" }, { label: "Email", path: "/settings/email" }, { label: "Authentication", path: "/settings/authentication" }, { label: "Preferences", path: "/settings/preferences" }];
const initialPreferences: Preferences = { emailNotifications: true, pushNotifications: true, courseNotifications: true, systemAnnouncements: true, language: "English" };

function EmptyState({ title, text }: { title: string; text: string }) { return <div className="empty-state card"><span className="empty-icon">○</span><h3>{title}</h3><p>{text}</p></div>; }
function SettingsHeading({ title, text }: { title: string; text: string }) { return <div className="card-heading"><h2>{title}</h2><p>{text}</p></div>; }
function Toggle({ label, text, checked, onChange }: { label: string; text: string; checked: boolean; onChange: () => void }) { return <div className="toggle-row"><span>{label}<small>{text}</small></span><button className={`switch ${checked ? "on" : ""}`} type="button" onClick={onChange} aria-label={`Toggle ${label}`}><i /></button></div>; }

export default function SettingsPanel({ path, theme, onThemeChange }: { path: string; theme: Theme; onThemeChange: (theme: Theme) => void }) {
  const active = tabs.find((tab) => tab.path === path) ?? tabs[0];
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [preferences, setPreferences] = useState<Preferences>(initialPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true); setError("");
      try {
        const profileResponse = await fetch("/api/settings/profile");
        if (!profileResponse.ok) throw new Error();
        const profilePayload = await profileResponse.json();
        setProfile(profilePayload.data); setFullName(profilePayload.data.fullName);
        if (active.path === "/settings/preferences") {
          const preferenceResponse = await fetch("/api/settings/preferences");
          if (!preferenceResponse.ok) throw new Error();
          const preferencePayload = await preferenceResponse.json();
          setPreferences({ ...initialPreferences, ...preferencePayload.data });
        }
      } catch { setError("Unable to load your settings right now."); } finally { setLoading(false); }
    }
    load();
  }, [active.path]);

  async function saveProfile() {
    setSaving(true); setSaved(false); setError("");
    try { const response = await fetch("/api/settings/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName }) }); if (!response.ok) throw new Error(); const payload = await response.json(); setProfile(payload.data); setFullName(payload.data.fullName); setSaved(true); } catch { setError("Unable to save your profile right now."); } finally { setSaving(false); }
  }

  async function savePreferences() {
    setSaving(true); setSaved(false); setError("");
    try { const response = await fetch("/api/settings/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(preferences) }); if (!response.ok) throw new Error(); const payload = await response.json(); setPreferences({ ...initialPreferences, ...payload.data }); setSaved(true); } catch { setError("Unable to save your preferences right now."); } finally { setSaving(false); }
  }

  return <div className="prototype-content"><div className="page-intro"><p className="eyebrow">ACCOUNT</p><h2>Settings</h2><p>Manage your profile, notifications, and account preferences.</p></div><div className="settings-layout"><aside className="settings-tabs">{tabs.map((tab) => <button className={active.path === tab.path ? "selected" : ""} key={tab.path} onClick={() => { window.history.pushState({}, "", tab.path); window.dispatchEvent(new PopStateEvent("popstate")); }} type="button">{tab.label}<span>›</span></button>)}</aside><section className="settings-panel card">{loading ? <EmptyState title="Loading settings..." text="Please wait while we load your settings." /> : error && !profile ? <EmptyState title="Unable to load settings" text={error} /> : <>{active.path === "/settings" && profile && <><SettingsHeading title="Profile information" text="Keep your personal details up to date." /><div className="settings-avatar"><div className="avatar avatar-large">{profile.fullName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div><div><strong>{profile.fullName}</strong><p>Profile identity is managed by your account.</p></div></div><div className="settings-form"><label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} /></label><label>Email<input value={profile.email} readOnly /></label><label>Role<input value={profile.role} readOnly /></label><label>Matric number<input value={profile.matricNumber ?? "Not provided"} readOnly /></label></div><button className="primary-button" type="button" onClick={saveProfile} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button></>}{active.path === "/settings/email" && profile && <><SettingsHeading title="Email settings" text="Choose how we keep you informed." /><div className="info-banner"><strong>{profile.email}</strong><span>Verified account email</span></div><p className="form-hint">Email changes require a verified account security flow and are not available here.</p><Toggle label="Email notifications" text="Receive important account updates by email" checked={preferences.emailNotifications} onChange={() => setPreferences({ ...preferences, emailNotifications: !preferences.emailNotifications })} /><Toggle label="Course announcements" text="Get notified when lecturers post updates" checked={preferences.courseNotifications} onChange={() => setPreferences({ ...preferences, courseNotifications: !preferences.courseNotifications })} /><button className="primary-button" type="button" onClick={savePreferences} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button></>}{active.path === "/settings/authentication" && <><SettingsHeading title="Authentication & security" text="Review how your account stays protected." /><div className="security-row"><span>Login method<strong>Username and password</strong></span><span className="verified">Secure</span></div><div className="security-row"><span>Password<strong>Managed through your authenticated account</strong></span></div><p className="form-hint">Active session management and password changes are not enabled by the current authentication service.</p></>}{active.path === "/settings/preferences" && <><SettingsHeading title="Preferences" text="Personalize your experience in the portal." /><Toggle label="Email notifications" text="Receive updates in your inbox" checked={preferences.emailNotifications} onChange={() => setPreferences({ ...preferences, emailNotifications: !preferences.emailNotifications })} /><Toggle label="Push notifications" text="Receive alerts on this device" checked={preferences.pushNotifications} onChange={() => setPreferences({ ...preferences, pushNotifications: !preferences.pushNotifications })} /><Toggle label="Course notifications" text="Stay informed about your courses" checked={preferences.courseNotifications} onChange={() => setPreferences({ ...preferences, courseNotifications: !preferences.courseNotifications })} /><Toggle label="System announcements" text="Hear about platform changes" checked={preferences.systemAnnouncements} onChange={() => setPreferences({ ...preferences, systemAnnouncements: !preferences.systemAnnouncements })} /><label className="select-setting">Language<select value={preferences.language} onChange={(event) => setPreferences({ ...preferences, language: event.target.value })}><option>English</option><option>French</option></select></label><label className="select-setting">Theme<select value={theme} onChange={(event) => onThemeChange(event.target.value as Theme)}><option value="light">Light</option><option value="dark">Dark</option></select></label><button className="primary-button" type="button" onClick={savePreferences} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button></>}{error && profile && <p className="form-error" role="alert">{error}</p>}{saved && <p className="form-success" role="status">Your changes have been saved.</p>}</>}</section></div></div>;
}
