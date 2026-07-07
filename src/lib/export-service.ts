import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from "docx";

type ExportContent = {
  title: string;
  date: string;
  meetingType: string;
  participants: { name: string; position: string }[];
  transcriptLines?: { speaker: string; text: string; timestamp: string }[];
  summary?: {
    keyPoints: string[];
    decisions: string[];
    actionItems: { task: string; pic: string; deadline: string }[];
  };
};

export async function generatePdf(content: ExportContent): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();
  let y = height - 50;

  function addText(text: string, opts: { size?: number; bold?: boolean; color?: readonly [number, number, number] } = {}) {
    const f = opts.bold ? bold : font;
    page.drawText(text, {
      x: 50,
      y,
      size: opts.size ?? 11,
      font: f,
      color: opts.color ? rgb(...opts.color) : rgb(0, 0, 0),
    });
    y -= (opts.size ?? 11) + 4;
  }

  function checkPage() {
    if (y < 80) {
      page = doc.addPage([595, 842]);
      y = height - 50;
    }
  }

  addText(content.title, { size: 18, bold: true });
  addText(`${content.meetingType} | ${content.date}`, { size: 10, color: [0.4, 0.4, 0.4] as const });
  y -= 10;

  addText("Peserta Rapat:", { size: 12, bold: true });
  for (const p of content.participants) {
    checkPage();
    addText(`  ${p.name} — ${p.position}`, { size: 10 });
  }
  y -= 10;

  if (content.summary) {
    const s = content.summary;

    addText("Poin Penting:", { size: 12, bold: true });
    for (const kp of s.keyPoints) {
      checkPage();
      addText(`  • ${kp}`, { size: 10 });
    }
    y -= 10;

    addText("Keputusan:", { size: 12, bold: true });
    for (const d of s.decisions) {
      checkPage();
      addText(`  • ${d}`, { size: 10 });
    }
    y -= 10;

    if (s.actionItems.length > 0) {
      addText("Action Items:", { size: 12, bold: true });
      for (const ai of s.actionItems) {
        checkPage();
        addText(`  • ${ai.task} — PIC: ${ai.pic} — Deadline: ${ai.deadline}`, { size: 10 });
      }
    }
  }

  if (content.transcriptLines) {
    y -= 10;
    addText("Transkrip:", { size: 12, bold: true });
    for (const tl of content.transcriptLines) {
      checkPage();
      addText(`[${tl.timestamp}] ${tl.speaker}: ${tl.text}`, { size: 9 });
    }
  }

  return await doc.save();
}

function heading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28 })],
    spacing: { before: 300, after: 200 },
  });
}

function bodyText(text: string, opts?: { size?: number; spacing?: number }): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: opts?.size ?? 22 })],
    spacing: { after: opts?.spacing ?? 80 },
  });
}

export async function generateDocx(content: ExportContent): Promise<Uint8Array> {
  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: content.title, bold: true, size: 36 })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: `${content.meetingType} | ${content.date}`, size: 20, color: "666666" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  );

  children.push(
    heading("Peserta Rapat:"),
    ...content.participants.map(
      (p) => bodyText(`${p.name} — ${p.position}`, { spacing: 100 }),
    ),
  );

  if (content.summary) {
    const s = content.summary;

    children.push(heading("Poin Penting:"));
    for (const kp of s.keyPoints) {
      children.push(bodyText(`• ${kp}`));
    }

    children.push(heading("Keputusan:"));
    for (const d of s.decisions) {
      children.push(bodyText(`• ${d}`));
    }

    if (s.actionItems.length > 0) {
      children.push(heading("Action Items:"));
      const rows: TableRow[] = [
        new TableRow({
          tableHeader: true,
          children: ["Tugas", "PIC", "Deadline"].map(
            (h) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                shading: { fill: "E5E7EB", type: ShadingType.CLEAR },
              }),
          ),
        }),
      ];
      for (const ai of s.actionItems) {
        rows.push(
          new TableRow({
            children: [ai.task, ai.pic, ai.deadline].map(
              (c) =>
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: c })] })],
                }),
            ),
          }),
        );
      }
      children.push(
        new Table({
          rows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
      );
    }
  }

  if (content.transcriptLines) {
    children.push(heading("Transkrip:"));
    for (const tl of content.transcriptLines) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `[${tl.timestamp}] ${tl.speaker}: ${tl.text}`, size: 20 })],
          spacing: { after: 60 },
        }),
      );
    }
  }

  const doc = new DocxDocument({ sections: [{ children }] });
  return new Uint8Array(await Packer.toBuffer(doc));
}
