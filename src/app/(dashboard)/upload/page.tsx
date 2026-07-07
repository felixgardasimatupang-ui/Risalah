"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload as UploadIcon,
  FileAudio,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Mic,
} from "lucide-react";

type UploadStatus = "idle" | "uploading" | "processing" | "completed" | "error";

interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
}

export default function UploadPage() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newUploads: UploadItem[] = Array.from(files)
      .filter((f) => f.type.startsWith("audio/") || f.type.startsWith("video/"))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "idle" as UploadStatus,
        progress: 0,
      }));

    if (newUploads.length === 0) return;

    setUploads((prev) => [...prev, ...newUploads]);

    newUploads.forEach((item) => simulateUpload(item.id));
  }, []);

  const simulateUpload = (id: string) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: "uploading" } : u)));

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        clearInterval(interval);
        setUploads((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, progress: 100, status: "processing" } : u,
          ),
        );
        setTimeout(() => {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === id ? { ...u, status: "completed" } : u,
            ),
          );
        }, 2000);
      } else {
        setUploads((prev) =>
          prev.map((u) => (u.id === id ? { ...u, progress: Math.round(progress) } : u)),
        );
      }
    }, 300);
  };

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-headline-lg text-on-surface">Upload Audio</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Unggah rekaman rapat untuk diproses menjadi transkrip, ringkasan, dan notula.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-surface-container-high hover:border-primary/50 hover:bg-surface-container-low"
            }`}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="audio/*,video/*"
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container">
              <UploadIcon className="h-8 w-8 text-primary" />
            </div>
            <p className="text-headline-sm text-on-surface">
              {isDragging ? "Lepaskan file di sini" : "Seret file ke sini atau klik untuk memilih"}
            </p>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              MP3, WAV, M4A, OGG, WebM — Maksimal 500MB per file
            </p>
          </div>

          {uploads.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-headline text-headline-sm text-on-surface">
                Antrian Unggahan ({uploads.length})
              </h3>
              {uploads.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high">
                      {item.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : item.status === "error" ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : item.status === "uploading" || item.status === "processing" ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : (
                        <FileAudio className="h-5 w-5 text-on-surface-variant" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-sm font-medium text-on-surface">
                        {item.file.name}
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                        {item.status === "uploading" && ` — ${item.progress}%`}
                        {item.status === "processing" && " — Memproses..."}
                        {item.status === "completed" && " — Selesai"}
                      </p>
                      {(item.status === "uploading" || item.status === "processing") && (
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.status === "processing"
                                ? "animate-pulse bg-amber-500"
                                : "bg-primary"
                            }`}
                            style={{
                              width:
                                item.status === "processing" ? "100%" : `${item.progress}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {item.status === "idle" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeUpload(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {item.status === "completed" && (
                      <Badge variant="outline" className="text-emerald-600">
                        Selesai
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <GlassPanel className="p-5">
            <h3 className="mb-3 flex items-center gap-2 font-headline text-headline-sm text-on-surface">
              <Mic className="h-5 w-5 text-primary" />
              Rekam Live
            </h3>
            <p className="mb-4 text-body-sm text-on-surface-variant">
              Rekam rapat secara langsung dan dapatkan transkrip real-time dengan deteksi
              pembicara otomatis.
            </p>
            <Button className="w-full" disabled>
              <Mic className="mr-2 h-4 w-4" />
              Mulai Rekam (Segera)
            </Button>
          </GlassPanel>

          <GlassPanel className="p-5">
            <h3 className="mb-3 font-headline text-headline-sm text-on-surface">
              Format Didukung
            </h3>
            <div className="space-y-2 text-body-sm text-on-surface-variant">
              <div className="flex items-center justify-between">
                <span>Audio</span>
                <Badge variant="outline">MP3, WAV, M4A, OGG</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Video</span>
                <Badge variant="outline">MP4, WebM</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Maks. Ukuran</span>
                <Badge variant="outline">500 MB</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Durasi Maks.</span>
                <Badge variant="outline">8 Jam</Badge>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
