"use client";

import { useAnalytics } from "@/hooks/use-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassPanel } from "@/components/shared/glass-panel";
import { BarChart3, TrendingUp, Users, Clock, Target } from "lucide-react";

export default function AnalyticsPage() {
  const { data, isLoading } = useAnalytics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-headline-lg text-on-surface">Analytics</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">Wawasan dari seluruh rapat</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-container-high" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-on-surface-variant">Total Rapat</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-on-surface">{data?.totalMeetings ?? "—"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-on-surface-variant">Total Jam</CardTitle>
                <Clock className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-on-surface">{data?.totalHours ?? "—"} jam</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-on-surface-variant">Rata-rata Durasi</CardTitle>
                <TrendingUp className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-on-surface">{data?.averageDuration ?? "—"} menit</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-on-surface-variant">Tingkat Penyelesaian</CardTitle>
                <Target className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-on-surface">{data?.completionRate ?? "—"}%</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <GlassPanel className="p-6">
              <h3 className="mb-4 flex items-center gap-2 font-headline text-headline-md text-on-surface">
                <TrendingUp className="h-5 w-5 text-primary" />
                Tren Rapat per Bulan
              </h3>
              <div className="flex items-end gap-3" style={{ height: 180 }}>
                {data?.monthlyTrend?.map((item: { month: string; meetings: number }) => {
                  const maxMeetings = Math.max(...data.monthlyTrend.map((t: { meetings: number }) => t.meetings));
                  return (
                    <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
                      <span className="text-label-sm text-on-surface-variant">{item.meetings}</span>
                      <div
                        className="w-full rounded-t-md bg-primary transition-all"
                        style={{ height: `${(item.meetings / maxMeetings) * 140}px` }}
                      />
                      <span className="text-label-sm text-on-surface-variant">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <h3 className="mb-4 flex items-center gap-2 font-headline text-headline-md text-on-surface">
                <Users className="h-5 w-5 text-primary" />
                Partisipasi Teratas
              </h3>
              <div className="space-y-4">
                {data?.participantStats?.map((p: { name: string; meetings: number; speakingTime: number }) => {
                  const maxSpeaking = Math.max(...data.participantStats.map((t: { speakingTime: number }) => t.speakingTime));
                  return (
                    <div key={p.name} className="space-y-1">
                      <div className="flex items-center justify-between text-body-sm">
                        <span className="text-on-surface">{p.name}</span>
                        <span className="text-on-surface-variant">{p.speakingTime}% bicara</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${(p.speakingTime / maxSpeaking) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <h3 className="mb-4 flex items-center gap-2 font-headline text-headline-md text-on-surface">
                Kategori Rapat
              </h3>
              <div className="space-y-3">
                {data?.topCategories?.map((cat: { name: string; count: number }) => {
                  const maxCount = Math.max(...data.topCategories.map((c: { count: number }) => c.count));
                  return (
                    <div key={cat.name} className="flex items-center gap-3">
                      <span className="w-28 text-body-sm text-on-surface">{cat.name}</span>
                      <div className="flex-1">
                        <div className="h-6 overflow-hidden rounded-md bg-surface-container-high">
                          <div
                            className="flex h-full items-center justify-end rounded-md bg-primary-container px-2 text-label-sm text-on-primary-container transition-all"
                            style={{ width: `${(cat.count / maxCount) * 100}%` }}
                          >
                            {cat.count}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassPanel>
          </div>
        </>
      )}
    </div>
  );
}
