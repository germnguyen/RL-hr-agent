/**
 * ============================================================================
 * ĐỒ ÁN HỌC TĂNG CƯỜNG (REINFORCEMENT LEARNING - HK7)
 * Đề tài: Nanobrowser HR Agent (Trợ Lý Tuyển Dụng Thông Minh)
 * 
 * FILE: test_envs.ts
 * MỤC ĐÍCH: Kịch bản kiểm thử toàn diện Môi trường Sàng lọc hồ sơ DQN
 *           (CandidateScreeningEnv Verification Test Suite).
 * NỘI DUNG TEST:
 * 1. Kiểm tra không gian hành động (Action Space) và không gian quan sát (State Space 24 chiều).
 * 2. Kiểm tra tính chính xác của hàm chuyển đổi Vector <-> Đối tượng đặc trưng.
 * 3. Kiểm tra các bước chuyển trạng thái (step), trừ hạn ngạch K và công thức phần thưởng.
 * 4. Kiểm tra các mức phạt khi Agent ra quyết định sai lầm (loại nhân tài, duyệt người yếu).
 * 5. Chạy mô phỏng 15 đợt tuyển thực tế (Episodes) với hành động ngẫu nhiên.
 * ============================================================================
 */

import {
  CandidateScreeningEnv,
  CandidateAction,
  CandidateFeature,
  candidateFeatureToVector,
  vectorToCandidateFeature,
} from './index';

interface TestStats {
  passed: number;
  failed: number;
  total: number;
  errors: string[];
}

const stats: TestStats = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: [],
};

/**
 * Hàm kiểm tra điều kiện logic (Khẳng định đúng)
 */
function assert(condition: boolean, message: string): void {
  stats.total++;
  if (condition) {
    stats.passed++;
    console.log(`  ✓ ĐẠT: ${message}`);
  } else {
    stats.failed++;
    stats.errors.push(message);
    console.error(`  ✗ THẤT BẠI: ${message}`);
  }
}

/**
 * Hàm kiểm tra giá trị số học xấp xỉ trong phạm vi sai số cho phép
 */
function assertClose(actual: number, expected: number, tolerance = 0.01, message: string): void {
  const diff = Math.abs(actual - expected);
  assert(diff <= tolerance, `${message} (Kỳ vọng ~${expected}, Thực tế: ${actual})`);
}

// ============================================================================
// BỘ KIỂM THỬ MÔI TRƯỜNG SÀNG LỌC HỒ SƠ DQN
// ============================================================================

