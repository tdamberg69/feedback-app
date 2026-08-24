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
  created_at: string;
};

export type FeedbackEntry = {
  id: string;
  topic_id: string;
  content: string;
  created_at: string;
};
