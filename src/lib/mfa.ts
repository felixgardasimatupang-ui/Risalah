export interface MfaSecret {
  secret: string;
  uri: string;
  qrCodeUrl: string;
}

export async function generateMfaSecret(email: string): Promise<MfaSecret> {
  const { createSecret, generateTOTPUri } = await import("./totp");
  const secret = createSecret();
  const uri = generateTOTPUri({ secret, email, issuer: "Risalah SEKNEG" });

  return {
    secret,
    uri,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`,
  };
}

export async function verifyMfaToken(secret: string, token: string): Promise<boolean> {
  const { verifyTOTP } = await import("./totp");
  return verifyTOTP({ secret, token });
}