function testCandidateScreeningEnv(): void {
  console.log('\n======================================================');
  console.log('KIỂM THỬ: Môi trường Sàng lọc hồ sơ DQN (CandidateScreeningEnv)');
  console.log('======================================================\n');

  const env = new CandidateScreeningEnv({
    defaultPoolSize: 20,
    defaultBudgetK: 4,
    minMatchThreshold: 75,
    excellentMatchThreshold: 85,
    terminalBonusMinAvgScore: 80,
    terminalBonus: 5.0,
    shortfallPenalty: 1.0,
    holdPenalty: -0.2,
    terminateOnQuotaFilled: true,
  });

  // --------------------------------------------------------------------------
  // PHẦN 1: Kiểm tra Không gian và Khởi tạo ban đầu (reset)
  // --------------------------------------------------------------------------
  console.log('[Phần 1] Không gian hành động, quan sát và hàm khởi tạo reset()');
  assert(env.action_space.n === 3, 'Không gian hành động là Rời rạc gồm 3 hành động: REJECT(0), ACCEPT(1), HOLD(2)');
  assert(env.observation_space.shape[0] === 24, 'Không gian quan sát là mảng Box(24) đúng 24 chiều');

  const s0 = env.reset();
  assert(Array.isArray(s0), 'Hàm reset() trả về một mảng số');
  assert(s0.length === 24, 'Vector trạng thái ban đầu có chính xác 24 phần tử');
  assert(s0.every(v => typeof v === 'number' && !Number.isNaN(v)), 'Tất cả 24 phần tử đều là số thực hợp lệ (không chứa NaN)');

  const s0Obj = vectorToCandidateFeature(s0);
  assertClose(s0Obj.kRemainRatio, 1.0, 0.001, 'Tỷ lệ suất phỏng vấn ban đầu là 1.0 (4/4 suất còn trống)');
  assertClose(s0Obj.nRemainRatio, 1.0, 0.001, 'Tỷ lệ hồ sơ chưa duyệt ban đầu là 1.0 (20/20 hồ sơ)');
  assert(s0Obj.urgencyFlag === 0, 'Cờ cảnh báo thiếu chỉ tiêu ban đầu là 0');
  assert(env.getKRemain() === 4, 'Số suất phỏng vấn còn lại k_remain = 4');
  assert(env.getNRemain() === 20, 'Số hồ sơ chưa duyệt n_remain = 20');
  assert(env.getCurrentIdx() === 0, 'Con trỏ duyệt bắt đầu từ ứng viên đầu tiên (chỉ số 0)');

  // --------------------------------------------------------------------------
  // PHẦN 2: Kiểm tra Chuyển đổi qua lại giữa Đối tượng và Vector 24 chiều
  // --------------------------------------------------------------------------
  console.log('\n[Phần 2] Kiểm tra chuyển đổi 2 chiều: Object <-> Vector 24 chiều');
  const feat: CandidateFeature = {
    semanticSimilarity: 0.85,
    techStackMatch: 0.9,
    experienceMatch: 0.8,
    educationLevel: 0.8,
    projectScore: 0.75,
    bonusSkills: 0.4,
    workExperienceYears: 0.5,
    completedProjects: 0.45,
    gpa: 0.88,
    githubStars: 0.7,
    pinnedRepos: 0.6,
    verificationStatus: 1.0,
    redFlags: 0.0,
    jobStability: 0.8,
    contactCompletion: 1.0,
    locationMatch: 1.0,
    kRemainRatio: 0.6,
    nRemainRatio: 0.7,
    scarcityRatio: 0.28,
    avgAcceptedScore: 0.86,
    avgRejectedScore: 0.45,
    acceptanceRate: 0.2,
    progressRatio: 0.3,
    urgencyFlag: 0,
  };

  const vec = candidateFeatureToVector(feat);
  assert(vec.length === 24, 'Hàm candidateFeatureToVector tạo ra đúng mảng 24 phần tử');
  const parsed = vectorToCandidateFeature(vec);
  assertClose(parsed.semanticSimilarity, 0.85, 0.001, 'Bảo toàn đúng đặc trưng điểm tương đồng ngữ nghĩa Gemini (s1 = 0.85)');
  assertClose(parsed.verificationStatus, 1.0, 0.001, 'Bảo toàn đúng cờ trạng thái kiểm chứng Nanobrowser (s12 = 1.0)');
  assertClose(parsed.kRemainRatio, 0.6, 0.001, 'Bảo toàn đúng tỷ lệ hạn ngạch phỏng vấn còn lại (s17 = 0.6)');

  // --------------------------------------------------------------------------
  // PHẦN 3: Kiểm tra Hàm chuyển trạng thái (step), Trừ hạn ngạch và Hàm thưởng
  // --------------------------------------------------------------------------
  console.log('\n[Phần 3] Kiểm tra chuyển trạng thái, trừ hạn ngạch K và công thức phần thưởng');
  const customPool = [
    {
      id: 'c1',
      name: 'Ứng viên Xuất sắc',
      score: 90,
      features: new Array(16).fill(0.9),
    },
    {
      id: 'c2',
      name: 'Ứng viên Trung bình',
      score: 70,
      features: new Array(16).fill(0.7),
    },
    {
      id: 'c3',
      name: 'Ứng viên Yếu',
      score: 50,
      features: new Array(16).fill(0.4),
    },
    {
      id: 'c4',
      name: 'Nhân tài Ngôi sao',
      score: 95,
      features: new Array(16).fill(0.95),
    },
  ];

  env.reset(customPool, 2); // Đặt ngân sách phỏng vấn K = 2 suất

  // Bước 1: ACCEPT ứng viên giỏi (Điểm 90 >= 75)
  // Công thức thưởng: 2.0 + ((90 - 75) / 25) * 1.0 = +2.6
  const res1 = env.step(CandidateAction.ACCEPT);
  assertClose(res1.reward, 2.6, 0.01, 'Duyệt đúng ứng viên giỏi (90 điểm) nhận thưởng chuẩn +2.6');
  assert(env.getKRemain() === 1, 'Hạn ngạch phỏng vấn k_remain giảm chính xác từ 2 xuống 1');
  assert(env.getAcceptedCandidates().length === 1, 'Số lượng ứng viên được chọn tăng lên 1');
  assert(res1.done === false, 'Đợt tuyển chưa kết thúc vì vẫn còn 1 suất phỏng vấn trống');

  // Bước 2: HOLD ứng viên trung bình
  // Mức phạt trì hoãn: -0.2
  const res2 = env.step(CandidateAction.HOLD);
  assertClose(res2.reward, -0.2, 0.01, 'Hành động HOLD bị trừ nhẹ chi phí trì hoãn -0.2');
  assert(env.getKRemain() === 1, 'Hạn ngạch k_remain giữ nguyên không đổi sau khi HOLD');
  assert(env.getHeldCandidates().length === 1, 'Số ứng viên tạm giữ trong danh sách chờ là 1');

  // Bước 3: REJECT ứng viên yếu (Điểm 50 < 75)
  // Thưởng sàng lọc: +1.0
  const res3 = env.step(CandidateAction.REJECT);
  assertClose(res3.reward, 1.0, 0.01, 'Loại bỏ đúng ứng viên yếu (50 điểm) nhận thưởng sàng lọc +1.0');
  assert(env.getRejectedCandidates().length === 1, 'Số lượng ứng viên bị từ chối là 1');
  assert(env.getKRemain() === 1, 'Hạn ngạch k_remain giữ nguyên không đổi sau khi REJECT');

  // Bước 4: ACCEPT ứng viên ngôi sao thứ 2 (Điểm 95 >= 75)
  // Thưởng bước: 2.0 + ((95 - 75) / 25) * 1.0 = +2.8
  // Đã chọn đủ 2/2 suất, điểm trung bình = (90 + 95)/2 = 92.5 >= 80 -> Thưởng lớn cuối kỳ +5.0 -> Tổng = +7.8
  const res4 = env.step(CandidateAction.ACCEPT);
  assertClose(res4.reward, 7.8, 0.01, 'Chọn đủ 2 ứng viên chất lượng cao nhận thêm thưởng kết thúc +5.0 (Tổng nhận +7.8)');
  assert(res4.done === true, 'Đợt tuyển tự động kết thúc thành công khi đã tuyển đủ chỉ tiêu K = 2');
  assert(env.getKRemain() === 0, 'Hạn ngạch phỏng vấn k_remain về 0');
  assert(env.getAcceptedCandidates().length === 2, 'Tổng số ứng viên được chọn đạt đúng chỉ tiêu K = 2');

  // --------------------------------------------------------------------------
  // PHẦN 4: Kiểm tra Cơ chế Phạt khi Agent Quyết định Sai lầm
  // --------------------------------------------------------------------------
  console.log('\n[Phần 4] Kiểm tra các mức phạt khi Agent ra quyết định sai lầm');
  env.reset([
    { id: 'c_star', name: 'Nhân tài Xuất sắc', score: 92, features: new Array(16).fill(0.92) },
    { id: 'c_weak', name: 'Ứng viên Yếu', score: 45, features: new Array(16).fill(0.4) },
    { id: 'c_extra', name: 'Ứng viên Đệm', score: 70, features: new Array(16).fill(0.7) },
  ], 2);

  // Sai lầm 1: Loại bỏ nhầm nhân tài xuất sắc (Điểm 92 >= 85)
  // Công thức phạt: -2.0 - ((92 - 85)/15)*1.0 = -2.467
  const rejectTalentRes = env.step(CandidateAction.REJECT);
  assertClose(rejectTalentRes.reward, -2.467, 0.01, 'Phạt nặng khi loại bỏ nhầm nhân tài xuất sắc (92 điểm): phạt ~-2.47');

  // Sai lầm 2: Duyệt nhầm ứng viên yếu (Điểm 45 < 75)
  // Công thức phạt: -1.5 - ((75 - 45)/75)*1.5 = -2.1
  const acceptWeakRes = env.step(CandidateAction.ACCEPT);
  assertClose(acceptWeakRes.reward, -2.1, 0.01, 'Phạt khi duyệt nhầm ứng viên không đủ năng lực (45 điểm): phạt ~-2.1');

  // --------------------------------------------------------------------------
  // PHẦN 5: Mô phỏng 15 Đợt tuyển ngẫu nhiên (Multi-Episode Stochastic Simulation)
  // --------------------------------------------------------------------------
  console.log('\n[Phần 5] Mô phỏng 15 đợt tuyển thực tế với hành động ngẫu nhiên');
  const epEnv = new CandidateScreeningEnv();

  for (let ep = 1; ep <= 15; ep++) {
    const pSize = 15 + Math.floor(Math.random() * 20); // Tạo từ 15 đến 34 ứng viên ngẫu nhiên
    const kBudget = 3 + Math.floor(Math.random() * 4);  // Chỉ tiêu từ 3 đến 6 suất
    const syntheticPool = epEnv.generateSyntheticPool(pSize);

    let state = epEnv.reset(syntheticPool, kBudget);
    let done = false;
    let totalEpReward = 0;
    let steps = 0;

    while (!done && steps < 100) {
      const randomAction = Math.floor(Math.random() * 3) as CandidateAction;
      const stepRes = epEnv.step(randomAction);
      state = stepRes.state;
      totalEpReward += stepRes.reward;
      done = stepRes.done;
      steps++;

      assert(state.length === 24, `Đợt ${ep} Bước ${steps}: Vector trạng thái đủ 24 chiều`);
      assert(state.every(v => typeof v === 'number' && !Number.isNaN(v)), `Đợt ${ep} Bước ${steps}: Dữ liệu trạng thái hợp lệ`);
      assert(typeof stepRes.reward === 'number' && !Number.isNaN(stepRes.reward), `Đợt ${ep} Bước ${steps}: Điểm thưởng là số thực`);
    }

    assert(done, `Đợt ${ep}: Kết thúc đợt tuyển đúng quy trình sau ${steps} bước duyệt`);
    const acceptedCount = epEnv.getAcceptedCandidates().length;
    assert(
      acceptedCount <= kBudget,
      `Đợt ${ep}: Số lượng ứng viên được chọn (${acceptedCount}) không bao giờ vượt quá ngân sách K (${kBudget})`
    );
    console.log(`    Đợt ${ep}: Quy mô=${pSize} CV, Chỉ tiêu K=${kBudget}, Đã duyệt=${steps} bước, Chọn=${acceptedCount}, Tổng điểm=${totalEpReward.toFixed(2)}`);
  }
}

