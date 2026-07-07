"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Sparkles, CheckCircle2, ArrowRight, ArrowLeft, X, Rocket, FileText, Search, MessageSquare, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function OnboardingModal() {
  const { hasSeenOnboarding, currentStep, steps, nextStep, prevStep, dismiss, completeStep } = useOnboardingStore();
  const router = useRouter();

  if (hasSeenOnboarding) return null;

  const step = steps[currentStep];

  const handleComplete = (id: string) => {
    completeStep(id);
    if (currentStep < steps.length - 1) {
      nextStep();
    } else {
      dismiss();
    }
  };

  const handleSkip = () => {
    dismiss();
    router.push("/overview");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 animate-in fade-in zoom-in duration-300">
        <CardHeader className="relative">
          <button onClick={handleSkip} className="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
          <div className="flex gap-1.5 mb-4">
            {steps.map((s, i) => (
              <div
                key={s.id}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i <= currentStep ? "bg-primary" : "bg-surface-container-high",
                  i === currentStep && "animate-pulse"
                )}
              />
            ))}
          </div>
          <CardTitle className="text-headline-lg text-on-surface text-center">
            {step.id === "welcome" && (
              <span className="flex items-center justify-center gap-2">
                <Rocket className="h-6 w-6 text-primary" />
                Selamat Datang di Risalah!
              </span>
            )}
            {step.id === "profile" && "Lengkapi Profil Anda"}
            {step.id === "upload" && "Upload Meeting Pertama"}
            {step.id === "explore" && "Jelajahi Fitur"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step.id === "welcome" && (
            <>
              <p className="text-body-md text-on-surface-variant text-center">
                Platform kecerdasan buatan untuk notulensi dan analisis rapat pemerintahan.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: FileText, label: "Transkrip Otomatis", desc: "Speech-to-text akurat bahasa Indonesia" },
                  { icon: Sparkles, label: "Ringkasan AI", desc: "Notulen rapat instan dengan AI" },
                  { icon: Search, label: "Pencarian Cerdas", desc: "Temukan informasi dalam detik" },
                  { icon: BarChart3, label: "Analitik", desc: "Wawasan dari setiap rapat" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="rounded-xl bg-surface-container-low p-3 space-y-1">
                    <Icon className="h-5 w-5 text-primary" />
                    <p className="text-sm font-medium text-on-surface">{label}</p>
                    <p className="text-label-xs text-on-surface-variant">{desc}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {step.id === "profile" && (
            <div className="space-y-3">
              <p className="text-body-sm text-on-surface-variant">Pastikan data diri Anda sudah benar.</p>
              <div className="space-y-2">
                <label className="text-label-sm text-on-surface-variant">Nama Lengkap</label>
                <Input defaultValue="Andi Pratama" className="bg-surface-container-low" />
              </div>
              <div className="space-y-2">
                <label className="text-label-sm text-on-surface-variant">Jabatan</label>
                <Input defaultValue="Kepala Divisi" className="bg-surface-container-low" />
              </div>
              <div className="space-y-2">
                <label className="text-label-sm text-on-surface-variant">Instansi</label>
                <Input defaultValue="Sekretariat Negara RI" className="bg-surface-container-low" />
              </div>
            </div>
          )}

          {step.id === "upload" && (
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-container">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <p className="text-body-md text-on-surface-variant">Upload rekaman rapat pertama Anda untuk memulai.</p>
              <p className="text-label-sm text-on-surface-variant">Mendukung format MP3, WAV, M4A, dan OGG.</p>
            </div>
          )}

          {step.id === "explore" && (
            <div className="space-y-3">
              <p className="text-body-sm text-on-surface-variant text-center">
                Berikut beberapa fitur yang bisa Anda coba:
              </p>
              <div className="space-y-2">
                {[
                  { icon: FileText, label: "Transkrip", desc: "Lihat hasil transkripsi dengan timeline speaker" },
                  { icon: Sparkles, label: "Ringkasan", desc: "Baca ringkasan AI dan action items" },
                  { icon: MessageSquare, label: "AI Chat", desc: "Tanya apapun tentang rapat" },
                  { icon: Search, label: "Pencarian", desc: "Cari kata kunci di semua transkrip" },
                ].map(({ icon: Icon, label, desc }, i) => (
                  <div key={label} className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{label}</p>
                      <p className="text-label-xs text-on-surface-variant">{desc}</p>
                    </div>
                    <CheckCircle2 className={cn("ml-auto h-5 w-5", i === 0 ? "text-success" : "text-surface-container-high")} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" onClick={handleSkip} className="text-on-surface-variant">
              Lewati
            </Button>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Kembali
                </Button>
              )}
              <Button onClick={() => handleComplete(step.id)}>
                {currentStep < steps.length - 1 ? (
                  <>
                    Lanjut
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Mulai
                    <Rocket className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
