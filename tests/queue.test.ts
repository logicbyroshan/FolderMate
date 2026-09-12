import { describe, it, expect } from "vitest";
import { JobQueue } from "../apps/engine/src/queue/job-queue.js";

describe("JobQueue Priority & State Machine", () => {
  it("should process jobs in priority order", async () => {
    const queue = new JobQueue(1, 50); // Serial execution to verify order
    const executionOrder: string[] = [];

    queue.registerHandler("TEST_JOB", async (job) => {
      executionOrder.push(job.payload.name);
      return { ok: true };
    });

    // Enqueue low priority job first, then high priority
    queue.enqueue("TEST_JOB", { name: "Low Priority 1" }, 20);
    queue.enqueue("TEST_JOB", { name: "High Priority Urgent" }, 1);
    queue.enqueue("TEST_JOB", { name: "Medium Priority" }, 10);

    // Allow jobs to resolve
    await new Promise((r) => setTimeout(r, 100));

    expect(executionOrder).toEqual([
      "Low Priority 1", // Started immediately because queue was idle
      "High Priority Urgent",
      "Medium Priority",
    ]);
  });

  it("should retry failed jobs up to maxRetries", async () => {
    const queue = new JobQueue(2, 50); // Fast backoff (50ms, 100ms) for testing
    let attempts = 0;

    queue.registerHandler("FAILING_JOB", async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error("Temporary locked file error");
      }
      return { success: true };
    });

    queue.enqueue("FAILING_JOB", {}, 5, 3);

    // Wait for retries
    await new Promise((r) => setTimeout(r, 500));

    expect(attempts).toBe(3);
  });
});
