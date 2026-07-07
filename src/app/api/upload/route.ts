import { NextResponse } from "next/server";
import { getTokenFromCookie, verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const token = getTokenFromCookie(request);
    if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    await verifyToken(token);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const meetingId = formData.get("meetingId") as string | null;

    if (!file || !meetingId) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "File and meetingId are required" } }, { status: 400 });
    }

    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/ogg", "audio/webm", "video/mp4", "video/webm"];
    const maxSize = 500 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: { code: "INVALID_TYPE", message: "File type not supported. Supported: MP3, WAV, M4A, OGG, WebM, MP4" } }, { status: 400 });
    }

    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: { code: "FILE_TOO_LARGE", message: "File exceeds maximum size of 500MB" } }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        filename: file.name,
        size: file.size,
        type: file.type,
        message: "File received. Processing pipeline will start shortly.",
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
