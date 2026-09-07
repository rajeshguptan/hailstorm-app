import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import type { SendRequestContext, SendRequestResult } from '../types';

interface WorkerPoolOptions {
  threadCount?: number;
  maxQueueSize?: number;
}

export interface ThreadPoolTask {
  id: string;
  context: SendRequestContext;
  rps?: number;
}

/**
 * WorkerThreadPool - Main Process ThreadPool for concurrent request execution
 * 
 * Provides configurable threadpool for load testing using Node's worker_threads.
 * Each worker executes requests independently, enabling true parallelism.
 */
export class WorkerThreadPool {
  private workers: Worker[] = [];
  private idleWorkers: Worker[] = [];
  private taskQueue: Array<{ task: ThreadPoolTask; resolve: Function; reject: Function }> = [];
  private threadCount: number;

  constructor(options: WorkerPoolOptions = {}) {
    this.threadCount = options.threadCount || require('os').cpus().length;
    if (!isMainThread) return;
    this.initialize();
  }

  private initialize() {
    const workerPath = require('path').join(__dirname, 'runnerWorker.js');
    for (let i = 0; i < this.threadCount; i++) {
      const worker = new Worker(workerPath);
      worker.on('message', this.handleWorkerMessage.bind(this));
      worker.on('error', (err) => console.error('[THREADPOOL] Worker error:', err));
      this.idleWorkers.push(worker);
      this.workers.push(worker);
    }
    console.log(`[THREADPOOL] Initialized with ${this.threadCount} workers`);
  }

interface WorkerMessage {
  taskId: string;
  result?: any;
  error?: string;
}

  private handleWorkerMessage(message: WorkerMessage) {
    const worker = this.workers.find(w => w.threadId === message.taskId);
    if (worker) {
      this.idleWorkers.push(worker);
    }
  }

  async execute(task: ThreadPoolTask): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.idleWorkers.length > 0) {
        const worker = this.idleWorkers.pop()!;
        this.runTask(worker, task, resolve, reject);
      } else {
        this.taskQueue.push({ task, resolve, reject });
      }
    });
  }

  private runTask(
    worker: Worker,
    task: ThreadPoolTask,
    resolve: Function,
    reject: Function
  ) {
    const timeout = setTimeout(() => reject(new Error('Task timeout')), 30000);

    worker.once('message', (result: WorkerMessage) => {
      clearTimeout(timeout);
      this.idleWorkers.push(worker);
      if (this.taskQueue.length > 0) {
        const next = this.taskQueue.shift()!;
        this.runTask(worker, next.task, next.resolve, next.reject);
      }
      if (result.error) reject(new Error(result.error));
      else resolve(result.result);
    });

    worker.postMessage({ ...task, taskId: String(worker.threadId) });
  }

  terminate() {
    for (const worker of this.workers) {
      worker.terminate();
    }
  }
}