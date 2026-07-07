"use client";

import { use, useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Download, Lightbulb, ListChecks, Scale, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

const statusConfig: Record<string, { label: string; class: string }> = {
  pending: { label: "Pending", class: "bg-amber-100 text-amber-800 border-amber-200" },
  in_progress: { label: "In Progress", class: "bg-blue-100 text-blue-800 border-blue-200" },
  completed: { label: "Completed", class: "bg-green-100 text-green-800 border-green-200" },
};

export default function SummaryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [summary, setSummary] = useState<any>(null);
  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getSummary(id), api.getMeeting(id)]).then(([s, m]) => {
      setSummary(s);
      setMeeting(m);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-surface-container-high" />
        ))}
      </div>
    );
  }

  if (!summary || !meeting) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/summary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-3 py-8">
            <FileText className="h-12 w-12 text-on-surface-variant/40" />
            <h3 className="font-headline text-headline-md text-on-surface">Ringkasan Tidak Ditemukan</h3>
            <p className="text-body-sm text-on-surface-variant">
              Ringkasan untuk rapat ini belum tersedia atau masih dalam proses.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/summary">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-headline-lg text-on-surface">
              Ringkasan Rapat
            </h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              {new Date(meeting.date).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              • {meeting.title}
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-headline-md">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Key Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.keyPoints.map((kp: any) => (
            <div key={kp.id} className="flex gap-3 rounded-lg bg-surface-container-low p-3">
              <Badge variant="outline" className="shrink-0 self-start text-xs">
                {kp.category}
              </Badge>
              <p className="text-body-sm text-on-surface">{kp.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-headline-md">
            <ListChecks className="h-5 w-5 text-blue-500" />
            Action Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.actionItems.map((item: any) => {
            const config = statusConfig[item.status] ?? statusConfig.pending;
            return (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-lg bg-surface-container-low p-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-body-sm text-on-surface">{item.description}</p>
                  <p className="text-label-sm text-on-surface-variant">Due {item.dueDate}</p>
                </div>
                <Badge className={cn("shrink-0 text-xs", config.class)}>
                  {config.label}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-headline-md">
            <Scale className="h-5 w-5 text-purple-500" />
            Decisions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.decisions.map((d: any) => (
            <div key={d.id} className="flex gap-3 rounded-lg bg-surface-container-low p-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-label-sm text-white">
                {d.id.slice(-1)}
              </span>
              <p className="text-body-sm text-on-surface">{d.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