// ============================================================================
// HÀM CHẠY KIỂM THỬ CHÍNH
// ============================================================================

function runDQNVerificationTests(): void {
  const startTime = Date.now();
  console.log('================================================================');
  console.log('     BỘ KIỂM THỬ TỰ ĐỘNG MÔI TRƯỜNG HỌC TĂNG CƯỜNG DQN (HK7)    ');
  console.log('================================================================');

  try {
    testCandidateScreeningEnv();

    const duration = Date.now() - startTime;
    console.log('\n================================================================');
    console.log('                      TỔNG KẾT KIỂM THỬ                         ');
    console.log('================================================================');
    console.log(` Tổng số khẳng định kiểm tra : ${stats.total}`);
    console.log(` Số bài kiểm tra ĐẠT         : ${stats.passed}`);
    console.log(` Số bài kiểm tra THẤT BẠI    : ${stats.failed}`);
    console.log(` Thời gian thực thi          : ${duration} ms`);

    if (stats.failed > 0) {
      console.error('\nDANH SÁCH LỖI GHI NHẬN:');
      stats.errors.forEach((err, i) => console.error(`  ${i + 1}. ${err}`));
      process.exit(1);
    } else {
      console.log('\n>> TẤT CẢ CÁC BÀI TEST ĐÃ VƯỢT QUA 100% VỚI 0 LỖI. <<\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('\nXẢY RA LỖI NGOẠI LỆ NGHIÊM TRỌNG TRONG KHI TEST:', error);
    process.exit(1);
  }
}

runDQNVerificationTests();
