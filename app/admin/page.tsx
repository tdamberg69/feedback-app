"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  LogOut,
  Plus,
  Trash2,
  Pencil,
  Copy,
  MessageSquareText,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

type Topic = {
  id: string;
  title: string;
  description: string | null;
  link_key: string;
  active: boolean;
  created_at: string;
  feedback_count: number;
};

type FeedbackEntry = {
  id: string;
  topic_id: string;
  content: string;
  created_at: string;
};

function formatDateTimeDE(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Anfrage fehlgeschlagen (${res.status})`);
  }
  return res.json();
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [addingTopic, setAddingTopic] = useState(false);
  const [addTopicError, setAddTopicError] = useState<string | null>(null);

  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingTopic, setSavingTopic] = useState(false);

  const [confirmDeleteTopicId, setConfirmDeleteTopicId] = useState<string | null>(
    null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [confirmDeleteFeedbackId, setConfirmDeleteFeedbackId] = useState<
    string | null
  >(null);

  async function checkAuth() {
    try {
      await apiFetch("/api/admin/topics");
      setAuthed(true);
    } catch {
      setAuthed(false);
    }
  }
  useEffect(() => {
    checkAuth();
  }, []);

  async function fetchTopics() {
    try {
      const data = await apiFetch("/api/admin/topics");
      setTopics(data ?? []);
      setTopicsError(null);
    } catch (err: any) {
      setTopicsError(err.message);
    }
  }
  useEffect(() => {
    if (authed) fetchTopics();
  }, [authed]);

  async function fetchFeedback(topicId: string) {
    setLoadingFeedback(true);
    try {
      const data = await apiFetch(`/api/admin/topics/${topicId}/feedback`);
      setFeedbackEntries(data ?? []);
      setFeedbackError(null);
    } catch (err: any) {
      setFeedbackError(err.message);
    }
    setLoadingFeedback(false);
  }

  function selectTopic(id: string) {
    setSelectedTopicId(id);
    setConfirmDeleteFeedbackId(null);
    fetchFeedback(id);
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      await apiFetch("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setAuthed(true);
      setPassword("");
    } catch (err: any) {
      setLoginError(err.message);
    }
    setLoggingIn(false);
  }

  async function logout() {
    await apiFetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
  }

  async function addTopic(e: React.FormEvent) {
    e.preventDefault();
    setAddTopicError(null);
    if (!newTitle.trim()) {
      setAddTopicError("Titel ist ein Pflichtfeld.");
      return;
    }
    setAddingTopic(true);
    try {
      await apiFetch("/api/admin/topics", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
        }),
      });
      setNewTitle("");
      setNewDescription("");
      fetchTopics();
    } catch (err: any) {
      setAddTopicError(err.message);
    }
    setAddingTopic(false);
  }

  function startEditTopic(t: Topic) {
    setEditingTopicId(t.id);
    setEditTitle(t.title);
    setEditDescription(t.description ?? "");
  }

  async function saveEditTopic(id: string) {
    if (!editTitle.trim()) return;
    setSavingTopic(true);
    try {
      await apiFetch(`/api/admin/topics/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
        }),
      });
      setEditingTopicId(null);
      fetchTopics();
    } catch (err: any) {
      setTopicsError(err.message);
    }
    setSavingTopic(false);
  }

  async function toggleActive(t: Topic) {
    try {
      await apiFetch(`/api/admin/topics/${t.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !t.active }),
      });
      fetchTopics();
    } catch (err: any) {
      setTopicsError(err.message);
    }
  }

  async function deleteTopic(id: string) {
    setConfirmDeleteTopicId(null);
    try {
      await apiFetch(`/api/admin/topics/${id}`, { method: "DELETE" });
      if (selectedTopicId === id) {
        setSelectedTopicId(null);
        setFeedbackEntries([]);
      }
      fetchTopics();
    } catch (err: any) {
      setTopicsError(err.message);
    }
  }

  async function deleteFeedback(id: string) {
    setConfirmDeleteFeedbackId(null);
    try {
      await apiFetch(`/api/admin/feedback/${id}`, { method: "DELETE" });
      if (selectedTopicId) fetchFeedback(selectedTopicId);
      fetchTopics();
    } catch (err: any) {
      setFeedbackError(err.message);
    }
  }

  function copyLink(linkKey: string, id: string) {
    const url = `${window.location.origin}/f/${linkKey}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  const selectedTopic = topics.find((t) => t.id === selectedTopicId) ?? null;

  if (authed === null) {
    return (
      <main className="min-h-screen flex items-center justify-center text-ink/50">
        Lade…
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-5">
        <div className="max-w-sm w-full bg-white border border-plum-100 rounded-card p-6 animate-fade-in-up">
          <div className="flex items-center gap-2 text-plum-700 mb-4">
            <ShieldCheck size={20} />
            <h1 className="font-display text-2xl font-semibold">Admin-Login</h1>
          </div>
          <form onSubmit={login} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              autoFocus
              className="w-full rounded-card border border-plum-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plum-500"
            />
            {loginError && <p className="text-xs text-alert">{loginError}</p>}
            <button
              type="submit"
              disabled={loggingIn || !password}
              className="w-full rounded-card bg-plum-700 text-white text-sm font-medium py-2 hover:bg-plum-900 disabled:opacity-40"
            >
              {loggingIn ? "Prüfe…" : "Einloggen"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-4 sm:px-5 py-8 md:py-14 animate-fade-in">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest uppercase text-plum-500 mb-1">
            Feedback-App
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold leading-tight">
            Admin
          </h1>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink hover:bg-plum-100 border border-plum-300 rounded-card px-3 py-1.5"
        >
          <LogOut size={15} /> Logout
        </button>
      </header>

      <div className="grid md:grid-cols-[320px_1fr] gap-6 md:gap-8">
        {/* Themen-Liste + Neues Thema */}
        <aside className="space-y-6">
          <section className="bg-plum-50 border border-plum-100 rounded-card p-4">
            <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-1.5">
              <Plus size={17} /> Neues Thema
            </h2>
            <form onSubmit={addTopic} className="space-y-2.5">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Titel"
                className="w-full rounded-card border border-plum-300 bg-white px-3 py-2 text-sm"
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Beschreibung (optional)"
                rows={3}
                className="w-full rounded-card border border-plum-300 bg-white px-3 py-2 text-sm"
              />
              {addTopicError && (
                <p className="text-xs text-alert">{addTopicError}</p>
              )}
              <button
                type="submit"
                disabled={addingTopic}
                className="w-full rounded-card bg-plum-700 text-white text-sm font-medium py-2 hover:bg-plum-900 disabled:opacity-40"
              >
                {addingTopic ? "Anlegen…" : "Thema anlegen"}
              </button>
            </form>
          </section>

          {topicsError && <p className="text-sm text-alert">{topicsError}</p>}

          <ul className="space-y-2">
            {topics.map((t, idx) => (
              <li
                key={t.id}
                style={{ animationDelay: `${Math.min(idx, 12) * 40}ms` }}
                className="animate-fade-in-up"
              >
                {editingTopicId === t.id ? (
                  <div className="bg-white border-2 border-plum-500 rounded-card p-3 space-y-2">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-card border border-plum-300 px-2.5 py-1.5 text-sm"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                      className="w-full rounded-card border border-plum-300 px-2.5 py-1.5 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEditTopic(t.id)}
                        disabled={savingTopic}
                        className="rounded-card bg-plum-700 text-white text-xs font-medium px-3 py-1.5 hover:bg-plum-900 disabled:opacity-40"
                      >
                        {savingTopic ? "Speichern…" : "Speichern"}
                      </button>
                      <button
                        onClick={() => setEditingTopicId(null)}
                        className="rounded-card border border-plum-300 text-xs font-medium px-3 py-1.5 hover:bg-plum-100"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => selectTopic(t.id)}
                    className={`card-hover w-full text-left bg-white border rounded-card p-3 ${
                      selectedTopicId === t.id
                        ? "border-plum-500 ring-1 ring-plum-500"
                        : "border-plum-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{t.title}</p>
                      <span
                        className={`shrink-0 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-full ${
                          t.active
                            ? "bg-plum-100 text-plum-700"
                            : "bg-ink/10 text-ink/50"
                        }`}
                      >
                        {t.active ? "Aktiv" : "Inaktiv"}
                      </span>
                    </div>
                    <p className="text-xs text-ink/40 font-mono mt-1">
                      {t.feedback_count} Feedback(s)
                    </p>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </aside>

        {/* Detailansicht */}
        <section>
          {!selectedTopic ? (
            <p className="text-ink/40 text-sm">
              Wähle links ein Thema aus, um Details und Feedbacks zu sehen.
            </p>
          ) : (
            <div className="animate-fade-in-up space-y-6">
              <div className="bg-white border border-plum-100 rounded-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <h2 className="font-display text-2xl font-semibold">
                      {selectedTopic.title}
                    </h2>
                    {selectedTopic.description && (
                      <p className="text-ink/60 text-sm mt-1 whitespace-pre-wrap">
                        {selectedTopic.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => startEditTopic(selectedTopic)}
                    title="Bearbeiten"
                    className="p-2 rounded-full hover:bg-plum-100 text-ink/50 shrink-0"
                  >
                    <Pencil size={16} />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-plum-100">
                  <button
                    onClick={() => toggleActive(selectedTopic)}
                    className="flex items-center gap-1.5 text-sm font-medium"
                  >
                    {selectedTopic.active ? (
                      <>
                        <ToggleRight className="text-plum-700" size={22} />
                        <span className="text-plum-700">Aktiv</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="text-ink/40" size={22} />
                        <span className="text-ink/40">Inaktiv</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => copyLink(selectedTopic.link_key, selectedTopic.id)}
                    className="flex items-center gap-1.5 font-mono text-xs text-ink/50 hover:text-ink border border-plum-300 rounded-card px-2.5 py-1.5"
                  >
                    /f/{selectedTopic.link_key} <Copy size={12} />
                    {copiedId === selectedTopic.id && (
                      <span className="text-plum-700">kopiert!</span>
                    )}
                  </button>

                  <div className="flex-1" />

                  {confirmDeleteTopicId === selectedTopic.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-alert font-medium">
                        Thema inkl. {selectedTopic.feedback_count} Feedback(s)
                        löschen?
                      </span>
                      <button
                        onClick={() => deleteTopic(selectedTopic.id)}
                        className="rounded-card bg-alert text-white text-xs font-medium px-2.5 py-1 hover:bg-alert/80"
                      >
                        Löschen
                      </button>
                      <button
                        onClick={() => setConfirmDeleteTopicId(null)}
                        className="rounded-card border border-plum-300 text-xs font-medium px-2.5 py-1 hover:bg-plum-100"
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteTopicId(selectedTopic.id)}
                      className="flex items-center gap-1.5 text-xs text-alert font-medium hover:bg-alert/10 rounded-card px-2.5 py-1.5"
                    >
                      <Trash2 size={14} /> Thema löschen
                    </button>
                  )}
                </div>
              </div>

              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-plum-500 mb-2 flex items-center gap-1.5">
                  <MessageSquareText size={13} /> Feedbacks (
                  {feedbackEntries.length})
                </p>

                {feedbackError && (
                  <p className="text-sm text-alert mb-2">{feedbackError}</p>
                )}

                {loadingFeedback ? (
                  <p className="text-sm text-ink/50 flex items-center gap-2">
                    <span className="spinner" /> Lade…
                  </p>
                ) : feedbackEntries.length === 0 ? (
                  <p className="text-sm text-ink/40">
                    Noch kein Feedback zu diesem Thema.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {feedbackEntries.map((f, idx) => (
                      <li
                        key={f.id}
                        style={{ animationDelay: `${Math.min(idx, 12) * 40}ms` }}
                        className="card-hover animate-fade-in-up bg-white border border-plum-100 rounded-card p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm whitespace-pre-wrap flex-1">
                            {f.content}
                          </p>
                          {confirmDeleteFeedbackId === f.id ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => deleteFeedback(f.id)}
                                className="rounded-card bg-alert text-white text-xs font-medium px-2 py-1 hover:bg-alert/80"
                              >
                                Löschen
                              </button>
                              <button
                                onClick={() => setConfirmDeleteFeedbackId(null)}
                                className="rounded-card border border-plum-300 text-xs font-medium px-2 py-1 hover:bg-plum-100"
                              >
                                Abbrechen
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteFeedbackId(f.id)}
                              title="Löschen"
                              className="p-1.5 rounded-full hover:bg-alert/10 text-alert shrink-0"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-ink/30 mt-2">
                          {formatDateTimeDE(f.created_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
