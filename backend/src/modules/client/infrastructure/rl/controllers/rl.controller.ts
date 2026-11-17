/**
 * ============================================================================
 * FILE: rl.controller.ts
 * MỤC ĐÍCH: Controller xử lý các yêu cầu huấn luyện và mô phỏng DQN từ client
 * ============================================================================
 */

import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { CandidateScreeningEnv } from '../envs/dqn/candidateScreeningEnv';
import { DQNAgent } from '../core/dqnAgent';
import { CandidateAction, CandidatePoolItem } from '../envs/dqn/types';

// Singleton instance của DQN Agent phục vụ API runtime
let agentInstance: DQNAgent | null = null;

const weightsPath = path.resolve(__dirname, '../../../../../../weights/dqn_baseline.json');
const synthPath = path.resolve(__dirname, '../data/synthetic_candidates.json');
const realPath = path.resolve(__dirname, '../data/real_candidates.json');

function getOrInitAgent(): DQNAgent {
  if (!agentInstance) {
    agentInstance = new DQNAgent();
    if (fs.existsSync(weightsPath)) {
      agentInstance.loadWeights(weightsPath);
    }
  }
  return agentInstance;
}

/**
 * [GET] /api/v1/rl/datasets
 * Trả về danh sách hồ sơ ứng viên của cả 2 tập dữ liệu TH1 (Ảo) và TH2 (Thật)
 */
export const getDatasetsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const synthData: CandidatePoolItem[] = JSON.parse(fs.readFileSync(synthPath, 'utf-8'));
    const realData: CandidatePoolItem[] = JSON.parse(fs.readFileSync(realPath, 'utf-8'));

    res.status(200).json({
      success: true,
      message: 'Lấy dữ liệu thành công',
      synthetic: synthData,
      real: realData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tải tập dữ liệu',
    });
  }
};

/**
 * [POST] /api/v1/rl/train
 * Kích hoạt huấn luyện mô hình DQN trực tiếp từ giao diện web
 */
export const trainDqnHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const episodes = Number(req.body.episodes) || 100;
    const env = new CandidateScreeningEnv({
      defaultBudgetK: 5,
      defaultPoolSize: 30,
      terminateOnQuotaFilled: true,
    });

    const agent = new DQNAgent({
      learningRate: 0.0005,
      gamma: 0.95,
      epsilonStart: 1.0,
      epsilonEnd: 0.05,
      epsilonDecay: 0.985,
    });

    const history = await agent.train(env, Math.min(300, Math.max(10, episodes)));

    // Lưu lại trọng số sau huấn luyện và cập nhật instance hiện tại
    agent.saveWeights(weightsPath);
    agentInstance = agent;

    res.status(200).json({
      success: true,
      message: `Huấn luyện thành công ${episodes} episodes!`,
      history,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi trong quá trình huấn luyện DQN',
    });
  }
};

/**
 * [POST] /api/v1/rl/simulate
 * Chạy suy luận (Inference với epsilon = 0) trên TH1 hoặc TH2 với ngân sách K
 */
export const simulateScreeningHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const datasetType = req.body.datasetType === 'real' ? 'real' : 'synthetic';
    const budgetK = Number(req.body.budgetK) || 5;

    const dataFilePath = datasetType === 'real' ? realPath : synthPath;
    const candidatePool: CandidatePoolItem[] = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

    const agent = getOrInitAgent();

    const env = new CandidateScreeningEnv({
      defaultBudgetK: budgetK,
      defaultPoolSize: candidatePool.length,
      terminateOnQuotaFilled: true,
    });

    let state = env.reset(candidatePool, budgetK);
    let done = false;
    let stepCount = 0;
    const evaluatedDecisions: any[] = [];

    while (!done && stepCount < candidatePool.length) {
      const currentCand = candidatePool[stepCount];
      const qValues = agent.getQValues(state);
      const action = agent.selectAction(state, 0.0); // Khai thác 100%
      const stepResult = env.step(action);

      let actionLabel = 'REJECT';
      let reasoning = 'Điểm chưa đạt chuẩn phỏng vấn (dưới 75)';
      if (action === CandidateAction.ACCEPT) {
        actionLabel = 'ACCEPT';
        reasoning = currentCand.score >= 85
          ? 'Nhân tài xuất sắc - Q(ACCEPT) vượt trội'
          : 'Hồ sơ đạt chuẩn phỏng vấn';
      } else if (action === CandidateAction.HOLD) {
        actionLabel = 'HOLD';
        reasoning = 'Hồ sơ tiềm năng, tạm giữ xem xét sau';
      }

      evaluatedDecisions.push({
        step: stepCount + 1,
        candidateId: currentCand.id,
        name: currentCand.name,
        score: currentCand.score,
        tier: (currentCand.rawInfo as any)?.tier ?? 'N/A',
        rawInfo: currentCand.rawInfo,
        qValues: qValues.map((v) => Number(v.toFixed(2))),
        action,
        actionLabel,
        reward: Number(stepResult.reward.toFixed(2)),
        kRemain: env.getKRemain(),
        reasoning,
        status: 'evaluated',
      });

      state = stepResult.state;
      done = stepResult.done;
      stepCount++;
    }

    // Đối với các ứng viên còn lại chưa được xét do đã đủ chỉ tiêu K:
    const allDecisions = [...evaluatedDecisions];
    for (let i = stepCount; i < candidatePool.length; i++) {
      const unScreened = candidatePool[i];
      allDecisions.push({
        step: i + 1,
        candidateId: unScreened.id,
        name: unScreened.name,
        score: unScreened.score,
        tier: (unScreened.rawInfo as any)?.tier ?? 'N/A',
        rawInfo: unScreened.rawInfo,
        qValues: [0, 0, 0],
        action: -1,
        actionLabel: 'SKIPPED',
        reward: 0,
        kRemain: 0,
        reasoning: 'Đã tuyển đủ chỉ tiêu K suất phỏng vấn - Bỏ qua xét duyệt',
        status: 'skipped',
      });
    }

    const accepted = env.getAcceptedCandidates();
    const rejected = env.getRejectedCandidates();
    const held = env.getHeldCandidates();
    const avgScore =
      accepted.length > 0
        ? accepted.reduce((acc, c) => acc + c.score, 0) / accepted.length
        : 0;

    res.status(200).json({
      success: true,
      datasetType,
      budgetK,
      totalCandidates: candidatePool.length,
      decisions: allDecisions,
      summary: {
        totalAccepted: accepted.length,
        totalRejected: rejected.length,
        totalHeld: held.length,
        totalSkipped: candidatePool.length - stepCount,
        avgAcceptedScore: Number(avgScore.toFixed(1)),
        totalReward: Number(env.getEpisodeReward().toFixed(2)),
        quotaFilled: accepted.length >= budgetK,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi chạy mô phỏng sàng lọc',
    });
  }
};
