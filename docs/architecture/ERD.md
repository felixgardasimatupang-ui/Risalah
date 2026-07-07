# Database Architecture — ERD

## Entity Relationship Overview

```
organizations 1───N users
organizations 1───N meetings
organizations 1───N organization_members
users 1───N organization_members
users 1───N meetings (as organizer)
meetings 1───N participants
meetings 1───1 transcripts
meetings 1───1 summaries
meetings 1───N audio_files
meetings 1───N minutes
transcripts 1───N transcript_lines
summaries 1───N key_points
summaries 1───N action_items
summaries 1───N decisions
action_items N───1 users (as assignee)
```

## Tables

### organizations
```sql
CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(100) UNIQUE NOT NULL,
  type            VARCHAR(50) NOT NULL, -- 'kementerian','pemda','dprd','bumn','universitas'
  logo_url        TEXT,
  address         TEXT,
  phone           VARCHAR(50),
  email           VARCHAR(255),
  settings        JSONB DEFAULT '{}',
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### users
```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  full_name       VARCHAR(255) NOT NULL,
  nip             VARCHAR(50), -- Nomor Induk Pegawai
  position        VARCHAR(255),
  phone           VARCHAR(50),
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### organization_members
```sql
CREATE TABLE organization_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            VARCHAR(50) NOT NULL DEFAULT 'member', -- 'admin','member','viewer'
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);
```

### meetings
```sql
CREATE TABLE meetings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  date            TIMESTAMPTZ NOT NULL,
  status          VARCHAR(50) NOT NULL DEFAULT 'scheduled', -- 'scheduled','in_progress','completed','cancelled'
  duration_minutes INTEGER DEFAULT 0,
  location        VARCHAR(500),
  meeting_type    VARCHAR(100), -- 'koordinasi','evaluasi','sosialisasi','bimtek',etc
  organizer_id    UUID REFERENCES users(id),
  tags            TEXT[],
  metadata        JSONB DEFAULT '{}',
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meetings_org_date ON meetings(organization_id, date DESC);
CREATE INDEX idx_meetings_status ON meetings(status);
```

### participants
```sql
CREATE TABLE participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id      UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  name            VARCHAR(255) NOT NULL,
  role            VARCHAR(255),
  is_external     BOOLEAN DEFAULT false,
  attendance      VARCHAR(50) DEFAULT 'present', -- 'present','late','excused','absent'
  joined_at       TIMESTAMPTZ,
  left_at         TIMESTAMPTZ,
  UNIQUE(meeting_id, user_id)
);
```

### audio_files
```sql
CREATE TABLE audio_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id      UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  filename        VARCHAR(500) NOT NULL,
  file_size       BIGINT NOT NULL, -- bytes
  duration_seconds INTEGER,
  format          VARCHAR(50) NOT NULL, -- 'mp3','wav','m4a','ogg','webm'
  storage_path    TEXT NOT NULL,
  status          VARCHAR(50) DEFAULT 'uploading', -- 'uploading','processing','completed','failed'
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### transcripts
```sql
CREATE TABLE transcripts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id      UUID UNIQUE NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  status          VARCHAR(50) DEFAULT 'processing', -- 'processing','completed','failed'
  total_lines     INTEGER DEFAULT 0,
  total_duration_ms BIGINT DEFAULT 0,
  confidence_avg  FLOAT DEFAULT 0,
  language        VARCHAR(10) DEFAULT 'id',
  error_message   TEXT,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### transcript_lines
```sql
CREATE TABLE transcript_lines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id   UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  speaker_name    VARCHAR(255) NOT NULL,
  speaker_id      UUID REFERENCES participants(id),
  text            TEXT NOT NULL,
  timestamp_ms    BIGINT NOT NULL,
  end_timestamp_ms BIGINT,
  confidence      FLOAT DEFAULT 0,
  is_edited       BOOLEAN DEFAULT false,
  edited_text     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tlines_transcript ON transcript_lines(transcript_id, timestamp_ms);
```

### summaries
```sql
CREATE TABLE summaries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id      UUID UNIQUE NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  status          VARCHAR(50) DEFAULT 'processing', -- 'processing','completed','failed'
  model_used      VARCHAR(100),
  error_message   TEXT,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### key_points
```sql
CREATE TABLE key_points (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id      UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  category        VARCHAR(255),
  relevance_score FLOAT DEFAULT 0,
  sort_order      INTEGER DEFAULT 0
);
```

### action_items
```sql
CREATE TABLE action_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id      UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  assignee_id     UUID REFERENCES users(id),
  due_date        DATE,
  status          VARCHAR(50) DEFAULT 'pending', -- 'pending','in_progress','completed','cancelled'
  priority        VARCHAR(20) DEFAULT 'medium', -- 'low','medium','high'
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### decisions
```sql
CREATE TABLE decisions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id      UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  decision_date   DATE,
  category        VARCHAR(255),
  is_approved     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### minutes
```sql
CREATE TABLE minutes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id      UUID UNIQUE NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  content         JSONB NOT NULL DEFAULT '{}',
  status          VARCHAR(50) DEFAULT 'draft', -- 'draft','review','approved','archived'
  template_type   VARCHAR(50) DEFAULT 'government', -- 'dprd','government','kabupaten','bumn',etc
  approved_by     UUID REFERENCES users(id),
  approved_at     TIMESTAMPTZ,
  version         INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### chat_sessions (AI Chat / RAG)
```sql
CREATE TABLE chat_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id      UUID REFERENCES meetings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(500),
  context_type    VARCHAR(50) DEFAULT 'meeting', -- 'meeting','all','organization'
  context_id      UUID,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### chat_messages
```sql
CREATE TABLE chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role            VARCHAR(20) NOT NULL, -- 'user','assistant','system'
  content         TEXT NOT NULL,
  citations       JSONB DEFAULT '[]'::jsonb, -- [{source, text, score}]
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### export_logs
```sql
CREATE TABLE export_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id      UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  format          VARCHAR(50) NOT NULL, -- 'pdf','docx','txt','json'
  file_path       TEXT,
  file_size       BIGINT,
  status          VARCHAR(50) DEFAULT 'processing',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

## Indexes Summary

```sql
-- Performance indexes
CREATE INDEX idx_meetings_org_status ON meetings(organization_id, status);
CREATE INDEX idx_meetings_date ON meetings(date DESC);
CREATE INDEX idx_transcript_lines_speaker ON transcript_lines(speaker_name);
CREATE INDEX idx_action_items_assignee ON action_items(assignee_id, status);
CREATE INDEX idx_action_items_due ON action_items(due_date) WHERE status != 'completed';
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id, is_active);
CREATE INDEX idx_export_logs_meeting ON export_logs(meeting_id);

-- Full-text search
CREATE INDEX idx_meetings_title_search ON meetings USING GIN(to_tsvector('indonesian', title));
CREATE INDEX idx_transcript_lines_text_search ON transcript_lines USING GIN(to_tsvector('indonesian', text));

-- Vector search (PGVector)
-- CREATE INDEX idx_meetings_embedding ON meetings USING ivfflat (embedding vector_cosine_ops);
-- CREATE INDEX idx_transcript_lines_embedding ON transcript_lines USING ivfflat (embedding vector_cosine_ops);
```
