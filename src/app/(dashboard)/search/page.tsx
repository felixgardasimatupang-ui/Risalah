"use client";

import { useState, useCallback } from "react";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search as SearchIcon,
  Filter,
  FileText,
  MessageSquare,
  Calendar,
  Clock,
  ArrowRight,
  Loader2,
  X,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import Link from "next/link";

interface SearchResult {
  id: string;
  _type: "meeting" | "transcript_line";
  title?: string;
  text?: string;
  speakerName?: string;
  date?: string;
  status?: string;
  meetingType?: string;
  meetingName?: string;
  timestampMs?: number;
  tags?: string[];
}

const filterOptions = [
  { value: "all", label: "All" },
  { value: "meeting", label: "Meetings" },
  { value: "transcript", label: "Transcripts" },
];

const statusOptions = [
  { value: "", label: "Any Status" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setHasSearched(true);

    await new Promise((r) => setTimeout(r, 600));

    const mockResults: SearchResult[] = [
      {
        id: "m1", _type: "meeting", title: "Rapat Koordinasi APBD 2025",
        date: "2025-01-15", status: "completed", meetingType: "Koordinasi",
        tags: ["APBD", "Anggaran"],
      },
      {
        id: "m2", _type: "meeting", title: "Evaluasi Program Kerja Triwulan I",
        date: "2025-02-20", status: "completed", meetingType: "Evaluasi",
        tags: ["Evaluasi", "Program Kerja"],
      },
      {
        id: "tl1", _type: "transcript_line",
        text: "Kita perlu memastikan anggaran untuk program prioritas tahun depan sudah dialokasikan dengan baik...",
        speakerName: "Kepala Bappeda", meetingName: "Rapat Koordinasi APBD 2025",
        timestampMs: 120000,
      },
      {
        id: "tl2", _type: "transcript_line",
        text: "Saya setuju dengan usulan tersebut, namun perlu dikaji ulang dampaknya terhadap APBD secara keseluruhan.",
        speakerName: "Sekretaris Daerah", meetingName: "Rapat Koordinasi APBD 2025",
        timestampMs: 245000,
      },
    ];

    let filtered = mockResults;
    if (type !== "all") {
      filtered = filtered.filter((r) => r._type === type);
    }
    if (status) {
      filtered = filtered.filter((r) => r._type !== "meeting" || r.status === status);
    }
    if (dateFrom) {
      filtered = filtered.filter((r) => !r.date || r.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((r) => !r.date || r.date <= dateTo);
    }

    setResults(filtered);
    setIsLoading(false);
  }, [query, type, status, dateFrom, dateTo]);

  const formatTimestamp = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const highlightText = (text: string, q: string) => {
    if (!q.trim()) return text;
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark key={i} className="rounded-sm bg-amber-200 px-0.5 text-amber-900">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-headline-lg text-on-surface">Search</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Search meetings, transcripts, summaries, and more.
        </p>
      </div>

      <GlassPanel className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <Input
              placeholder="Search meetings, keywords, speakers..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <div className="flex gap-1">
            {filterOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={type === opt.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setType(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-accent" : ""}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <Button onClick={handleSearch} disabled={!query.trim() || isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <SearchIcon className="mr-2 h-4 w-4" />
            )}
            Search
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-surface-container pt-4">
            <div className="flex items-center gap-2">
              <label className="text-label-sm text-on-surface-variant">Status:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-md border bg-background px-3 py-1.5 text-sm text-on-surface"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-label-sm text-on-surface-variant">From:</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-label-sm text-on-surface-variant">To:</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
            </div>
            {(status || dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setStatus(""); setDateFrom(""); setDateTo(""); }}
                className="gap-1 text-on-surface-variant"
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        )}
      </GlassPanel>

      {hasSearched && (
        <div className="space-y-3">
          <p className="text-body-sm text-on-surface-variant">
            Found {results.length} results for &ldquo;{query}&rdquo;
          </p>

          {results.map((result) => (
            <GlassPanel key={result.id} className="group cursor-pointer p-4 transition-colors hover:bg-surface-container-low">
              <Link href={result._type === "meeting" ? `/meetings/${result.id}` : `/transcripts/${result.id.replace("tl", "m")}`}>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-high">
                    {result._type === "meeting" ? (
                      <Calendar className="h-5 w-5 text-primary" />
                    ) : (
                      <MessageSquare className="h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {result._type === "meeting" ? (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-headline text-headline-sm text-on-surface">
                            {result.title && highlightText(result.title, query)}
                          </h3>
                          <Badge variant="outline" className="capitalize">{result.status}</Badge>
                          {result.meetingType && <Badge variant="secondary">{result.meetingType}</Badge>}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-body-sm text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {result.date}
                          </span>
                        </div>
                        {result.tags && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {result.tags.map((tag) => (
                              <span key={tag} className="flex items-center gap-1 rounded-md bg-surface-container-low px-2 py-0.5 text-label-sm text-on-surface-variant">
                                <Tag className="h-3 w-3" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">Transcript</Badge>
                          <span className="text-label-sm text-on-surface-variant">{result.speakerName}</span>
                          {result.timestampMs && (
                            <span className="flex items-center gap-1 text-label-sm text-on-surface-variant">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(result.timestampMs)}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-body-md text-on-surface">
                          {result.text && highlightText(result.text, query)}
                        </p>
                        <p className="mt-1 text-label-sm text-on-surface-variant">{result.meetingName}</p>
                      </>
                    )}
                  </div>
                  <ArrowRight className="mt-3 h-4 w-4 shrink-0 text-on-surface-variant opacity-0 group-hover:opacity-100" />
                </div>
              </Link>
            </GlassPanel>
          ))}

          {results.length === 0 && (
            <GlassPanel className="flex flex-col items-center justify-center p-12 text-center">
              <SearchIcon className="mb-3 h-12 w-12 text-on-surface-variant/50" />
              <p className="text-headline-sm text-on-surface-variant">No results found</p>
              <p className="mt-1 text-body-sm text-on-surface-variant">Try different keywords or adjust filters</p>
            </GlassPanel>
          )}
        </div>
      )}

      {!hasSearched && (
        <GlassPanel className="flex flex-col items-center justify-center p-16 text-center">
          <SearchIcon className="mb-4 h-16 w-16 text-on-surface-variant/30" />
          <h2 className="font-headline text-headline-md text-on-surface-variant">
            Search Across All Meeting Documents
          </h2>
          <p className="mt-2 max-w-md text-body-md text-on-surface-variant">
            Find information from thousands of hours of meeting transcripts, summaries, and minutes.
          </p>
        </GlassPanel>
      )}
    </div>
  );
}
