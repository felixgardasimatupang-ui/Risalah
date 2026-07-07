"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mic,
  MicOff,
  Square,
  Radio,
  MessageSquare,
  Volume2,
  Download,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWebSocket } from "@/hooks/use-websocket";

interface LiveLine {
  id: string;
  speakerName: string;
  text: string;
  timestampMs: number;
  isActive: boolean;
}

const sampleSpeakers = [
  { id: "p1", name: "Dr. Andi Pratama", role: "Pimpinan Rapat", isSpeaking: true },
  { id: "p2", name: "Sari Dewi, S.Sos.", role: "Sekretaris", isSpeaking: false },
  { id: "p3", name: "Bambang Susilo", role: "Kepala Divisi TI", isSpeaking: false },
  { id: "p4", name: "Dian Kusumawardhani", role: "Analis Kebijakan", isSpeaking: false },
];

function msToTime(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function LiveMeetingPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speakers, setSpeakers] = useState(sampleSpeakers);
  const [lines, setLines] = useState<LiveLine[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mockMeetingId] = useState("live-mock-001");
  const [micPermission, setMicPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  const { status: wsStatus, lastMessage, connect, disconnect } = useWebSocket(mockMeetingId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  useEffect(() => {
    if (lastMessage?.type === "transcript_line" && lastMessage.payload) {
      const line = lastMessage.payload as LiveLine;
      setLines((prev) => [...prev, line]);
    }
  }, [lastMessage]);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording) return;
    const phrases = [
      "Menyetujui usulan anggaran yang telah disampaikan dengan catatan akan dilakukan evaluasi lebih lanjut oleh tim terkait.",
      "Mohon untuk ditindaklanjuti oleh masing-masing divisi sesuai dengan tupoksi yang telah ditetapkan.",
      "Dengan ini disepakati bahwa target capaian triwulan berikutnya akan ditingkatkan sebesar 15 persen.",
      "Terkait regulasi, kami akan berkoordinasi lebih lanjut dengan Kemenkumham untuk percepatan pengesahan.",
      "Laporan akhir tahun harus sudah diserahkan paling lambat pertengahan bulan depan.",
    ];
    let idx = 0;
    const interval = setInterval(() => {
      setLines((prev) => [
        ...prev,
        {
          id: `live-${Date.now()}`,
          speakerName: speakers.find((s) => s.isSpeaking)?.name ?? "Pembicara",
          text: phrases[idx % phrases.length],
          timestampMs: elapsed * 1000,
          isActive: true,
        },
      ]);
      idx++;
    }, 6000);
    return () => clearInterval(interval);
  }, [isRecording, speakers, elapsed]);

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const value = Math.abs(dataArray[i] - 128);
      sum += value;
    }
    const avg = sum / dataArray.length;
    setAudioLevel(Math.min(avg / 128, 1));
    if (mediaRecorderRef.current?.state === "recording") {
      setRecordingDuration((prev) => prev + 1);
    }
    animFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      mediaStreamRef.current = stream;
      setMicPermission("granted");

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4" });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        setRecordedBlob(blob);
        setAudioLevel(0);
        setRecordingDuration(0);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordedBlob(null);
      connect();
      animFrameRef.current = requestAnimationFrame(updateAudioLevel);
    } catch {
      setMicPermission("denied");
    }
  }, [connect, updateAudioLevel]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    cancelAnimationFrame(animFrameRef.current);
    setIsRecording(false);
    disconnect();
  }, [disconnect]);

  const downloadRecording = () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recording-${new Date().toISOString().slice(0, 19)}.${recordedBlob.type.includes("webm") ? "webm" : "m4a"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatElapsed = () => {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const waveformBars = 40;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            isRecording ? "bg-red-100" : "bg-surface-container-high",
          )}>
            <Radio className={cn("h-5 w-5", isRecording ? "text-red-500" : "text-on-surface-variant")} />
          </div>
          <div>
            <h1 className="font-headline text-headline-lg text-on-surface">Live Meeting</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              {isRecording ? "Merekam dan mentranskrip secara real-time" : "Mulai rapat baru untuk merekam dan mentranskrip"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-2 rounded-lg bg-surface-container-high px-3 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-label-sm text-on-surface-variant">{formatElapsed()}</span>
              <span className={cn(
                "ml-1 inline-block h-2 w-2 rounded-full",
                wsStatus === "connected" ? "bg-green-500" : wsStatus === "connecting" ? "bg-yellow-500" : "bg-red-500",
              )} />
            </div>
          )}
          <Button
            variant={isRecording ? "destructive" : "default"}
            onClick={() => (isRecording ? stopRecording() : startRecording())}
          >
            {isRecording ? (
              <><Square className="mr-2 h-4 w-4" /> Hentikan Rekaman</>
            ) : (
              <><Mic className="mr-2 h-4 w-4" /> Mulai Rekam</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-4">
          <GlassPanel className="flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-surface-container px-6 py-3">
              <h2 className="flex items-center gap-2 font-headline text-headline-sm text-on-surface">
                <MessageSquare className="h-5 w-5 text-primary" />
                Transkrip Real-Time
              </h2>
              {!isRecording && lines.length === 0 && (
                <Badge variant="outline" className="text-on-surface-variant">Menunggu</Badge>
              )}
            </div>

            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
              {lines.length === 0 && !isRecording ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <MicOff className="mb-4 h-12 w-12 text-on-surface-variant/40" />
                  <p className="text-body-md text-on-surface-variant">
                    Tekan &quot;Mulai Rekam&quot; untuk memulai transkripsi real-time
                  </p>
                </div>
              ) : (
                <>
                  {lines.map((line) => (
                    <div key={line.id} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-label-sm text-on-primary-container">
                        {line.speakerName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-label-sm font-medium text-on-surface">{line.speakerName}</span>
                          <span className="text-label-xs text-on-surface-variant">{msToTime(line.timestampMs)}</span>
                        </div>
                        <p className="text-body-sm text-on-surface leading-relaxed">{line.text}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </GlassPanel>
        </div>

        <div className="space-y-4">
          <GlassPanel className="p-5">
            <h3 className="mb-3 font-headline text-headline-sm text-on-surface">Pembicara</h3>
            <div className="space-y-2">
              {speakers.map((speaker) => (
                <div
                  key={speaker.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg p-2.5 transition-colors",
                    speaker.isSpeaking ? "bg-emerald-50 ring-1 ring-emerald-200" : "bg-surface-container-low",
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-label-sm",
                    speaker.isSpeaking ? "bg-emerald-500 text-white" : "bg-surface-container text-on-surface-variant",
                  )}>
                    {speaker.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-body-sm font-medium truncate", speaker.isSpeaking && "text-emerald-700")}>
                      {speaker.name}
                    </p>
                    <p className="text-label-xs text-on-surface-variant truncate">{speaker.role}</p>
                  </div>
                  {speaker.isSpeaking && <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />}
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="p-5">
            <h3 className="mb-3 font-headline text-headline-sm text-on-surface">Informasi Rapat</h3>
            <div className="space-y-2 text-body-sm text-on-surface-variant">
              <div className="flex items-center justify-between">
                <span>Durasi</span>
                <span className="font-medium text-on-surface">{isRecording ? formatElapsed() : recordedBlob ? msToTime(recordingDuration * 100) : "—"}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span>Pembicara Aktif</span>
                <Badge variant="secondary" className="text-xs">{speakers.filter((s) => s.isSpeaking).length}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span>Transkrip</span>
                <Badge variant="secondary" className="text-xs">{lines.length} baris</Badge>
              </div>
            </div>
          </GlassPanel>

          {micPermission === "denied" && (
            <GlassPanel className="p-4 border border-error/30">
              <div className="flex items-center gap-2 text-label-sm text-error">
                <MicOff className="h-4 w-4" />
                Izin mikrofon ditolak. Izinkan akses mikrofon di pengaturan browser.
              </div>
            </GlassPanel>
          )}

          {isRecording && (
            <GlassPanel className="p-5">
              <h3 className="mb-3 flex items-center gap-2 font-headline text-headline-sm text-on-surface">
                <Volume2 className="h-4 w-4 text-primary" />
                Level Audio
              </h3>
              <div className="flex items-end gap-[3px] h-16">
                {Array.from({ length: waveformBars }).map((_, i) => {
                  const barHeight = Math.max(2, audioLevel * 64 * (0.3 + (Math.sin(i * 0.5 + Date.now() * 0.005) * 0.5 + 0.5) * 0.7));
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm transition-all duration-75"
                      style={{
                        height: `${barHeight}px`,
                        backgroundColor: barHeight > 40 ? "#ef4444" : barHeight > 20 ? "#f59e0b" : "#22c55e",
                        opacity: 0.4 + (barHeight / 64) * 0.6,
                      }}
                    />
                  );
                })}
              </div>
            </GlassPanel>
          )}

          {recordedBlob && (
            <GlassPanel className="p-5">
              <h3 className="mb-3 font-headline text-headline-sm text-on-surface">Rekaman Tersimpan</h3>
              <div className="space-y-2">
                <div className="rounded-lg bg-surface-container-low p-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container">
                    <Mic className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-label-sm text-on-surface truncate">
                      recording-{new Date().toISOString().slice(0, 19)}.{recordedBlob.type.includes("webm") ? "webm" : "m4a"}
                    </p>
                    <p className="text-label-xs text-on-surface-variant">
                      {(recordedBlob.size / 1024 / 1024).toFixed(1)} MB · {(recordingDuration / 10).toFixed(0)} detik
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={downloadRecording}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
}
