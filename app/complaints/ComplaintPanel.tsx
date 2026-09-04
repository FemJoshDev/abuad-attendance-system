"use client";

import { FormEvent, useEffect, useState } from "react";

type Complaint = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const initialForm = { subject: "", category: "TECHNICAL_ISSUE", priority: "MEDIUM", description: "" };

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state card"><span className="empty-icon">○</span><h3>{title}</h3><p>{text}</p></div>;
}

export default function ComplaintPanel() {
  const [form, setForm] = useState(initialForm);
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function loadComplaints() {
    setLoading(true);
    try {
      const response = await fetch("/api/complaints");
      if (!response.ok) throw new Error();
      const payload = await response.json();
      setItems(payload.data?.complaints ?? []);
      setError("");
    } catch {
      setError("Unable to load your complaints right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const load = window.setTimeout(loadComplaints, 0);
    return () => window.clearTimeout(load);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(false);
    const subject = form.subject.trim();
    const description = form.description.trim();
    if (!subject || subject.length > 200 || !description || description.length > 5000) {
      setError("Enter a subject and description within the allowed limits.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, subject, description }),
      });
      if (!response.ok) throw new Error();
      setForm(initialForm);
      setSuccess(true);
      await loadComplaints();
    } catch {
      setError("Unable to submit your complaint right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="prototype-content"><div className="page-intro"><p className="eyebrow">HELP DESK</p><h2>Complaints &amp; Support</h2><p>Report an issue, submit a complaint, or get help with the platform.</p></div><div className="support-layout"><section className="form-card card"><div className="card-heading"><h2>Submit a Complaint</h2><p>We usually respond within two working days.</p></div><form onSubmit={submit} noValidate><label htmlFor="subject">Complaint subject</label><input id="subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Briefly describe the issue" /><div className="form-row"><div><label htmlFor="category">Category</label><select id="category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="TECHNICAL_ISSUE">Technical Issue</option><option value="COURSE_ISSUE">Course Issue</option><option value="ACCOUNT_ISSUE">Account Issue</option><option value="CONTENT_ISSUE">Content Issue</option><option value="PAYMENT_ISSUE">Payment Issue</option><option value="OTHER">Other</option></select></div><div><label htmlFor="priority">Priority</label><select id="priority" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></div></div><label htmlFor="description">Description</label><textarea id="description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Tell us what happened and how we can help" rows={5} /><label htmlFor="attachment">Attachment <span className="optional">Optional</span></label><input id="attachment" type="file" /><p className="form-hint">PNG, JPG or PDF up to 10 MB</p>{error && <p className="form-error" role="alert">{error}</p>}{success && <p className="form-success" role="status">Complaint submitted successfully. Your support team has been notified.</p>}<button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit Complaint"}</button></form></section><section className="previous-card"><div className="card-heading"><h2>Previous Complaints</h2><p>Track your submitted requests.</p></div><div className="complaint-list">{loading ? <EmptyState title="Loading complaints..." text="Please wait while we load your complaints." /> : error && items.length === 0 ? <EmptyState title="Unable to load complaints" text={error} /> : items.length === 0 ? <EmptyState title="No complaints submitted yet" text="Your submitted requests will appear here." /> : items.map((complaint) => <article className="complaint-item card" key={complaint.id}><div><strong>{complaint.id}</strong><h3>{complaint.subject}</h3><p>{complaint.category} · Created {new Date(complaint.createdAt).toLocaleDateString()} · Updated {new Date(complaint.updatedAt).toLocaleDateString()}</p></div><span className={`status-badge complaint-${complaint.status.toLowerCase().replace("_", "-")}`}>{complaint.status}</span><small>{complaint.priority} priority</small></article>)}</div></section></div></div>;
}
