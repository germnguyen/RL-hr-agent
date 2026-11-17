/**
 * Kịch bản huấn luyện tự động mô hình DQN Sàng lọc CV và xuất trọng số chuẩn dqn_baseline.json
 */
import path from 'path';
import { CandidateScreeningEnv } from '../envs/dqn/candidateScreeningEnv';
import { DQNAgent } from '../core/dqnAgent';

async function trainBaselineModel() {
  console.log('================================================================');
  console.log('    TIẾN TRÌNH HUẤN LUYỆN DQN BASELINE (SÀNG LỌC HỒ SƠ ỨNG VIÊN)   ');
  console.log('================================================================\n');

  const env = new CandidateScreeningEnv({
    defaultPoolSize: 30,
    defaultBudgetK: 5,
    minMatchThreshold: 75,
    excellentMatchThreshold: 85,
    terminalBonusMinAvgScore: 80,
    terminalBonus: 5.0,
    shortfallPenalty: 1.0,
    holdPenalty: -0.2,
    overQuotaPenalty: -5.0,
    terminateOnQuotaFilled: true,
  });

  const agent = new DQNAgent({
    stateDim: 24,
    actionDim: 3,
    hiddenDims: [128, 64],
    learningRate: 0.0005,
    gamma: 0.95,
    epsilonStart: 1.0,
    epsilonEnd: 0.05,
    epsilonDecay: 0.985,
    bufferCapacity: 10000,
    batchSize: 32,
    targetUpdateFreq: 40,
    tau: 0.005,
  });

  const totalEpisodes = 150;
  console.log(`Bắt đầu huấn luyện ${totalEpisodes} episodes...`);
  const startTime = Date.now();

  let bestReward = -Infinity;
  const weightsPath = path.resolve(__dirname, '../../../../../../weights/dqn_baseline.json');

  await agent.train(env, totalEpisodes, (m) => {
    if (m.episode % 25 === 0 || m.episode === 1 || m.episode === totalEpisodes) {
      console.log(
        `Episode ${String(m.episode).padStart(3)}/${totalEpisodes} | ` +
        `Reward: ${m.reward > 0 ? '+' : ''}${m.reward.toFixed(2).padStart(6)} | ` +
        `Loss: ${m.loss.toFixed(4)} | ` +
        `Eps: ${m.epsilon.toFixed(3)} | ` +
        `Chọn: ${m.acceptedCount}/5 CV (Điểm TB: ${m.avgAcceptedScore.toFixed(1)})`
      );
    }
    if (m.reward > bestReward && m.episode > 50) {
      bestReward = m.reward;
      agent.saveWeights(weightsPath);
    }
  });

  // Đảm bảo tệp trọng số luôn được lưu kể cả khi episode cuối kết thúc
  agent.saveWeights(weightsPath);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✓ Huấn luyện hoàn tất sau ${duration}s!`);
  console.log(`✓ Đã lưu trọng số mô hình chuẩn vào: ${weightsPath}`);
}

trainBaselineModel().catch((err) => {
  console.error('Lỗi khi huấn luyện baseline:', err);
  process.exit(1);
});
