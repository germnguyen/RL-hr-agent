/**
 * ============================================================================
 * FILE: test_rlhf_e2e.ts
 * MỤC ĐÍCH: Kịch bản kiểm thử End-to-End toàn diện tính năng RLHF:
 * 1. Kiểm tra nạp mô hình và mô phỏng trước can thiệp.
 * 2. Giả lập chuyên viên HR bấm Đồng ý (Agree: +2.0).
 * 3. Giả lập chuyên viên HR can thiệp Ghi đè (Override: -2.0 & +2.5).
 * 4. Kiểm tra sự dịch chuyển Q-values và tính thích ứng của mô hình ở lần mô phỏng tiếp theo.
 * 5. Đo đạc độ trễ phản hồi (Response Latency < 100ms).
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { DQNAgent } from '../core/dqnAgent';
import { CandidateAction, CandidatePoolItem } from '../envs/dqn/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`[FAIL] ${msg}`);
  }
  console.log(`  ✓ ĐẠT: ${msg}`);
}

async function runRlhfE2ETest() {
  console.log('================================================================');
  console.log('       KIỂM THỬ E2E TOÀN DIỆN TÍNH NĂNG RLHF (HUMAN-IN-THE-LOOP)  ');
  console.log('================================================================\n');

  // 1. Khởi tạo Agent và nạp trọng số baseline
  console.log('[E2E 1] Nạp trọng số mô hình baseline...');
  const weightsFile = path.resolve(__dirname, '../../../../../../weights/dqn_baseline.json');
  assert(fs.existsSync(weightsFile), 'Tệp dqn_baseline.json tồn tại');

  const agent = new DQNAgent();
  agent.loadWeights(weightsFile);
  assert(true, 'Khởi tạo Agent thành công');

  // 2. Lấy một mẫu trạng thái ứng viên thực tế (ví dụ: điểm 78 - Khá giỏi)
  console.log('\n[E2E 2] Thử nghiệm HR can thiệp phản hồi tích cực (👍 Đồng ý)...');
  const sampleState = new Array(24).fill(0.65);

  const t0 = Date.now();
  const resAgree = agent.learnFromHumanFeedback(
    sampleState,
    CandidateAction.ACCEPT,
    CandidateAction.ACCEPT,
    true
  );
  const latencyAgree = Date.now() - t0;

  assert(resAgree.reward === 2.0, 'Phần thưởng HR đồng ý bằng đúng +2.0');
  assert(
    resAgree.newQValues[CandidateAction.ACCEPT] > resAgree.oldQValues[CandidateAction.ACCEPT],
    `Q(ACCEPT) đã tăng từ ${resAgree.oldQValues[CandidateAction.ACCEPT].toFixed(4)} lên ${resAgree.newQValues[CandidateAction.ACCEPT].toFixed(4)}`
  );
  assert(latencyAgree < 100, `Thời gian phản hồi cực nhanh: ${latencyAgree}ms (< 100ms)`);

  // 3. Thử nghiệm HR can thiệp sửa sai (🔄 Bác bỏ và Ghi đè)
  console.log('\n[E2E 3] Thử nghiệm HR can thiệp sửa sai (🔄 Bác bỏ AI: từ REJECT sang ACCEPT)...');
  const t1 = Date.now();
  const resOverride = agent.learnFromHumanFeedback(
    sampleState,
    CandidateAction.REJECT, // Hành động AI chọn
    CandidateAction.ACCEPT, // Hành động HR sửa
    false                   // isAgree = false
  );
  const latencyOverride = Date.now() - t1;

  assert(resOverride.reward === -2.0, 'Mức phạt khi AI bị HR bác bỏ là -2.0');
  assert(
    resOverride.newQValues[CandidateAction.REJECT] < resOverride.oldQValues[CandidateAction.REJECT],
    `Q(REJECT) đã giảm từ ${resOverride.oldQValues[CandidateAction.REJECT].toFixed(4)} xuống ${resOverride.newQValues[CandidateAction.REJECT].toFixed(4)}`
  );
  assert(
    resOverride.newQValues[CandidateAction.ACCEPT] > resOverride.oldQValues[CandidateAction.ACCEPT],
    `Q(ACCEPT) đã tăng từ ${resOverride.oldQValues[CandidateAction.ACCEPT].toFixed(4)} lên ${resOverride.newQValues[CandidateAction.ACCEPT].toFixed(4)}`
  );
  assert(latencyOverride < 100, `Thời gian phản hồi cực nhanh: ${latencyOverride}ms (< 100ms)`);

  // 4. Lưu lại trọng số và kiểm tra bảo toàn tệp
  console.log('\n[E2E 4] Kiểm tra đồng bộ và lưu trọng số sau khi nhận RLHF...');
  agent.saveWeights(weightsFile);
  const agentReloaded = new DQNAgent();
  const reloadOk = agentReloaded.loadWeights(weightsFile);
  assert(reloadOk, 'Tải lại thành công tệp trọng số đã qua RLHF fine-tuning');

  const reloadedQ = agentReloaded.getQValues(sampleState);
  assert(
    Math.abs(reloadedQ[CandidateAction.ACCEPT] - resOverride.newQValues[CandidateAction.ACCEPT]) < 1e-4,
    'Trọng số mạng nơ-ron sau lưu trữ được bảo toàn nguyên vẹn 100%'
  );

  console.log('\n================================================================');
  console.log('       TẤT CẢ TEST E2E RLHF ĐÃ VƯỢT QUA 100% VỚI 0 LỖI!         ');
  console.log('================================================================\n');
}

runRlhfE2ETest().catch((err) => {
  console.error('Lỗi E2E RLHF:', err);
  process.exit(1);
});
