/**
 * Test suite kiểm thử API RLHF (feedbackHandler)
 */
import { feedbackHandler } from '../controllers/rl.controller';

function createMockReqRes(body = {}) {
  const req: any = { body };
  let statusCode = 200;
  let responseData: any = null;

  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: any) {
      responseData = data;
      return res;
    },
  };

  return { req, res, getResult: () => ({ statusCode, responseData }) };
}

async function runApiTests() {
  console.log('=== [TEST SUITE] Kiểm thử Endpoint API RLHF (POST /rl/feedback) ===\n');

  const sampleState = new Array(24).fill(0.6);

  // 1. Test feedback HR đồng ý
  console.log('[Test 1] Kiểm tra feedbackHandler khi HR Đồng ý...');
  const { req: req1, res: res1, getResult: getRes1 } = createMockReqRes({
    candidateId: 'cand_01',
    state: sampleState,
    originalAction: 1, // ACCEPT
    humanAction: 1,    // ACCEPT
    isAgree: true,
  });

  await (feedbackHandler as any)(req1, res1);
  const res1Data = getRes1();

  if (res1Data.statusCode !== 200 || !res1Data.responseData.success) {
    throw new Error(`feedbackHandler thất bại: ${JSON.stringify(res1Data.responseData)}`);
  }
  console.log(`  ✓ Phản hồi thành công: ${res1Data.responseData.message}`);
  console.log(`  ✓ Q-values sau cập nhật: [${res1Data.responseData.newQValues.join(', ')}]`);

  // 2. Test feedback HR ghi đè
  console.log('\n[Test 2] Kiểm tra feedbackHandler khi HR Ghi đè (Sửa sang REJECT)...');
  const { req: req2, res: res2, getResult: getRes2 } = createMockReqRes({
    candidateId: 'cand_02',
    state: sampleState,
    originalAction: 1, // ACCEPT
    humanAction: 0,    // REJECT
    isAgree: false,
  });

  await (feedbackHandler as any)(req2, res2);
  const res2Data = getRes2();

  if (res2Data.statusCode !== 200 || !res2Data.responseData.success) {
    throw new Error(`feedbackHandler thất bại: ${JSON.stringify(res2Data.responseData)}`);
  }
  console.log(`  ✓ Phản hồi thành công: ${res2Data.responseData.message}`);
  console.log(`  ✓ Q-values sau cập nhật: [${res2Data.responseData.newQValues.join(', ')}]`);

  console.log('\n>>> TẤT CẢ TEST API RLHF ĐÃ ĐẠT 100%! <<<\n');
}

runApiTests().catch((err) => {
  console.error('Lỗi API RLHF:', err);
  process.exit(1);
});
