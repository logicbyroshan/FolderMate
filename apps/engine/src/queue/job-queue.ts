import { EventEmitter } from "events";

export interface QueueJob<T = any> {
  id: string;
  type: string;
  payload: T;
  priority: number; // lower number = higher priority
  retries: number;
  maxRetries: number;
  createdAt: number;
}

export type JobHandler<T = any, R = any> = (job: QueueJob<T>) => Promise<R>;

export class JobQueue extends EventEmitter {
  private queue: QueueJob[] = [];
  private activeJobs: Set<string> = new Set();
  private handlers: Map<string, JobHandler> = new Map();
  private concurrency: number;
  private baseBackoffMs: number;

  constructor(concurrency: number = 4, baseBackoffMs: number = 200) {
    super();
    this.concurrency = concurrency;
    this.baseBackoffMs = baseBackoffMs;
  }

  public registerHandler<T, R>(type: string, handler: JobHandler<T, R>): void {
    this.handlers.set(type, handler);
  }

  public enqueue<T>(type: string, payload: T, priority: number = 10, maxRetries: number = 3): string {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const job: QueueJob<T> = {
      id,
      type,
      payload,
      priority,
      retries: 0,
      maxRetries,
      createdAt: Date.now(),
    };

    // Insert sorted by priority
    const insertIdx = this.queue.findIndex((j) => j.priority > priority);
    if (insertIdx === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(insertIdx, 0, job);
    }

    this.emit("job-enqueued", job);
    this.processNext();
    return id;
  }

  public getQueueStats() {
    return {
      pending: this.queue.length,
      active: this.activeJobs.size,
    };
  }

  private async processNext(): Promise<void> {
    if (this.activeJobs.size >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    const handler = this.handlers.get(job.type);
    if (!handler) {
      this.emit("job-error", { job, error: new Error(`No handler registered for job type: ${job.type}`) });
      return;
    }

    this.activeJobs.add(job.id);
    this.emit("job-started", job);

    try {
      const result = await handler(job);
      this.activeJobs.delete(job.id);
      this.emit("job-completed", { job, result });
    } catch (err: any) {
      this.activeJobs.delete(job.id);

      if (job.retries < job.maxRetries) {
        job.retries++;
        const backoffMs = Math.min(this.baseBackoffMs * Math.pow(2, job.retries - 1), 10000);
        setTimeout(() => {
          this.queue.unshift(job);
          this.processNext();
        }, backoffMs);
        this.emit("job-retry", { job, error: err, nextRetryInMs: backoffMs });
      } else {
        this.emit("job-failed", { job, error: err });
      }
    } finally {
      this.processNext();
    }
  }
}
