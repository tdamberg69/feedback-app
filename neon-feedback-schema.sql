-- Im Neon-Dashboard (SQL Editor), im selben Projekt wie die anderen Apps,
-- ausführen. Neue, eigenständige Tabellen, kein Konflikt mit recipes,
-- hockey_coaches etc.

create table if not exists feedback_topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  link_key text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists feedback_entries (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references feedback_topics(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists feedback_entries_topic_idx
  on feedback_entries (topic_id);
