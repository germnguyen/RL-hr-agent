/**
 * ============================================================================
 * FILE: test_e2e_verification.ts
 * MỤC ĐÍCH: Kịch bản kiểm thử End-to-End toàn diện hệ thống DQN Sàng lọc CV:
 * 1. Kiểm tra toàn vẹn dữ liệu TH1 (Ảo) và TH2 (Thật).
 * 2. Kiểm tra nạp và lưu trữ trọng số dqn_baseline.json.
 * 3. Kiểm tra tính chính xác của quyết định suy luận trên TH1 & TH2.
 * 4. Kiểm tra quy trình huấn luyện trực tiếp (Live Training loop).
 * 5. Báo cáo kết quả đối chiếu số liệu tổng kết.
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { CandidateScreeningEnv } from '../envs/dqn/candidateScreeningEnv';
import { DQNAgent } from '../core/dqnAgent';
import { CandidateAction, CandidatePoolItem } from '../envs/dqn/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`[FAIL] ${msg}`);
  }
  console.log(`  ✓ ĐẠT: ${msg}`);
}

async function runEndToEndVerification() {
  console.log('================================================================');
  console.log('       BỘ KIỂM THỬ E2E TOÀN DIỆN THUẬT TOÁN DQN SÀNG LỌC CV     ');
  console.log('================================================================\n');

  // 1. Kiểm tra tệp dữ liệu
  console.log('[E2E 1] Kiểm tra 2 tệp dữ liệu TH1 & TH2...');
  const dataDir = path.resolve(__dirname, '../data');
  const synthFile = path.join(dataDir, 'synthetic_candidates.json');
  const realFile = path.join(dataDir, 'real_candidates.json');

  assert(fs.existsSync(synthFile), 'Tệp TH1 (synthetic_candidates.json) tồn tại');
  assert(fs.existsSync(realFile), 'Tệp TH2 (real_candidates.json) tồn tại');

  const synthData: CandidatePoolItem[] = JSON.parse(fs.readFileSync(synthFile, 'utf-8'));
  const realData: CandidatePoolItem[] = JSON.parse(fs.readFileSync(realFile, 'utf-8'));

  assert(synthData.length === 30, 'TH1 có đúng 30 ứng viên');
  assert(realData.length === 30, 'TH2 có đúng 30 ứng viên');

  // 2. Kiểm tra nạp trọng số baseline
  console.log('\n[E2E 2] Kiểm tra nạp trọng số DQN baseline...');
  const weightsFile = path.resolve(__dirname, '../../../../../../weights/dqn_baseline.json');
  assert(fs.existsSync(weightsFile), `Tệp trọng số ${weightsFile} tồn tại`);

  const agent = new DQNAgent();
  const loaded = agent.loadWeights(weightsFile);
  assert(loaded, 'Nạp thành công trọng số dqn_baseline.json vào Policy & Target Network');

  // 3. Kiểm tra suy luận trên TH1
  console.log('\n[E2E 3] Kiểm tra suy luận TH1 (Dữ liệu ảo, K = 5)...');
  const env1 = new CandidateScreeningEnv({ defaultBudgetK: 5, defaultPoolSize: 30, terminateOnQuotaFilled: true });
  let s1 = env1.reset(synthData, 5);
  let done1 = false;
  let step1 = 0;

  while (!done1 && step1 < synthData.length) {
    const act = agent.selectAction(s1, 0.0);
    const res = env1.step(act);
    s1 = res.state;
    done1 = res.done;
    step1++;
  }

  const accepted1 = env1.getAcceptedCandidates();
  const avgScore1 = accepted1.reduce((acc, c) => acc + c.score, 0) / accepted1.length;
  assert(accepted1.length === 5, `TH1 tuyển đúng 5/5 chỉ tiêu (k_remain = ${env1.getKRemain()})`);
  assert(avgScore1 >= 75.0, `Điểm TB ứng viên trúng tuyển TH1 >= 75 (Thực tế: ${avgScore1.toFixed(1)})`);
  assert(env1.getEpisodeReward() > 10.0, `Tổng reward TH1 > 10 (Thực tế: ${env1.getEpisodeReward().toFixed(2)})`);

  // 4. Kiểm tra suy luận trên TH2
  console.log('\n[E2E 4] Kiểm tra suy luận TH2 (Dữ liệu thật, K = 5)...');
  const env2 = new CandidateScreeningEnv({ defaultBudgetK: 5, defaultPoolSize: 30, terminateOnQuotaFilled: true });
  let s2 = env2.reset(realData, 5);
  let done2 = false;
  let step2 = 0;

  while (!done2 && step2 < realData.length) {
    const act = agent.selectAction(s2, 0.0);
    const res = env2.step(act);
    s2 = res.state;
    done2 = res.done;
    step2++;
  }

  const accepted2 = env2.getAcceptedCandidates();
  const avgScore2 = accepted2.reduce((acc, c) => acc + c.score, 0) / accepted2.length;
  assert(accepted2.length === 5, `TH2 tuyển đúng 5/5 chỉ tiêu (k_remain = ${env2.getKRemain()})`);
  assert(avgScore2 >= 85.0, `Điểm TB ứng viên trúng tuyển TH2 >= 85 (Thực tế: ${avgScore2.toFixed(1)})`);
  assert(env2.getEpisodeReward() > 15.0, `Tổng reward TH2 > 15 (Thực tế: ${env2.getEpisodeReward().toFixed(2)})`);

  // 5. Kiểm tra Live Training Loop
  console.log('\n[E2E 5] Kiểm tra tiến trình huấn luyện trực tiếp (Live Training)...');
  const liveEnv = new CandidateScreeningEnv({ defaultBudgetK: 3, defaultPoolSize: 15 });
  const liveAgent = new DQNAgent({ batchSize: 16 });
  const metrics = await liveAgent.train(liveEnv, 10);
  assert(metrics.length === 10, 'Live Training hoàn tất đúng 10 episodes');
  assert(metrics[9].loss >= 0, `Hàm mất mát loss được tính toán chính xác: ${metrics[9].loss}`);

  console.log('\n================================================================');
  console.log('       TẤT CẢ CÁC BÀI KIỂM THỬ E2E ĐÃ VƯỢT QUA 100%!           ');
  console.log('================================================================\n');
}

runEndToEndVerification().catch((err) => {
  console.error('Lỗi E2E:', err);
  process.exit(1);
});
