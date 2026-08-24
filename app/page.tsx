import Link from "next/link";
import { ShieldCheck, MessageSquareText } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <div className="max-w-md text-center animate-fade-in-up">
        <MessageSquareText className="mx-auto mb-4 text-plum-500" size={32} />
        <h1 className="font-display text-4xl font-semibold mb-3">Feedback</h1>
        <p className="text-ink/70 mb-8">
          Diese App wird über einen persönlichen Feedback-Link genutzt, den du
          erhalten hast. Ohne diesen Link gibt es hier nichts zu sehen.
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-plum-500 hover:text-plum-700 underline"
        >
          <ShieldCheck size={15} /> Admin-Login
        </Link>
      </div>
    </main>
  );
}
