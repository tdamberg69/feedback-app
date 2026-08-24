-- Im Neon-Dashboard (SQL Editor), im selben Projekt wie die anderen Apps,
-- ausführen. Neue, eigenständige Tabellen, kein Konflikt mit recipes,
-- hockey_coaches etc.

create table if not exists feedback_topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  link_key text not null unique,
  active boolean not null default true,
  emoji_rating_enabled boolean not null default false,
  emoji_unsure_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

-- Falls die Tabelle schon existiert (bestehende Installation), Spalten nachrüsten:
alter table feedback_topics add column if not exists emoji_rating_enabled boolean not null default false;
alter table feedback_topics add column if not exists emoji_unsure_enabled boolean not null default false;

create table if not exists feedback_entries (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references feedback_topics(id) on delete cascade,
  content text,
  rating text, -- 'up' | 'down' | 'unsure' | NULL
  created_at timestamptz not null default now()
);

-- Falls die Tabelle schon existiert: content darf jetzt leer sein (wenn
-- stattdessen nur eine Emoji-Bewertung abgegeben wurde), rating nachrüsten:
alter table feedback_entries alter column content drop not null;
alter table feedback_entries add column if not exists rating text;

create index if not exists feedback_entries_topic_idx
  on feedback_entries (topic_id);
