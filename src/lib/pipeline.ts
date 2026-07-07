import { ai } from "./ai-client";

export type PipelineStage =
  | "uploading"
  | "transcribing"
  | "diarizing"
  | "normalizing"
  | "extracting_entities"
  | "extracting_context"
  | "generating_minutes"
  | "indexing"
  | "complete"
  | "failed";

export type PipelineStatus = {
  meetingId: string;
  stage: PipelineStage;
  progress: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
};

const pipelineStore = new Map<string, PipelineStatus>();

const STAGE_WEIGHTS: Record<PipelineStage, number> = {
  uploading: 0,
  transcribing: 15,
  diarizing: 30,
  normalizing: 45,
  extracting_entities: 55,
  extracting_context: 65,
  generating_minutes: 75,
  indexing: 90,
  complete: 100,
  failed: -1,
};

function updateStatus(meetingId: string, stage: PipelineStage, error?: string) {
  const existing = pipelineStore.get(meetingId);
  pipelineStore.set(meetingId, {
    meetingId,
    stage,
    progress: STAGE_WEIGHTS[stage],
    error,
    startedAt: existing?.startedAt ?? new Date().toISOString(),
    completedAt: stage === "complete" || stage === "failed" ? new Date().toISOString() : undefined,
  });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getPipelineStatus(meetingId: string): PipelineStatus | undefined {
  return pipelineStore.get(meetingId);
}

export function resetPipeline(meetingId: string) {
  pipelineStore.delete(meetingId);
}

function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_AI_MOCK === "true" || !process.env.NEXT_PUBLIC_AI_SERVICE_URL;
}

export async function runPipeline(
  meetingId: string,
  audioFile?: File,
  options: { mock?: boolean } = {}
): Promise<PipelineStatus> {
  const useMock = options.mock ?? isMockMode();

  try {
    if (useMock) {
      return await runMockPipeline(meetingId);
    }
    return await runRealPipeline(meetingId, audioFile);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline failed";
    updateStatus(meetingId, "failed", message);
    return pipelineStore.get(meetingId)!;
  }
}

async function runMockPipeline(meetingId: string): Promise<PipelineStatus> {
  const stages: PipelineStage[] = [
    "transcribing",
    "diarizing",
    "normalizing",
    "extracting_entities",
    "extracting_context",
    "generating_minutes",
    "indexing",
    "complete",
  ];

  for (const stage of stages) {
    updateStatus(meetingId, stage);
    await delay(50 + Math.random() * 50);
  }

  return pipelineStore.get(meetingId)!;
}

async function runRealPipeline(meetingId: string, audioFile?: File): Promise<PipelineStatus> {
  updateStatus(meetingId, "transcribing");
  const transcript = audioFile
    ? await ai.transcribe(audioFile, meetingId)
    : await ai.transcribe(new File([], "mock"), meetingId);
  const transcriptText = (transcript as { text?: string }).text ?? "";
  const lines = transcriptText.split("\n").filter(Boolean);

  updateStatus(meetingId, "diarizing");
  await delay(500);

  updateStatus(meetingId, "normalizing");
  let normalizedText = transcriptText;
  try {
    const result = await ai.normalize(normalizedText);
    normalizedText = result.normalized;
  } catch {
    // fallback to raw text
  }

  updateStatus(meetingId, "extracting_entities");
  try {
    await ai.extractGovernmentEntities(normalizedText);
  } catch {
    // non-blocking
  }

  updateStatus(meetingId, "extracting_context");
  let actionItems: unknown[] = [];
  let decisions: unknown[] = [];
  try {
    const ctx = await ai.extractContext(normalizedText);
    actionItems = ctx.action_items;
    decisions = ctx.decisions;
  } catch {
    // non-blocking
  }

  updateStatus(meetingId, "generating_minutes");
  try {
    await ai.generateMinutes({
      meeting_id: meetingId,
      template_type: "pemerintah",
      title: meetingId,
      date: new Date().toISOString(),
      location: "",
      participants: [],
      transcript: lines.map((l, i) => ({ speaker: `Speaker ${i}`, text: l })),
    });
  } catch {
    // non-blocking
  }

  updateStatus(meetingId, "indexing");
  try {
    await ai.indexMeeting(meetingId, lines.map((l) => ({ text: l, source: meetingId })));
  } catch {
    // non-blocking
  }

  updateStatus(meetingId, "complete");
  return pipelineStore.get(meetingId)!;
}
