/**
 * Kịch bản đánh giá và đối chiếu suy luận (Inference) giữa TH1 (Ảo) và TH2 (Thật)
 */
import fs from 'fs';
import path from 'path';
import { CandidateScreeningEnv } from '../envs/dqn/candidateScreeningEnv';
import { DQNAgent } from '../core/dqnAgent';
import { CandidateAction, CandidatePoolItem } from '../envs/dqn/types';

function runEvaluation() {
  console.log('================================================================');
  console.log('      BÁO CÁO ĐỐI CHIẾU SUY LUẬN DQN: TH1 (ẢO) vs TH2 (THẬT)    ');
  console.log('================================================================\n');

  const weightsPath = path.resolve(__dirname, '../../../../../../weights/dqn_baseline.json');
  if (!fs.existsSync(weightsPath)) {
    throw new Error(`Chưa có tệp trọng số baseline: ${weightsPath}`);
  }

  const agent = new DQNAgent();
  const loaded = agent.loadWeights(weightsPath);
  if (!loaded) {
    throw new Error('Không thể nạp trọng số baseline.');
  }
  console.log('✓ Đã nạp thành công trọng số DQN baseline (Inference Mode: epsilon = 0.0).\n');

  const synthPath = path.resolve(__dirname, '../data/synthetic_candidates.json');
  const realPath = path.resolve(__dirname, '../data/real_candidates.json');

  const synthPool: CandidatePoolItem[] = JSON.parse(fs.readFileSync(synthPath, 'utf-8'));
  const realPool: CandidatePoolItem[] = JSON.parse(fs.readFileSync(realPath, 'utf-8'));

  const evalCase = (caseName: string, pool: CandidatePoolItem[], budgetK = 5) => {
    console.log(`----------------------------------------------------------------`);
    console.log(`ĐÁNH GIÁ: ${caseName} (Quy mô: ${pool.length} CV, Chỉ tiêu K: ${budgetK})`);
    console.log(`----------------------------------------------------------------`);

    const env = new CandidateScreeningEnv({
      defaultBudgetK: budgetK,
      defaultPoolSize: pool.length,
      terminateOnQuotaFilled: true,
    });

    let state = env.reset(pool, budgetK);
    let done = false;
    let stepCount = 0;
    const decisions: any[] = [];

    while (!done) {
      const currentCandidate = pool[stepCount];
      const qValues = agent.getQValues(state);
      const action = agent.selectAction(state, 0.0); // hoàn toàn khai thác
      const stepResult = env.step(action);

      decisions.push({
        step: stepCount + 1,
        name: currentCandidate.name,
        score: currentCandidate.score,
        tier: (currentCandidate.rawInfo as any)?.tier ?? 'N/A',
        qValues: qValues.map(v => Number(v.toFixed(2))),
        action: CandidateAction[action],
        reward: Number(stepResult.reward.toFixed(2)),
        kRemain: env.getKRemain(),
      });

      state = stepResult.state;
      done = stepResult.done;
      stepCount++;
    }

    // Hiển thị bảng kết quả
    console.log(
      'Bước | Ứng viên             | Điểm  | Phân khúc | Q[REJ, ACC, HLD]   | Quyết định | Reward | K còn'
    );
    console.log(
      '-----+----------------------+-------+-----------+--------------------+------------+--------+------'
    );
    decisions.forEach((d) => {
      console.log(
        `${String(d.step).padStart(4)} | ` +
        `${d.name.padEnd(20)} | ` +
        `${d.score.toFixed(1).padStart(5)} | ` +
        `${d.tier.padEnd(9)} | ` +
        `[${d.qValues.map((v: number) => (v >= 0 ? '+' : '') + v.toFixed(2).padStart(5)).join(',')}] | ` +
        `${d.action.padEnd(10)} | ` +
        `${(d.reward >= 0 ? '+' : '') + d.reward.toFixed(2).padStart(5)} | ` +
        `${d.kRemain}`
      );
    });

    const accepted = env.getAcceptedCandidates();
    const rejected = env.getRejectedCandidates();
    const avgScore =
      accepted.length > 0
        ? accepted.reduce((acc, c) => acc + c.score, 0) / accepted.length
        : 0;

    console.log(`\n>> KẾT QUẢ ${caseName}:`);
    console.log(`  - Số lượng duyệt phỏng vấn (ACCEPT): ${accepted.length}/${budgetK}`);
    console.log(`  - Điểm trung bình ứng viên trúng tuyển: ${avgScore.toFixed(1)}/100`);
    console.log(`  - Số lượng hồ sơ đã từ chối (REJECT): ${rejected.length}`);
    console.log(`  - Tổng phần thưởng tích lũy (Cumulative Reward): ${env.getEpisodeReward().toFixed(2)}\n`);

    return {
      acceptedCount: accepted.length,
      avgScore,
      totalReward: env.getEpisodeReward(),
    };
  };

  const res1 = evalCase('TH1: DỮ LIỆU ẢO (SYNTHETIC CANDIDATES)', synthPool, 5);
  const res2 = evalCase('TH2: DỮ LIỆU THẬT (REAL CANDIDATES)', realPool, 5);

  console.log('================================================================');
  console.log('                 BẢNG TỔNG HỢP SO SÁNH TH1 vs TH2               ');
  console.log('================================================================');
  console.log(`Chỉ số so sánh               | TH1 (Dữ liệu ảo) | TH2 (Dữ liệu thật)`);
  console.log(`-----------------------------+------------------+-------------------`);
  console.log(`Số lượng tuyển được (K=5)    | ${res1.acceptedCount}/5             | ${res2.acceptedCount}/5`);
  console.log(`Điểm trung bình trúng tuyển  | ${res1.avgScore.toFixed(1)}/100           | ${res2.avgScore.toFixed(1)}/100`);
  console.log(`Tổng Reward tích lũy         | ${res1.totalReward > 0 ? '+' : ''}${res1.totalReward.toFixed(2)}            | ${res2.totalReward > 0 ? '+' : ''}${res2.totalReward.toFixed(2)}`);
  console.log('================================================================\n');
}

runEvaluation();
