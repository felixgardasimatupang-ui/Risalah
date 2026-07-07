import nodemailer from "nodemailer";

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: parseInt(process.env.SMTP_PORT || "587") === 465,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const FROM = process.env.EMAIL_FROM || "noreply@risalah.sekneg.go.id";

export async function sendEmail(options: EmailOptions) {
  await transporter.sendMail({
    from: `"Risalah SEKNEG" <${FROM}>`,
    ...options,
  });
}

export function emailTemplateWelcome(name: string, email: string, password: string) {
  return {
    to: email,
    subject: "Selamat Datang di Risalah SEKNEG AI",
    html: `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
<h1 style="color: #1e3a5f;">Selamat Datang, ${name}!</h1>
<p>Akun Anda telah dibuat di platform Risalah SEKNEG AI.</p>
<p><strong>Email:</strong> ${email}<br><strong>Password:</strong> ${password}</p>
<p style="color: #666;">Silakan login dan ubah password Anda segera.</p>
<a href="${APP_URL}/login" style="display:inline-block;padding:12px 24px;background:#1e3a5f;color:#fff;text-decoration:none;border-radius:6px;">Login ke Risalah</a>
<hr style="margin-top:24px;"><p style="font-size:12px;color:#999;">Sekretariat Negara Republik Indonesia</p></div>`,
  };
}

export function emailTemplateMeetingInvitation(
  inviteeName: string,
  inviterName: string,
  meetingTitle: string,
  meetingDate: string,
  meetingId: string,
) {
  return {
    to: inviteeName,
    subject: `Undangan Rapat: ${meetingTitle}`,
    html: `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
<h1 style="color: #1e3a5f;">Undangan Rapat</h1>
<p><strong>${inviterName}</strong> mengundang Anda untuk menghadiri rapat:</p>
<div style="background:#f5f7fa;padding:16px;border-radius:8px;margin:16px 0;">
  <p><strong>${meetingTitle}</strong></p>
  <p>📅 ${meetingDate}</p>
</div>
<a href="${APP_URL}/meetings/${meetingId}" style="display:inline-block;padding:12px 24px;background:#1e3a5f;color:#fff;text-decoration:none;border-radius:6px;">Lihat Detail Rapat</a>
<hr style="margin-top:24px;"><p style="font-size:12px;color:#999;">Sekretariat Negara Republik Indonesia</p></div>`,
  };
}

export function emailTemplateActionItem(
  assigneeName: string,
  assignorName: string,
  actionItem: string,
  deadline: string,
  meetingTitle: string,
) {
  return {
    to: assigneeName,
    subject: `Action Item: ${actionItem}`,
    html: `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
<h1 style="color: #1e3a5f;">Action Item Baru</h1>
<p><strong>${assignorName}</strong> menugaskan Anda:</p>
<div style="background:#fff3cd;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #ffc107;">
  <p>${actionItem}</p>
  <p><strong>Batas:</strong> ${deadline}</p>
  <p><strong>Rapat:</strong> ${meetingTitle}</p>
</div>
<hr style="margin-top:24px;"><p style="font-size:12px;color:#999;">Sekretariat Negara Republik Indonesia</p></div>`,
  };
}
