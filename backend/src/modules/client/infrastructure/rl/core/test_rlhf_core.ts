/**
 * Test suite kiểm thử logic RLHF trong DQNAgent
 */
import { DQNAgent } from './dqnAgent';
import { CandidateAction } from '../envs/dqn/types';

function runRlhfCoreTests() {
  console.log('=== [TEST SUITE] Kiểm thử RLHF Core (DQNAgent) ===\n');

  const agent = new DQNAgent({
    stateDim: 24,
    actionDim: 3,
    hiddenDims: [128, 64],
    learningRate: 0.005, // LR cao hơn chút để thấy rõ biến thiên trong unit test
  });

  const state = new Array(24).fill(0.5);

  // 1. Kiểm tra trường hợp HR Đồng ý (isAgree = true)
  console.log('[Test 1] Kiểm tra HR Đồng ý với quyết định của AI...');
  const resAgree = (agent as any).learnFromHumanFeedback(
    state,
    CandidateAction.ACCEPT, // 1
    CandidateAction.ACCEPT, // 1
    true
  );

  if (!resAgree || !Array.isArray(resAgree.newQValues)) {
    throw new Error('learnFromHumanFeedback không trả về kết quả hợp lệ.');
  }

  const oldQ_accept = resAgree.oldQValues[CandidateAction.ACCEPT];
  const newQ_accept = resAgree.newQValues[CandidateAction.ACCEPT];
  console.log(`  Q(ACCEPT) ban đầu: ${oldQ_accept.toFixed(4)} -> sau khi HR đồng ý: ${newQ_accept.toFixed(4)}`);

  if (newQ_accept <= oldQ_accept) {
    throw new Error(`Kỳ vọng Q(ACCEPT) tăng sau khi nhận reward dương, thực tế: ${newQ_accept} <= ${oldQ_accept}`);
  }
  console.log('  ✓ ĐẠT: Q(ACCEPT) đã tăng thành công khi nhận phản hồi tích cực từ HR.');

  // 2. Kiểm tra trường hợp HR Ghi đè / Sửa sai (isAgree = false)
  console.log('\n[Test 2] Kiểm tra HR Sửa sai (AI chọn REJECT, HR đổi thành ACCEPT)...');
  const resOverride = (agent as any).learnFromHumanFeedback(
    state,
    CandidateAction.REJECT, // 0 (hành động cũ của AI)
    CandidateAction.ACCEPT, // 1 (hành động sửa của HR)
    false
  );

  const oldQ_rej = resOverride.oldQValues[CandidateAction.REJECT];
  const newQ_rej = resOverride.newQValues[CandidateAction.REJECT];
  const oldQ_acc2 = resOverride.oldQValues[CandidateAction.ACCEPT];
  const newQ_acc2 = resOverride.newQValues[CandidateAction.ACCEPT];

  console.log(`  Q(REJECT) cũ: ${oldQ_rej.toFixed(4)} -> sau phạt: ${newQ_rej.toFixed(4)}`);
  console.log(`  Q(ACCEPT) cũ: ${oldQ_acc2.toFixed(4)} -> sau thưởng: ${newQ_acc2.toFixed(4)}`);

  if (newQ_rej >= oldQ_rej) {
    throw new Error(`Kỳ vọng Q(REJECT) giảm sau khi bị HR bác bỏ, thực tế: ${newQ_rej} >= ${oldQ_rej}`);
  }
  if (newQ_acc2 <= oldQ_acc2) {
    throw new Error(`Kỳ vọng Q(ACCEPT) tăng sau khi được HR chọn, thực tế: ${newQ_acc2} <= ${oldQ_acc2}`);
  }
  console.log('  ✓ ĐẠT: Q-values điều chỉnh chính xác hai chiều theo sự can thiệp của HR.');

  console.log('\n>>> TẤT CẢ TEST RLHF CORE ĐÃ ĐẠT 100%! <<<\n');
}

runRlhfCoreTests();
