/**
 * ============================================================================
 * FILE: replayBuffer.ts
 * MỤC ĐÍCH: Bộ nhớ đệm trải nghiệm (Experience Replay Buffer) cho DQN.
 * THIẾT KẾ: Cấu trúc Ring Buffer (vòng tròn), loại bỏ tương quan giữa các mẫu liên tiếp.
 * ============================================================================
 */

import { Transition } from './types';

export class ReplayBuffer {
  private buffer: Transition[] = [];
  private pointer: number = 0;

  constructor(public readonly capacity: number = 10000) {}

  public push(transition: Transition): void {
    if (this.buffer.length < this.capacity) {
      this.buffer.push(transition);
    } else {
      this.buffer[this.pointer] = transition;
      this.pointer = (this.pointer + 1) % this.capacity;
    }
  }

  public sample(batchSize: number): Transition[] {
    const size = this.buffer.length;
    if (size === 0) return [];
    const count = Math.min(batchSize, size);
    const result: Transition[] = [];

    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * size);
      result.push(this.buffer[idx]);
    }

    return result;
  }

  public size(): number {
    return this.buffer.length;
  }

  public clear(): void {
    this.buffer = [];
    this.pointer = 0;
  }
}
