/**
 * ============================================================================
 * FILE: dqnAgent.ts
 * MỤC ĐÍCH: Hiện thực thuật toán Deep Q-Network (DQN) chuẩn học thuật
 *           cho bài toán Sàng lọc hồ sơ ứng viên theo hạn ngạch tuyển dụng.
 * TÀI LIỆU THAM CHIẾU: MDP.md (Phần 2: Thuật toán 1 - DQN Sàng lọc CV)
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { CandidateAction } from '../envs/dqn/types';
import { CandidateScreeningEnv } from '../envs/dqn/candidateScreeningEnv';
import { QNetwork } from './neuralNetwork';
import { ReplayBuffer } from './replayBuffer';
import { DQNAgentConfig, TrainingMetric, Transition } from './types';

export class DQNAgent {
  public config: Required<DQNAgentConfig>;
  public policyNet: QNetwork;
  public targetNet: QNetwork;
  public replayBuffer: ReplayBuffer;
  public epsilon: number;
  public stepCount: number = 0;

  constructor(customConfig?: DQNAgentConfig) {
    this.config = {
      stateDim: customConfig?.stateDim ?? 24,
      actionDim: customConfig?.actionDim ?? 3,
      hiddenDims: customConfig?.hiddenDims ?? [128, 64],
      learningRate: customConfig?.learningRate ?? 0.0005,
      gamma: customConfig?.gamma ?? 0.95,
      epsilonStart: customConfig?.epsilonStart ?? 1.0,
      epsilonEnd: customConfig?.epsilonEnd ?? 0.05,
      epsilonDecay: customConfig?.epsilonDecay ?? 0.995,
      bufferCapacity: customConfig?.bufferCapacity ?? 10000,
      batchSize: customConfig?.batchSize ?? 32,
      targetUpdateFreq: customConfig?.targetUpdateFreq ?? 50,
      tau: customConfig?.tau ?? 0.005,
    };

    this.policyNet = new QNetwork(
      this.config.stateDim,
      this.config.hiddenDims,
      this.config.actionDim,
      this.config.learningRate
    );

    this.targetNet = new QNetwork(
      this.config.stateDim,
      this.config.hiddenDims,
      this.config.actionDim,
      this.config.learningRate
    );

    // Đồng bộ trọng số ban đầu của Target Network = Policy Network
    this.targetNet.copyWeightsFrom(this.policyNet, 1.0);

    this.replayBuffer = new ReplayBuffer(this.config.bufferCapacity);
    this.epsilon = this.config.epsilonStart;
  }

  /**
   * Dự đoán Q-values cho một trạng thái cụ thể
   */
  public getQValues(state: number[]): number[] {
    return this.policyNet.forward(state);
  }

  /**
   * Chọn hành động theo chiến lược Epsilon-greedy
   */
  public selectAction(state: number[], epsilonOverride?: number): CandidateAction {
    const eps = epsilonOverride !== undefined ? epsilonOverride : this.epsilon;

    if (Math.random() < eps) {
      // Khám phá (Exploration): Chọn ngẫu nhiên 1 trong 3 hành động
      const randomAction = Math.floor(Math.random() * this.config.actionDim);
      return randomAction as CandidateAction;
    }

    // Khai thác (Exploitation): Chọn hành động có Q-value lớn nhất
    const qValues = this.policyNet.forward(state);
    let maxAction = 0;
    let maxQ = qValues[0];

    for (let a = 1; a < qValues.length; a++) {
      if (qValues[a] > maxQ) {
        maxQ = qValues[a];
        maxAction = a;
      }
    }

    return maxAction as CandidateAction;
  }

  /**
   * Lưu trữ transition vào Replay Buffer
   */
  public remember(
    state: number[],
    action: CandidateAction | number,
    reward: number,
    nextState: number[],
    done: boolean
  ): void {
    this.replayBuffer.push({ state, action, reward, nextState, done });
  }

  /**
   * Cập nhật một bước huấn luyện mạng DQN theo Bellman MSE Loss
   */
  public trainStep(): number {
    if (this.replayBuffer.size() < this.config.batchSize) {
      return 0.0;
    }

    const batch: Transition[] = this.replayBuffer.sample(this.config.batchSize);
    let totalLoss = 0.0;

    for (const transition of batch) {
      const { state, action, reward, nextState, done } = transition;

      // 1. Tính toán giá trị dự đoán hiện tại Q(s, a; theta)
      const currentQ = this.policyNet.forward(state);

      // 2. Tính toán mục tiêu Bellman Target: y = r + gamma * max_a' Q(s', a'; theta^-) * (1 - done)
      let targetVal = reward;
      if (!done) {
        const nextQ = this.targetNet.forward(nextState);
        const maxNextQ = Math.max(...nextQ);
        targetVal += this.config.gamma * maxNextQ;
      }

      // 3. Tính gradient sai số: dL / dQ_a = (Q(s, a) - targetVal)
      // Đối với các hành động khác không được chọn, gradient = 0
      const gradOutput = [0, 0, 0];
      const error = currentQ[action] - targetVal;
      gradOutput[action] = Math.max(-1.0, Math.min(1.0, error)); // Huber Gradient Clipping [-1, 1]

      totalLoss += error * error;

      // 4. Lan truyền ngược và cập nhật trọng số Policy Network
      this.policyNet.trainOnGradient(gradOutput);
    }

    this.stepCount += 1;

    // 5. Cập nhật Target Network định kỳ (Soft Update Polyak hoặc Hard Update)
    if (this.stepCount % this.config.targetUpdateFreq === 0) {
      this.targetNet.copyWeightsFrom(this.policyNet, this.config.tau);
    }

    return totalLoss / batch.length;
  }

  /**
   * Suy giảm epsilon sau mỗi episode
   */
  public decayEpsilon(): void {
    this.epsilon = Math.max(
      this.config.epsilonEnd,
      this.epsilon * this.config.epsilonDecay
    );
  }

  /**
   * Vòng lặp huấn luyện đầy đủ theo Algorithm 1 trong MDP.md
   */
  public async train(
    env: CandidateScreeningEnv,
    episodes: number = 200,
    onEpisodeEnd?: (metric: TrainingMetric) => void
  ): Promise<TrainingMetric[]> {
    const history: TrainingMetric[] = [];

    for (let ep = 1; ep <= episodes; ep++) {
      let state = env.reset();
      let done = false;
      let epReward = 0;
      let epLossSum = 0;
      let epSteps = 0;

      while (!done) {
        const action = this.selectAction(state);
        const stepResult = env.step(action);

        this.remember(state, action, stepResult.reward, stepResult.state, stepResult.done);

        const loss = this.trainStep();
        epLossSum += loss;
        epSteps += 1;
        epReward += stepResult.reward;

        state = stepResult.state;
        done = stepResult.done;
      }

      this.decayEpsilon();

      const acceptedList = env.getAcceptedCandidates();
      const avgScore =
        acceptedList.length > 0
          ? acceptedList.reduce((acc, c) => acc + c.score, 0) / acceptedList.length
          : 0;

      const metric: TrainingMetric = {
        episode: ep,
        reward: Number(epReward.toFixed(2)),
        loss: Number((epLossSum / Math.max(1, epSteps)).toFixed(4)),
        epsilon: Number(this.epsilon.toFixed(3)),
        acceptedCount: acceptedList.length,
        avgAcceptedScore: Number(avgScore.toFixed(1)),
        kRemain: env.getKRemain(),
      };

      history.push(metric);
      if (onEpisodeEnd) {
        onEpisodeEnd(metric);
      }
    }

    return history;
  }

  /**
   * Lưu trọng số mô hình ra tệp JSON
   */
  public saveWeights(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = {
      config: this.config,
      policyWeights: this.policyNet.getWeights(),
      stepCount: this.stepCount,
      epsilon: this.epsilon,
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Nạp trọng số mô hình từ tệp JSON
   */
  public loadWeights(filePath: string): boolean {
    try {
      if (!fs.existsSync(filePath)) {
        return false;
      }
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      if (data.policyWeights) {
        this.policyNet.setWeights(data.policyWeights);
        this.targetNet.copyWeightsFrom(this.policyNet, 1.0);
        if (typeof data.epsilon === 'number') {
          this.epsilon = data.epsilon;
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
