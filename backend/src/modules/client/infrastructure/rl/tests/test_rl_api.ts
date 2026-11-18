/**
 * Test suite kiểm thử controller và nghiệp vụ API của mô-đun RL (DQN).
 */
import {
  getDatasetsHandler,
  trainDqnHandler,
  simulateScreeningHandler,
} from '../controllers/rl.controller';

// Giả lập đối tượng Request & Response của Express
function createMockReqRes(body = {}, query = {}, params = {}) {
  const req: any = { body, query, params };
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
  console.log('=== [TEST SUITE] Kiểm thử Controller & API RL (DQN) ===\n');

  // 1. Test GET /datasets
  console.log('[Test 1] Kiểm tra getDatasetsHandler...');
  const { req: req1, res: res1, getResult: getRes1 } = createMockReqRes();
  await getDatasetsHandler(req1, res1);
  const result1 = getRes1();

  if (result1.statusCode !== 200 || !result1.responseData.success) {
    throw new Error(`getDatasetsHandler thất bại: ${JSON.stringify(result1.responseData)}`);
  }
  if (result1.responseData.synthetic.length !== 30 || result1.responseData.real.length !== 30) {
    throw new Error('Số lượng ứng viên trả về không đủ 30 cho mỗi tập.');
  }
  console.log('✓ getDatasetsHandler trả về thành công 30 ứng viên cho TH1 và TH2.');

  // 2. Test POST /simulate với TH1 (Dữ liệu ảo)
  console.log('\n[Test 2] Kiểm tra simulateScreeningHandler (TH1 - Dữ liệu ảo, K = 5)...');
  const { req: req2, res: res2, getResult: getRes2 } = createMockReqRes({
    datasetType: 'synthetic',
    budgetK: 5,
  });
  await simulateScreeningHandler(req2, res2);
  const result2 = getRes2();

  if (result2.statusCode !== 200 || !result2.responseData.success) {
    throw new Error(`simulateScreeningHandler TH1 thất bại: ${JSON.stringify(result2.responseData)}`);
  }
  const { decisions: d1, summary: s1 } = result2.responseData;
  if (d1.length !== 30) {
    throw new Error(`Bảng quyết định phải chứa đủ 30 dòng ứng viên, thực tế: ${d1.length}`);
  }
  if (s1.totalAccepted !== 5) {
    throw new Error(`Tổng số ứng viên trúng tuyển phải bằng 5, thực tế: ${s1.totalAccepted}`);
  }
  console.log(`✓ TH1 Mô phỏng thành công: Chọn ${s1.totalAccepted}/5 CV, Điểm TB: ${s1.avgAcceptedScore.toFixed(1)}, Reward: ${s1.totalReward.toFixed(2)}.`);

  // 3. Test POST /simulate với TH2 (Dữ liệu thật)
  console.log('\n[Test 3] Kiểm tra simulateScreeningHandler (TH2 - Dữ liệu thật, K = 5)...');
  const { req: req3, res: res3, getResult: getRes3 } = createMockReqRes({
    datasetType: 'real',
    budgetK: 5,
  });
  await simulateScreeningHandler(req3, res3);
  const result3 = getRes3();

  if (result3.statusCode !== 200 || !result3.responseData.success) {
    throw new Error(`simulateScreeningHandler TH2 thất bại: ${JSON.stringify(result3.responseData)}`);
  }
  const { decisions: d2, summary: s2 } = result3.responseData;
  if (d2.length !== 30) {
    throw new Error(`Bảng quyết định phải chứa đủ 30 dòng ứng viên, thực tế: ${d2.length}`);
  }
  if (s2.totalAccepted !== 5) {
    throw new Error(`Tổng số ứng viên trúng tuyển phải bằng 5, thực tế: ${s2.totalAccepted}`);
  }
  console.log(`✓ TH2 Mô phỏng thành công: Chọn ${s2.totalAccepted}/5 CV, Điểm TB: ${s2.avgAcceptedScore.toFixed(1)}, Reward: ${s2.totalReward.toFixed(2)}.`);

  console.log('\n>>> TẤT CẢ TEST CONTROLLER API ĐÃ ĐẠT 100%! <<<\n');
}

runApiTests().catch((err) => {
  console.error('Lỗi kiểm thử API:', err);
  process.exit(1);
});
