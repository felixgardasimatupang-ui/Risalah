import { NextRequest, NextResponse } from "next/server";
import { mockMeetings, mockTranscripts, mockParticipants } from "@/lib/mock-data";
import { generatePdf, generateDocx } from "@/lib/export-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meetingId, format } = body;

    if (!meetingId || !format) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION", message: "meetingId and format required" } },
        { status: 400 },
      );
    }

    const meeting = mockMeetings.find((m) => m.id === meetingId);
    if (!meeting) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Meeting not found" } },
        { status: 404 },
      );
    }

    const transcript = mockTranscripts[meetingId];
    const content = {
      title: meeting.title,
      date: meeting.date,
      meetingType: meeting.meetingType ?? "",
      participants: mockParticipants.map((p) => ({
        name: p.name,
        position: p.role,
      })),
      transcriptLines: transcript?.lines.map((l) => ({
        speaker: l.speakerName,
        text: l.text,
        timestamp: String(l.timestampMs),
      })),
    };

    let contentType: string;
    let ext: string;

    switch (format) {
      case "pdf": {
        contentType = "application/pdf";
        ext = "pdf";
        const pdf = await generatePdf(content);
        return new NextResponse(pdf as unknown as string, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${meeting.title.replace(/\s+/g, "_")}.${ext}"`,
          },
        });
      }
      case "docx": {
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        ext = "docx";
        const docx = await generateDocx(content);
        return new NextResponse(docx as unknown as string, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${meeting.title.replace(/\s+/g, "_")}.${ext}"`,
          },
        });
      }
      case "txt": {
        ext = "txt";
        contentType = "text/plain";
        const text = [
          content.title,
          `${content.meetingType} | ${content.date}`,
          "",
          "--- Participants ---",
          ...content.participants.map((p) => `${p.name} — ${p.position}`),
          "",
          "--- Transcript ---",
          ...(content.transcriptLines?.map((l) => `[${l.timestamp}] ${l.speaker}: ${l.text}`) || []),
        ].join("\n");
        return new NextResponse(text, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${meeting.title.replace(/\s+/g, "_")}.${ext}"`,
          },
        });
      }
      default:
        return NextResponse.json(
          { success: false, error: { code: "INVALID_FORMAT", message: `Unsupported format: ${format}` } },
          { status: 400 },
        );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "EXPORT_FAILED", message: String(error) } },
      { status: 500 },
    );
  }
}
