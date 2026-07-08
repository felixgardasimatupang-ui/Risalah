"use client";

import { useState, useEffect, useRef } from "react";
import { useUiStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { useOrgStore } from "@/stores/org-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GlassPanel } from "@/components/shared/glass-panel";
import { useRouter } from "next/navigation";
import { LogOut, Building2, CreditCard, User, Save, Mail, UserPlus, Check, X, Clock, Shield, Smartphone, KeyRound, QrCode, AlertTriangle, Bell, Fingerprint, Link2, Unlink, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSecret, generateTOTPUri, verifyTOTP } from "@/lib/totp";
import { mockSSOConfigs, testSSOConnection } from "@/lib/sso";
import type { SSOConfig } from "@/lib/sso";
import Image from "next/image";

type SettingsTab = "profile" | "security" | "sso" | "organization" | "billing" | "notifications";

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  { id: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
  { id: "sso", label: "SSO", icon: <Fingerprint className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { id: "organization", label: "Organization", icon: <Building2 className="h-4 w-4" /> },
  { id: "billing", label: "Billing", icon: <CreditCard className="h-4 w-4" /> },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { theme, language, setTheme, setLanguage } = useUiStore();
  const { user, logout } = useAuthStore();
  const { organizations, activeOrg, invites, fetchOrganizations, fetchInvites, sendInvite } = useOrgStore();
  const router = useRouter();
  const [orgName, setOrgName] = useState("Sekretariat Negara RI");
  const [orgEmail, setOrgEmail] = useState("admin@sekneg.go.id");
  const [plan, _setPlan] = useState("enterprise");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteStatus, setInviteStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchOrganizations();
    fetchInvites();
  }, [fetchOrganizations, fetchInvites]);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviteStatus(null);
    try {
      await sendInvite(inviteEmail, inviteRole);
      setInviteStatus({ success: true, message: "Undangan berhasil dikirim" });
      setInviteEmail("");
    } catch {
      setInviteStatus({ success: false, message: "Gagal mengirim undangan" });
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-headline text-headline-lg text-on-surface">Settings</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">Konfigurasi akun dan preferensi</p>
      </div>

      <div className="flex gap-2 border-b border-surface-container pb-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg border-b-2 border-transparent",
              activeTab === tab.id
                ? "text-primary border-primary bg-primary-container/10"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-higher",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-headline-md">Profil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-label-sm text-on-surface-variant">Nama Lengkap</label>
                <Input placeholder="Nama pengguna" defaultValue={user?.fullName ?? ""} className="bg-surface-container-low" />
              </div>
              <div className="space-y-2">
                <label className="text-label-sm text-on-surface-variant">Email</label>
                <Input type="email" placeholder="email@example.com" defaultValue={user?.email ?? ""} className="bg-surface-container-low" />
              </div>
              <div className="space-y-2">
                <label className="text-label-sm text-on-surface-variant">Jabatan</label>
                <Input placeholder="Jabatan" defaultValue="Kepala Divisi" className="bg-surface-container-low" />
              </div>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Simpan Perubahan
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-headline-md">Preferensi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-label-sm text-on-surface-variant">Tema</label>
                <Select value={theme} onValueChange={(v: "light" | "dark" | "system") => setTheme(v)}>
                  <SelectTrigger className="bg-surface-container-low">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Terang</SelectItem>
                    <SelectItem value="dark">Gelap</SelectItem>
                    <SelectItem value="system">Sistem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-label-sm text-on-surface-variant">Bahasa</label>
                <Select value={language} onValueChange={(v: "id" | "en") => setLanguage(v)}>
                  <SelectTrigger className="bg-surface-container-low">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">Bahasa Indonesia</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-headline-md text-error">Sesi</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="text-error" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === "security" && (
        <SecurityTab />
      )}

      {activeTab === "sso" && (
        <SSOTab />
      )}

      {activeTab === "organization" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-headline-md">Informasi Organisasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-label-sm text-on-surface-variant">Nama Organisasi</label>
                <Input value={activeOrg?.name ?? orgName} onChange={(e) => setOrgName(e.target.value)} className="bg-surface-container-low" />
              </div>
              <div className="space-y-2">
                <label className="text-label-sm text-on-surface-variant">Email Organisasi</label>
                <Input type="email" value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} className="bg-surface-container-low" />
              </div>
              <div className="space-y-2">
                <label className="text-label-sm text-on-surface-variant">Domain</label>
                <Input value={activeOrg?.slug ? `${activeOrg.slug}.go.id` : "sekneg.go.id"} disabled className="bg-surface-container-low text-on-surface-variant" />
              </div>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Simpan
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-headline-md">Anggota Tim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { name: "Dr. Andi Pratama", email: "andi@sekneg.go.id", role: "Admin" },
                  { name: "Sari Dewi, S.Sos.", email: "sari@sekneg.go.id", role: "Editor" },
                  { name: "Bambang Susilo", email: "bambang@sekneg.go.id", role: "Viewer" },
                  { name: "Dian Kusumawardhani", email: "dian@sekneg.go.id", role: "Editor" },
                  { name: "Fajar Nugroho", email: "fajar@sekneg.go.id", role: "Viewer" },
                ].map((member) => (
                  <div key={member.email} className="flex items-center justify-between rounded-xl bg-surface-container-low p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-xs font-medium text-primary">
                        {member.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-on-surface">{member.name}</p>
                        <p className="text-xs text-on-surface-variant">{member.email}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-primary-container px-3 py-0.5 text-label-xs text-primary">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-headline-md">Undang Anggota</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  placeholder="email@domain.go.id"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-surface-container-low flex-1"
                />
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="w-32 bg-surface-container-low">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleInvite}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Undang
                </Button>
              </div>
              {inviteStatus && (
                <p className={cn("text-label-sm", inviteStatus.success ? "text-success" : "text-error")}>
                  {inviteStatus.message}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-headline-md">Undangan Terkirim</CardTitle>
            </CardHeader>
            <CardContent>
              {invites.length === 0 ? (
                <p className="text-body-md text-on-surface-variant text-center py-4">Belum ada undangan</p>
              ) : (
                <div className="space-y-3">
                  {invites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between rounded-xl bg-surface-container-low p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high">
                          <Mail className="h-4 w-4 text-on-surface-variant" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-on-surface">{invite.email}</p>
                          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                            <Shield className="h-3 w-3" />
                            {invite.role}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(invite.createdAt).toLocaleDateString("id-ID")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={cn(
                        "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-xs",
                        invite.status === "accepted" && "bg-success-container text-success",
                        invite.status === "pending" && "bg-warning-container text-warning",
                        invite.status === "expired" && "bg-surface-container-high text-on-surface-variant",
                      )}>
                        {invite.status === "accepted" ? <Check className="h-3 w-3" /> : invite.status === "expired" ? <X className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {invite.status === "accepted" ? "Diterima" : invite.status === "pending" ? "Menunggu" : "Kedaluwarsa"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === "notifications" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-headline-md">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { id: "email_new_meeting", label: "New Meeting Created", desc: "When a meeting is created or uploaded" },
                { id: "email_transcript_ready", label: "Transcript Ready", desc: "When transcription is complete" },
                { id: "email_summary_ready", label: "Summary Ready", desc: "When AI summary is generated" },
                { id: "email_action_item", label: "Action Item Assigned", desc: "When you are assigned an action item" },
                { id: "email_mention", label: "Mentions", desc: "When you are mentioned in a transcript" },
                { id: "in_app_all", label: "In-App Notifications", desc: "Show notifications in the app (bell icon)" },
              ].map((n) => (
                <div key={n.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
                  <div>
                    <p className="text-sm font-medium">{n.label}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                  <label className="relative inline-flex h-5 w-9 cursor-pointer items-center">
                    <input type="checkbox" defaultChecked className="peer sr-only" />
                    <span className="absolute inset-0 rounded-full bg-surface-container-high transition peer-checked:bg-primary after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4" />
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-headline-md">Email Digests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                <div>
                  <p className="text-sm font-medium">Weekly Summary</p>
                  <p className="text-xs text-muted-foreground">Receive a weekly digest of all meetings</p>
                </div>
                <select className="rounded-md border bg-background px-3 py-1.5 text-sm">
                  <option>Disabled</option>
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === "billing" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-headline-md">Paket Saat Ini</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-primary-container/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-headline text-headline-md text-primary">Enterprise</p>
                    <p className="text-sm text-on-surface-variant">Akses penuh semua fitur untuk organisasi</p>
                  </div>
                  <span className="rounded-full bg-primary px-3 py-1 text-label-sm text-on-primary">Aktif</span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-on-surface-variant">Meeting bulan ini</span>
                    <p className="font-medium text-on-surface">12 / 100</p>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Penyimpanan</span>
                    <p className="font-medium text-on-surface">2.4 GB / 50 GB</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-headline-md">Riwayat Pembayaran</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: "1 Jun 2026", amount: "Rp 2.500.000", status: "success" },
                  { date: "1 Mei 2026", amount: "Rp 2.500.000", status: "success" },
                  { date: "1 Apr 2026", amount: "Rp 2.500.000", status: "success" },
                ].map((bill) => (
                  <div key={bill.date} className="flex items-center justify-between rounded-xl bg-surface-container-low p-3">
                    <div>
                      <p className="text-sm font-medium text-on-surface">{bill.date}</p>
                      <p className="text-xs text-on-surface-variant">{bill.amount}</p>
                    </div>
                    <span className="text-label-xs text-success">Lunas</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function SecurityTab() {
  const { user } = useAuthStore();
  const [step, setStep] = useState<"idle" | "setup" | "verify" | "enabled">("idle");
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [mfaActive, setMfaActive] = useState(false);
  const [mfaSetupDate, setMfaSetupDate] = useState<string | null>(null);
  const qrUrlRef = useRef("");

  const startSetup = () => {
    const newSecret = createSecret();
    const newUri = generateTOTPUri({
      secret: newSecret,
      email: user?.email ?? "",
      issuer: "Risalah SEKNEG",
    });
    setSecret(newSecret);
    setUri(newUri);
    qrUrlRef.current = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(newUri)}`;
    setStep("setup");
  };

  const handleVerify = async () => {
    setVerifyError("");
    const valid = await verifyTOTP({ secret, token: verifyCode });
    if (valid) {
      setMfaActive(true);
      setMfaSetupDate(new Date().toISOString());
      setStep("enabled");
    } else {
      setVerifyError("Kode verifikasi tidak valid. Coba lagi.");
    }
  };

  const handleDisable = () => {
    setMfaActive(false);
    setMfaSetupDate(null);
    setStep("idle");
    setShowDisableConfirm(false);
    setSecret("");
    setUri("");
    setVerifyCode("");
  };

  if (step === "enabled") {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="text-headline-md flex items-center gap-2">
              <Shield className="h-5 w-5 text-success" />
              Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-success-container/20 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success">
                  <Check className="h-5 w-5 text-on-primary" />
                </div>
                <div>
                  <p className="font-medium text-on-surface">MFA Aktif</p>
                  <p className="text-label-sm text-on-surface-variant">
                    Diamankan sejak {mfaSetupDate ? new Date(mfaSetupDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-surface-container-low p-4">
              <p className="text-label-sm text-on-surface-variant mb-2">Metode Verifikasi</p>
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-primary" />
                <span className="text-sm text-on-surface">Authenticator App (TOTP)</span>
              </div>
            </div>
            {!showDisableConfirm ? (
              <Button variant="outline" className="text-error" onClick={() => setShowDisableConfirm(true)}>
                Nonaktifkan MFA
              </Button>
            ) : (
              <div className="rounded-xl bg-error-container/20 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-error shrink-0 mt-0.5" />
                  <p className="text-sm text-error">Menonaktifkan MFA akan mengurangi keamanan akun Anda. Pastikan Anda memahami risikonya.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={handleDisable}>Ya, Nonaktifkan</Button>
                  <Button variant="outline" onClick={() => setShowDisableConfirm(false)}>Batal</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </>
    );
  }

  if (step === "setup") {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="text-headline-md flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Setup Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-label-sm text-on-surface-variant">Langkah 1: Scan QR Code</h3>
              <p className="text-body-md text-on-surface">
                Buka aplikasi authenticator (Google Authenticator, Authy, atau Microsoft Authenticator) dan scan kode QR berikut:
              </p>
              <div className="flex justify-center">
                {qrUrlRef.current && (
                  <Image
                    src={qrUrlRef.current}
                    alt="QR Code untuk MFA"
                    width={240}
                    height={240}
                    className="rounded-xl"
                    unoptimized
                  />
                )}
              </div>
              <details className="group">
                <summary className="cursor-pointer text-label-sm text-primary hover:underline">Atau masukkan kode manual</summary>
                <p className="mt-2 font-mono text-xs text-on-surface-variant break-all bg-surface-container-low rounded-lg p-3 select-all">
                  {secret.match(/.{1,4}/g)?.join(" ")}
                </p>
              </details>
            </div>

            <div className="space-y-3">
              <h3 className="text-label-sm text-on-surface-variant">Langkah 2: Verifikasi Kode</h3>
              <p className="text-body-md text-on-surface">
                Masukkan kode 6 digit yang muncul di aplikasi authenticator Anda:
              </p>
              <div className="flex gap-3 items-start">
                <div className="flex-1">
                  <Input
                    placeholder="000000"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="bg-surface-container-low font-mono text-lg text-center tracking-widest"
                    maxLength={6}
                  />
                  {verifyError && <p className="mt-1 text-label-xs text-error">{verifyError}</p>}
                </div>
                <Button onClick={handleVerify} disabled={verifyCode.length !== 6}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Verifikasi
                </Button>
              </div>
            </div>

            <Button variant="ghost" onClick={() => { setStep("idle"); setSecret(""); setUri(""); setVerifyCode(""); setVerifyError(""); }}>
              Batal
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-headline-md flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-surface-container-low p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high">
                <Smartphone className="h-5 w-5 text-on-surface-variant" />
              </div>
              <div>
                <p className="font-medium text-on-surface">Tingkatkan Keamanan Akun</p>
                <p className="text-label-sm text-on-surface-variant">
                  Lindungi akun Anda dengan lapisan keamanan tambahan menggunakan aplikasi authenticator.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-container-low p-3">
              <p className="font-medium text-sm text-on-surface">Kode unik setiap 30 detik</p>
              <p className="text-label-xs text-on-surface-variant">Token TOTP yang berubah secara periodik</p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-3">
              <p className="font-medium text-sm text-on-surface">Berbasis waktu</p>
              <p className="text-label-xs text-on-surface-variant">Menggunakan standar HMAC-SHA1</p>
            </div>
          </div>
          <Button onClick={startSetup}>
            <QrCode className="mr-2 h-4 w-4" />
            Aktifkan MFA
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

function SSOTab() {
  const [configs, setConfigs] = useState<SSOConfig[]>(mockSSOConfigs);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    const result = await testSSOConnection(id);
    setTestResult({ id, ...result });
    setTestingId(null);
  };

  const toggleSSO = (id: string) => {
    setConfigs((prev) => prev.map((c) => c.id === id ? { ...c, enabled: !c.enabled } : c));
  };

  const providerColors: Record<string, string> = {
    saml: "from-blue-500 to-blue-700",
    google_workspace: "from-green-500 to-emerald-700",
    azure_ad: "from-blue-600 to-indigo-700",
    oidc: "from-purple-500 to-purple-700",
  };

  const providerNames: Record<string, string> = {
    saml: "SAML 2.0",
    google_workspace: "Google Workspace",
    azure_ad: "Azure AD",
    oidc: "OpenID Connect",
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-headline-md flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-primary" />
            Single Sign-On (SSO)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-body-sm text-on-surface-variant">
            Konfigurasi SSO untuk memungkinkan pengguna masuk menggunakan akun organisasi mereka.
            Mendukung SAML 2.0, Google Workspace, dan Azure AD.
          </p>
          {configs.map((config) => (
            <GlassPanel key={config.id} className={cn("p-4", !config.enabled && "opacity-60")}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-white text-sm font-bold shrink-0",
                    providerColors[config.provider] ?? "from-gray-500 to-gray-700",
                  )}>
                    {config.provider === "saml" ? "S" : config.provider === "google_workspace" ? "G" : config.provider === "azure_ad" ? "A" : "O"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-on-surface">{config.label}</h3>
                      <Badge variant={config.enabled ? "default" : "secondary"} className="text-label-xs">
                        {config.enabled ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-label-xs text-on-surface-variant">{providerNames[config.provider]}</p>
                    {config.domain && <p className="text-label-xs text-on-surface-variant">Domain: {config.domain}</p>}
                    {config.issuer && <p className="text-label-xs text-on-surface-variant font-mono">Issuer: {config.issuer}</p>}
                    <div className="mt-2 flex gap-3 text-label-xs text-on-surface-variant">
                      <span>Dibuat {new Date(config.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                      {config.lastTestedAt && <span>Terakhir diuji {new Date(config.lastTestedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
                    </div>
                    {testResult && testResult.id === config.id && (
                      <div className={cn(
                        "mt-2 flex items-center gap-1.5 text-label-xs",
                        testResult.success ? "text-success" : "text-error",
                      )}>
                        {testResult.success ? <CheckCircle2 className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {testResult.message}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => handleTest(config.id)} disabled={testingId === config.id || !config.enabled}>
                    {testingId === config.id ? "Menguji..." : "Uji Koneksi"}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => toggleSSO(config.id)}>
                    {config.enabled ? <Unlink className="h-4 w-4 text-warning" /> : <Link2 className="h-4 w-4 text-success" />}
                  </Button>
                </div>
              </div>
            </GlassPanel>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-headline-md">Cara Kerja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-body-sm text-on-surface-variant">
          <p>SSO memungkinkan pengguna masuk menggunakan kredensial organisasi yang sudah ada:</p>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Admin mengkonfigurasi penyedia SSO (SAML/Google Workspace/Azure AD)</li>
            <li>Pengguna memilih "Masuk dengan SSO" di halaman login</li>
            <li>Pengguna diarahkan ke halaman login penyedia SSO</li>
            <li>Setelah verifikasi, pengguna otomatis masuk ke Risalah</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
