"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, PauseCircle, Send, CheckCircle2 } from "lucide-react";

type PublicTopic = {
  id: string;
  title: string;
  description: string | null;
  active: boolean;
  emoji_rating_enabled: boolean;
  emoji_unsure_enabled: boolean;
};

type Rating = "up" | "down" | "unsure";

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Anfrage fehlgeschlagen (${res.status})`);
  }
  return body;
}

const RATING_OPTIONS: { value: Rating; emoji: string; label: string }[] = [
  { value: "up", emoji: "👍", label: "Gut" },
  { value: "down", emoji: "👎", label: "Schlecht" },
  { value: "unsure", emoji: "😐", label: "Unsicher" },
];

export default function FeedbackPage() {
  const params = useParams();
  const linkKey = params.linkKey as string;

  const [topic, setTopic] = useState<PublicTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [content, setContent] = useState("");
  const [rating, setRating] = useState<Rating | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await apiFetch(`/api/feedback/${linkKey}`);
        setTopic(data);
        setLoadError(null);
      } catch (err: any) {
        setLoadError(err.message);
      }
      setLoading(false);
    }
    load();
  }, [linkKey]);

  function resetForm() {
    setContent("");
    setRating(null);
    setSubmitted(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !rating) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiFetch(`/api/feedback/${linkKey}`, {
        method: "POST",
        body: JSON.stringify({ content: content.trim() || null, rating }),
      });
      setSubmitted(true);
      setContent("");
      setRating(null);
    } catch (err: any) {
      setSubmitError(err.message);
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center gap-2 text-ink/50">
        <span className="spinner" /> Lade…
      </main>
    );
  }

  if (loadError || !topic) {
    return (
      <main className="min-h-screen flex items-center justify-center px-5">
        <div className="max-w-sm text-center animate-fade-in-up">
          <AlertTriangle className="mx-auto mb-3 text-alert" size={28} />
          <h1 className="font-display text-2xl font-semibold mb-2">
            Ungültiger Link
          </h1>
          <p className="text-ink/60 text-sm">
            Für diesen Link wurde kein Thema gefunden. Bitte prüfe den Link.
          </p>
        </div>
      </main>
    );
  }

  const availableRatings = RATING_OPTIONS.filter(
    (r) => r.value !== "unsure" || topic.emoji_unsure_enabled
  );

  return (
    <main className="min-h-screen max-w-xl mx-auto px-5 py-14 md:py-20 animate-fade-in">
      <header className="mb-8">
        <p className="font-mono text-xs tracking-widest uppercase text-plum-500 mb-2">
          Anonymes Feedback
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold leading-tight mb-3">
          {topic.title}
        </h1>
        {topic.description && (
          <p className="text-ink/70 whitespace-pre-wrap">{topic.description}</p>
        )}
      </header>

      {!topic.active ? (
        <div className="rounded-card border border-plum-100 bg-plum-50 px-5 py-6 text-center animate-fade-in-up">
          <PauseCircle className="mx-auto mb-2 text-plum-500" size={24} />
          <p className="text-ink/70 text-sm">
            Dieses Thema nimmt aktuell kein Feedback entgegen. Versuch es
            gerne später noch einmal.
          </p>
        </div>
      ) : submitted ? (
        <div className="rounded-card border border-plum-100 bg-plum-50 px-5 py-6 text-center animate-fade-in-up">
          <CheckCircle2 className="mx-auto mb-2 text-plum-500" size={24} />
          <p className="text-ink font-medium mb-1">Danke für dein Feedback!</p>
          <p className="text-ink/60 text-sm mb-4">
            Es wurde anonym gespeichert. Du kannst es danach nicht mehr
            einsehen oder ändern.
          </p>
          <button
            onClick={resetForm}
            className="rounded-card border border-plum-300 text-plum-700 text-sm font-medium px-4 py-2 hover:bg-plum-100"
          >
            Weiteres Feedback abgeben
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="animate-fade-in-up">
          {topic.emoji_rating_enabled && (
            <div className="mb-4">
              <p className="text-xs font-medium text-ink/60 mb-2">
                Deine Einschätzung (optional)
              </p>
              <div className="flex gap-2">
                {availableRatings.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() =>
                      setRating((prev) => (prev === r.value ? null : r.value))
                    }
                    className={`flex flex-col items-center gap-1 rounded-card border px-5 py-3 text-2xl ${
                      rating === r.value
                        ? "border-plum-500 bg-plum-100 scale-105"
                        : "border-plum-300 bg-white hover:border-plum-500"
                    }`}
                  >
                    <span>{r.emoji}</span>
                    <span className="text-[10px] font-mono text-ink/50 uppercase">
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="block text-xs font-medium text-ink/60 mb-1">
            {topic.emoji_rating_enabled ? "Feedback (optional)" : "Dein Feedback"}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Dein Feedback…"
            rows={topic.emoji_rating_enabled ? 5 : 8}
            className="w-full rounded-card border border-plum-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-plum-500"
          />
          {submitError && (
            <p className="text-sm text-alert mt-2">{submitError}</p>
          )}
          <button
            type="submit"
            disabled={submitting || (!content.trim() && !rating)}
            className="mt-4 flex items-center gap-2 rounded-card bg-plum-700 text-white text-sm font-semibold px-5 py-2.5 hover:bg-plum-900 hover:shadow-md transition-all disabled:opacity-40"
          >
            <Send size={15} />
            {submitting ? "Wird gesendet…" : "Feedback absenden"}
          </button>
          <p className="text-xs text-ink/40 mt-4">
            Es werden nur dein Text{topic.emoji_rating_enabled ? "/deine Bewertung" : ""} sowie
            Datum und Uhrzeit gespeichert - komplett anonym, ohne weitere
            Angaben zu dir.
          </p>
        </form>
      )}
    </main>
  );
}
