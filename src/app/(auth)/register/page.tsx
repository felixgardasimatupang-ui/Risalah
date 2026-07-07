"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_NAME, APP_DESCRIPTION } from "@/config/constants";
import { UserPlus, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [position, setPosition] = useState("");
  const [nip, setNip] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await register({ name, email, password, position, nip });
    setIsLoading(false);

    if (result.success) {
      router.push("/overview");
    } else {
      setError(result.error ?? "Registrasi gagal");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-on-primary">
          S
        </div>
        <h1 className="font-headline text-headline-md text-on-surface">Buat Akun Baru</h1>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          Daftarkan akun {APP_NAME} Anda
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-error-container/10 p-3 text-body-sm text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-label-sm text-on-surface-variant" htmlFor="name">
            Nama Lengkap
          </label>
          <Input
            id="name"
            type="text"
            placeholder="Dr. Andi Pratama, M.Si."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-label-sm text-on-surface-variant" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="nama@sekneg.go.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-label-sm text-on-surface-variant" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="Minimal 8 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-label-sm text-on-surface-variant" htmlFor="position">
              Jabatan
            </label>
            <Input
              id="position"
              type="text"
              placeholder="Analis Kebijakan"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-label-sm text-on-surface-variant" htmlFor="nip">
              NIP
            </label>
            <Input
              id="nip"
              type="text"
              placeholder="199001012010011001"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Mendaftarkan...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Daftar
            </span>
          )}
        </Button>

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-body-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-3 w-3" />
          Sudah punya akun? Masuk
        </Link>
      </div>
    </form>
  );
}
