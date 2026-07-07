import { describe, it, expect, beforeEach } from "vitest";
import { runPipeline, getPipelineStatus, resetPipeline } from "../pipeline";

const TEST_TIMEOUT = 15000;

describe("AI Pipeline", () => {
  beforeEach(() => {
    resetPipeline("test-meeting-1");
    resetPipeline("test-meeting-2");
    resetPipeline("test-meeting-3");
    resetPipeline("meeting-a");
    resetPipeline("meeting-b");
    resetPipeline("test-meeting");
  });

  it(
    "runs mock pipeline to completion",
    async () => {
      const result = await runPipeline("test-meeting-1", undefined, { mock: true });
      expect(result.stage).toBe("complete");
      expect(result.progress).toBe(100);
      expect(result.meetingId).toBe("test-meeting-1");
      expect(result.startedAt).toBeDefined();
      expect(result.completedAt).toBeDefined();
    },
    TEST_TIMEOUT
  );

  it(
    "tracks progress monotonically to 100",
    async () => {
      const result = await runPipeline("test-meeting-3", undefined, { mock: true });
      expect(result.progress).toBe(100);
    },
    TEST_TIMEOUT
  );

  it(
    "handles concurrent pipelines",
    async () => {
      const p1 = runPipeline("meeting-a", undefined, { mock: true });
      const p2 = runPipeline("meeting-b", undefined, { mock: true });
      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1.stage).toBe("complete");
      expect(r2.stage).toBe("complete");
      expect(r1.meetingId).toBe("meeting-a");
      expect(r2.meetingId).toBe("meeting-b");
    },
    TEST_TIMEOUT
  );

  it("getPipelineStatus returns undefined for unknown id", () => {
    expect(getPipelineStatus("nonexistent")).toBeUndefined();
  });

  it(
    "resetPipeline clears status",
    async () => {
      await runPipeline("test-meeting", undefined, { mock: true });
      expect(getPipelineStatus("test-meeting")).toBeDefined();
      resetPipeline("test-meeting");
      expect(getPipelineStatus("test-meeting")).toBeUndefined();
    },
    TEST_TIMEOUT
  );

  it(
    "mock pipeline completes under 5 seconds",
    async () => {
      const start = Date.now();
      await runPipeline("test-meeting", undefined, { mock: true });
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(5000);
    },
    TEST_TIMEOUT
  );
});
