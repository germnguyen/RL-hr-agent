import { CandidateAction } from '../envs/dqn/types';

export interface Transition {
  state: number[];
  action: CandidateAction | number;
  reward: number;
  nextState: number[];
  done: boolean;
}

export interface DQNAgentConfig {
  stateDim?: number;          // Mặc định: 24 chiều
  actionDim?: number;         // Mặc định: 3 actions (REJECT, ACCEPT, HOLD)
  hiddenDims?: number[];      // Mặc định: [128, 64]
  learningRate?: number;      // Mặc định: 0.0005
  gamma?: number;             // Hệ số chiết khấu, mặc định: 0.95
  epsilonStart?: number;      // Mặc định: 1.0
  epsilonEnd?: number;        // Mặc định: 0.05
  epsilonDecay?: number;      // Mặc định: 0.995
  bufferCapacity?: number;    // Mặc định: 10000
  batchSize?: number;         // Mặc định: 32
  targetUpdateFreq?: number;  // Cập nhật target net mỗi C bước (mặc định: 50)
  tau?: number;               // Polyak soft update (mặc định: 0.005)
}

export interface TrainingMetric {
  episode: number;
  reward: number;
  loss: number;
  epsilon: number;
  acceptedCount: number;
  avgAcceptedScore: number;
  kRemain: number;
}
