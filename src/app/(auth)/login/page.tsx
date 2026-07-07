"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { APP_NAME, APP_DESCRIPTION } from "@/config/constants";
import { LogIn, AlertCircle, Building2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const success = await login(email, password);
    setIsLoading(false);

    if (success) {
      router.push("/overview");
    } else {
      setError("Email atau password salah. Gunakan email @sekneg.go.id");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-on-primary">
          S
        </div>
        <h1 className="font-headline text-headline-md text-on-surface">{APP_NAME}</h1>
        <p className="mt-1 text-body-sm text-on-surface-variant">{APP_DESCRIPTION}</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-error-container/10 p-3 text-body-sm text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
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
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Memproses...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            Masuk
          </span>
        )}
      </Button>

      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-label-xs text-on-surface-variant">
          atau
        </span>
      </div>

      <div className="space-y-3">
        <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/overview")}>
          <Building2 className="h-4 w-4" />
          SSO Pemerintah (SAML 2.0)
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/overview")}>
          <ShieldCheck className="h-4 w-4" />
          Google Workspace
        </Button>
      </div>
    </form>
  );
}
