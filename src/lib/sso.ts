export type SSOProvider = "saml" | "oidc" | "google_workspace" | "azure_ad";

export interface SSOConfig {
  id: string;
  provider: SSOProvider;
  label: string;
  enabled: boolean;
  issuer?: string;
  entryPoint?: string;
  certificate?: string;
  clientId?: string;
  clientSecret?: string;
  domain?: string;
  createdAt: string;
  lastTestedAt?: string;
}

export const mockSSOConfigs: SSOConfig[] = [
  {
    id: "sso-1",
    provider: "google_workspace",
    label: "Google Workspace - Sekretariat Negara",
    enabled: true,
    domain: "sekneg.go.id",
    clientId: "123456789-abc123.apps.googleusercontent.com",
    createdAt: "2026-06-15T10:00:00",
    lastTestedAt: "2026-07-06T14:00:00",
  },
  {
    id: "sso-2",
    provider: "azure_ad",
    label: "Azure AD - Kementerian Dalam Negeri",
    enabled: false,
    domain: "kemendagri.go.id",
    clientId: "azure-tenant-id-xxx",
    createdAt: "2026-06-20T09:00:00",
  },
  {
    id: "sso-3",
    provider: "saml",
    label: "SAML 2.0 - SSO Pemerintah",
    enabled: true,
    issuer: "https://sso.pemerintah.go.id/saml",
    entryPoint: "https://sso.pemerintah.go.id/saml/sso",
    certificate: "MIID... (self-signed)",
    createdAt: "2026-05-01T08:00:00",
    lastTestedAt: "2026-07-05T11:30:00",
  },
];

export async function testSSOConnection(configId: string): Promise<{ success: boolean; message: string }> {
  await new Promise((r) => setTimeout(r, 500));
  const config = mockSSOConfigs.find((c) => c.id === configId);
  if (!config) return { success: false, message: "Konfigurasi tidak ditemukan" };
  if (!config.enabled) return { success: false, message: "SSO tidak aktif" };
  return { success: true, message: "Koneksi berhasil" };
}

export function getSSOLoginUrl(provider: SSOProvider, domain?: string): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const relayState = `${baseUrl}/api/auth/sso/callback`;
  switch (provider) {
    case "google_workspace":
      return `https://accounts.google.com/o/saml2/initsso?idpid=${domain}&RelayState=${relayState}`;
    case "azure_ad":
      return `https://login.microsoftonline.com/${domain}/saml2?RelayState=${relayState}`;
    case "saml":
      return `https://sso.pemerintah.go.id/saml/sso?RelayState=${relayState}`;
    default:
      return relayState;
  }
}
