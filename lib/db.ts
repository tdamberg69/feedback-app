import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    "DATABASE_URL fehlt. Bitte in Vercel unter Settings → Environment Variables setzen (siehe README)."
  );
}

export const sql = neon(
  databaseUrl || "postgresql://user:password@host.neon.tech/dbname?sslmode=require"
);

export type Topic = {
  id: string;
  title: string;
  description: string | null;
  link_key: string;
  active: boolean;
  emoji_rating_enabled: boolean;
  emoji_unsure_enabled: boolean;
  created_at: string;
};

export type Rating = "up" | "down" | "unsure";
export const RATING_VALUES: readonly Rating[] = ["up", "down", "unsure"];

export type FeedbackEntry = {
  id: string;
  topic_id: string;
  content: string | null;
  rating: Rating | null;
  created_at: string;
};
