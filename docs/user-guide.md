# User Guide — Risalah SEKNEG AI

Sistem Manajemen Rapat dan Notulen berbasis AI untuk lingkungan Pemerintahan Indonesia.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard Overview](#2-dashboard-overview)
3. [Meetings](#3-meetings)
4. [Live Meeting](#4-live-meeting)
5. [Transcripts](#5-transcripts)
6. [Summary & Minutes](#6-summary--minutes)
7. [AI Chat](#7-ai-chat)
8. [Search](#8-search)
9. [Export](#9-export)
10. [Speaker Insights](#10-speaker-insights)
11. [Notifications](#11-notifications)
12. [Settings](#12-settings)

---

## 1. Getting Started

### Login

1. Navigate to the application URL
2. Enter your `@sekneg.go.id` email and password
3. Click **Masuk**

> First time? Click **Daftar** to create an account with your NIP and organization details.

### Registration

Required fields:
- **Nama Lengkap** — Full name
- **Email** — Must be `@sekneg.go.id`
- **Password** — Minimum 8 characters
- **NIP** — Nomor Induk Pegawai (optional but recommended)
- **Jabatan** — Your position (e.g., "Analis Kebijakan")
- **Organisasi** — Your institution/unit name

After registration, you're automatically logged in and set as admin of your organization.

---

## 2. Dashboard Overview

The dashboard provides a snapshot of your organization's meeting activity:

- **Total Rapat** — Number of all meetings
- **Rapat Selesai** — Completed meetings
- **Total Partisipan** — Unique participants across all meetings
- **Rata-rata Durasi** — Average meeting duration

**Charts:**
- **Tren Rapat** — Monthly meeting count (12-month view)
- **Partisipan Teratas** — Most active participants by meeting count

---

## 3. Meetings

### View Meetings

Navigate to **Meetings** in the sidebar. The list shows all meetings with:

- Title and description
- Date and status badge
- Participant count
- Tags (APBD, koordinasi, evaluasi, etc.)

**Filter & Search:**
- Search by title
- Filter by status (Scheduled, In Progress, Completed, Cancelled)
- Date range filter

### Create a Meeting

1. Click **+ Rapat Baru**
2. Fill in: title, date, location, meeting type, tags
3. Click **Simpan**

### Meeting Detail

Click any meeting to view:
- **Ringkasan** — Meeting info, participants, key metadata
- **Transkrip** — Full transcript with timeline and speakers
- **Ringkasan AI** — AI-generated summary with key points, decisions, action items
- **Notulen** — Formatted minutes document

---

## 4. Live Meeting

Record and transcribe meetings in real-time.

### Start Recording

1. Navigate to **Live Meeting**
2. Click **Mulai Rekam**
3. Grant microphone access when prompted
4. The system starts capturing audio and streaming transcription

### During Meeting

- **Transkrip Langsung** — Transcript appears in real-time as speakers talk
- **Pembicara Aktif** — Current speaker is highlighted
- **Timer** — Elapsed meeting duration
- **Speaker Panel** — All detected speakers with participation stats

### Stop Recording

1. Click **Hentikan**
2. Audio is saved and sent for full AI processing
3. You'll receive a notification when the transcript and summary are ready

---

## 5. Transcripts

### View Transcript

Navigate to **Transkrip** → Select a completed meeting.

The transcript viewer shows:
- **Timeline** — Each utterance with timestamp
- **Speaker Badges** — Color-coded speaker identification
- **Confidence Score** — Per-line transcription confidence
- **Search** — Search within the transcript

### Edit Transcript

1. Click the edit icon on any line
2. Modify the text
3. Click **Simpan** to save the correction

Edited lines show an "Edited" indicator.

---

## 6. Summary & Minutes

### AI Summary

After a meeting is processed, an AI-generated summary includes:

- **Pokok Bahasan** — Key points discussed
- **Keputusan** — Decisions made during the meeting
- **Tindak Lanjut** — Action items with assignees and deadlines

### Minutes / Notulen

Minutes are formatted documents that follow government template standards.

**Available Templates:**
- DPRD
- Pemerintah
- Kabupaten
- Kementerian
- Universitas
- BUMN
- Perusahaan

**Workflow:**
1. **Draft** — Initial AI-generated version
2. **Review** — Editor reviews and refines
3. **Approve** — Authorized user approves (minutes are locked)
4. **Archive** — Final version stored

---

## 7. AI Chat

Ask questions about your meetings using natural language.

### Start a Chat

1. Navigate to **AI Chat**
2. Click **+ Chat Baru**
3. Select context scope: a specific meeting or all meetings
4. Type your question

### Example Questions

- "Apa keputusan rapat APBD kemarin?"
- "Siapa PIC untuk tindak lanjut anggaran?"
- "Berapa total anggaran yang disetujui?"
- "Rangkumkan rapat koordinasi minggu ini"
- "Apa saja action item yang belum selesai?"

### Citations

Every AI response includes citations showing the source:
- Source document (meeting title)
- Relevant excerpt
- Relevance score

Click a citation to jump to the source transcript.

---

## 8. Search

### Unified Search

Access search from the sidebar or search bar at the top.

**Search covers:**
- **Rapat** — Meeting titles and descriptions
- **Transkrip** — Full transcript text with speaker context

**Filters:**
- Type: Meetings or Transcripts
- Meeting scope: Search within a specific meeting
- Date range limit

Search results show relevance context with highlighted matches.

---

## 9. Export

### Export Formats

| Format | Use Case |
|--------|----------|
| PDF | Formal distribution, signature |
| DOCX | Editable document for further processing |
| TXT | Plain text, archive |
| JSON | Machine-readable data integration |

### How to Export

1. Navigate to **Export**
2. Select **Ekspor Baru**
3. Choose a meeting
4. Select format
5. Click **Ekspor**

Export history shows all your previous exports with download links.

---

## 10. Speaker Insights

Track participation and speaking patterns.

### Overview Tab

- All speakers with metrics: meetings attended, total speaking time
- Search to find specific speakers
- Click a speaker to see their meeting history

### Insights Tab

- **Tren Partisipasi** — Monthly speaking time bars
- **Distribusi Waktu** — Speaking time breakdown per speaker
- **Kategori Rapat** — Topics/categories each speaker is most active in

---

## 11. Notifications

Stay informed about meeting activity.

### Notification Types

| Type | Trigger |
|------|---------|
| Rapat Baru | Meeting scheduled |
| Transkrip Siap | Transcription completed |
| Ringkasan Siap | AI summary generated |
| Tindak Lanjut | Action item approaching deadline |
| Mention | You're mentioned in a transcript |

### Manage Notifications

- Click the bell icon in the header
- Click any notification to navigate to the related item
- Mark individual notifications as read
- Click **Tandai Semua Dibaca** to clear all

---

## 12. Settings

### Profile

- Update your name, NIP, position
- Change theme (Light/Dark)
- Change language (Indonesia/English)
- Logout

### Organization (Admin only)

- View organization details
- See all members with roles
- Domain management

### Billing

- Current plan details (Enterprise)
- Usage statistics
- Payment history

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open search |
| `Ctrl+N` | New meeting |
| `Ctrl+E` | Export current view |
| `Esc` | Close modal / cancel |

---

## Support

For technical issues or feature requests, contact the system administrator at your organization.
