"use client";

import { use, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/shared/glass-panel";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api-client";

function msToTime(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TranscriptViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [transcript, setTranscript] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTranscript(id).then((t) => {
      setTranscript(t);
      setLoading(false);
    });
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/transcripts">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-headline text-headline-lg text-on-surface">
            Rapat Koordinasi {id}
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Transkrip lengkap rapat
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-container-high" />
          ))}
        </div>
      ) : transcript?.lines?.length ? (
        <GlassPanel className="divide-y divide-white/10">
          {transcript.lines.map((line: any) => (
            <div key={line.id} className="flex gap-4 p-4">
              <div className="w-16 shrink-0 pt-0.5">
                <span className="text-label-sm text-on-surface-variant/60">
                  {msToTime(line.timestampMs)}
                </span>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <Badge variant="secondary" className="text-xs">
                  {line.speakerName}
                </Badge>
                <p className="text-body-sm text-on-surface leading-relaxed">{line.text}</p>
              </div>
            </div>
          ))}
        </GlassPanel>
      ) : (
        <GlassPanel className="p-8 text-center">
          <p className="text-body-md text-on-surface-variant">
            Transkrip belum tersedia atau masih dalam proses.
          </p>
        </GlassPanel>
      )}
    </div>
  );
}
