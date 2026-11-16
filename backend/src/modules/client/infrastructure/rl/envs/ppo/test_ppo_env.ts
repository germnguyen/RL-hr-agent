/**
 * ============================================================================
 * ĐỒ ÁN HỌC TĂNG CƯỜNG (REINFORCEMENT LEARNING - HK7)
 * Đề tài: Nanobrowser HR Agent (Trợ Lý Tuyển Dụng Thông Minh)
 * 
 * FILE: test_ppo_env.ts
 * MỤC ĐÍCH: Kịch bản kiểm thử toàn diện Môi trường Kiểm chứng GitHub PPO
 *           (GitHubVerificationEnv Verification Test Suite - MDP 2).
 * NỘI DUNG TEST:
 * 1. Kiểm tra Không gian hành động Discrete(5) và Không gian quan sát Box(12).
 * 2. Kiểm tra Ngẫu nhiên hóa hồ sơ (Domain Randomization) trên 4 phân loại.
 * 3. Kiểm tra cơ chế nhận diện lỗi 404 và dừng duyệt kịp thời (ABORT_ON_404).
 * 4. Kiểm tra các hành động cào dữ liệu: Pinned Repos, Stars, Bio/Trường học.
 * 5. Kiểm tra phần thưởng hoàn tất (FINISH_AND_SUBMIT) và phạt nộp non.
 * 6. Kiểm tra mặt nạ hành động hợp lệ (Action Masking).
 * 7. Mô phỏng 15 đợt kiểm chứng ngẫu nhiên.
 * ============================================================================
 */

import {
  GitHubVerificationEnv,
  GitHubAction,
  ProfileArchetype,
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

function assertClose(actual: number, expected: number, tolerance = 0.01, message: string): void {
  const diff = Math.abs(actual - expected);
  assert(diff <= tolerance, `${message} (Kỳ vọng ~${expected}, Thực tế: ${actual})`);
}

function testGitHubVerificationEnv(): void {
  console.log('\n======================================================');
  console.log('KIỂM THỬ: Môi trường Kiểm chứng GitHub PPO (GitHubVerificationEnv)');
  console.log('======================================================\n');

  const env = new GitHubVerificationEnv({
    maxSteps: 10,
    stepPenalty: -0.5,
    extractPinnedReward: 5.0,
    readBioReward: 3.0,
    switchTabReward: 2.0,
    abort404Reward: 5.0,
    finishSubmitReward: 10.0,
    prematureSubmitPenalty: -5.0,
    redundantActionPenalty: -2.0,
    stochastic: false,
  });

  // --------------------------------------------------------------------------
  // PHẦN 1: Kiểm tra Không gian và Hàm khởi tạo reset()
  // --------------------------------------------------------------------------
  console.log('[Phần 1] Không gian hành động, quan sát và hàm khởi tạo reset()');
  assert(env.action_space.n === 5, 'Không gian hành động là Rời rạc gồm 5 hành động: 0 đến 4');
  assert(env.observation_space.shape[0] === 12, 'Không gian quan sát là vector Box(12) đúng 12 chiều');

  const s0 = env.reset();
  assert(Array.isArray(s0), 'Hàm reset() trả về một mảng số');
  assert(s0.length === 12, 'Vector trạng thái ban đầu có chính xác 12 chiều');
  assert(s0.every(v => typeof v === 'number' && !Number.isNaN(v)), 'Tất cả 12 phần tử đều là số thực hợp lệ (không chứa NaN)');

  // --------------------------------------------------------------------------
  // PHẦN 2: Ngẫu nhiên hóa miền (Domain Randomization) trên 4 phân loại hồ sơ
  // --------------------------------------------------------------------------
  console.log('\n[Phần 2] Kiểm tra 4 phân loại hồ sơ GitHub (Domain Randomization)');
  const archetypes: ProfileArchetype[] = [
    'standard_pinned',
    'no_pinned',
    'rich_bio_readme',
    'error_404',
  ];

  for (const arch of archetypes) {
    const s = env.reset(arch);
    const p = env.getProfile();
    const sObj = env.getStateObject();
    assert(p.archetype === arch, `Tạo lập chính xác hồ sơ phân loại '${arch}'`);

    if (arch === 'error_404') {
      assert(p.is404 === true, `error_404 có cờ is404 = true`);
      assert(sObj.is_404_error_page === 1.0, `error_404 có s3 (is_404_error_page) = 1.0`);
      assert(sObj.is_profile_page === 0.0, `error_404 có s1 (is_profile_page) = 0.0`);
      const mask = env.getActionMask();
      assert(mask[GitHubAction.ABORT_ON_404] === true, `Mặt nạ hành động trên 404 cho phép ABORT_ON_404`);
      assert(mask[GitHubAction.EXTRACT_PINNED] === false, `Mặt nạ hành động trên 404 cấm EXTRACT_PINNED`);
    } else {
      assert(p.is404 === false, `${arch} có cờ is404 = false`);
      assert(sObj.is_404_error_page === 0.0, `${arch} có s3 (is_404_error_page) = 0.0`);
      assert(sObj.is_profile_page === 1.0, `${arch} có s1 (is_profile_page) = 1.0`);
    }

    if (arch === 'standard_pinned') {
      assert(p.hasPinnedSection === true, 'standard_pinned có khối Pinned Repositories');
      assert(sObj.has_pinned_section === 1.0, 'standard_pinned có s4 (has_pinned_section) = 1.0');
    }

    if (arch === 'no_pinned') {
      assert(p.hasPinnedSection === false, 'no_pinned không có khối Pinned Repositories');
      assert(sObj.has_pinned_section === 0.0, 'no_pinned có s4 (has_pinned_section) = 0.0');
    }
  }

  // --------------------------------------------------------------------------
  // PHẦN 3: Kiểm tra Xử lý lỗi 404 và Dừng sớm kịp thời
  // --------------------------------------------------------------------------
  console.log('\n[Phần 3] Phát hiện link 404, dừng duyệt sớm và phạt thao tác sai');
  env.reset('error_404');
  // Khi ở trang 404: Bấm ABORT_ON_404 nhận thưởng +5.0 trừ chi phí bước -0.5 = net +4.5
  const abortRes = env.step(GitHubAction.ABORT_ON_404);
  assertClose(abortRes.reward, 4.5, 0.01, 'ABORT_ON_404 trên trang 404 nhận net +4.5 (+5.0 thưởng - 0.5 chi phí bước)');
  assert(abortRes.done === true, 'Đợt kiểm chứng kết thúc ngay lập tức khi phát hiện lỗi 404');
  assert(abortRes.info.actionStatus === 'DỪNG_404_THÀNH_CÔNG', 'Trạng thái ghi nhận DỪNG_404_THÀNH_CÔNG');

  // Thao tác sai: Đang ở trang 404 mà bấm EXTRACT_PINNED
  env.reset('error_404');
  const invalidRes = env.step(GitHubAction.EXTRACT_PINNED);
  assertClose(invalidRes.reward, -4.5, 0.01, 'Bấm cào dữ liệu trên trang 404 bị phạt nặng -4.5 (-4.0 phạt - 0.5 chi phí bước)');
  assert(invalidRes.info.actionStatus === 'THAO_TÁC_SAI_TRÊN_404', 'Trạng thái ghi nhận THAO_TÁC_SAI_TRÊN_404');

  // --------------------------------------------------------------------------
  // PHẦN 4: Chuỗi hành động kiểm chứng hoàn chỉnh (Optimal Verification Path)
  // --------------------------------------------------------------------------
  console.log('\n[Phần 4] Chuỗi hành động kiểm chứng tối ưu (Hồ sơ chuẩn)');
  env.reset('standard_pinned');

  // Bước 1: Cào Pinned Repositories và Stars
  // Thưởng: +5.0 cào thành công - 0.5 chi phí bước = net +4.5
  const step1 = env.step(GitHubAction.EXTRACT_PINNED);
  assertClose(step1.reward, 4.5, 0.01, 'Bước 1: EXTRACT_PINNED nhận net +4.5');
  assert(step1.done === false, 'Chưa kết thúc sau bước 1');

  // Bước 2: Đọc Bio và README để lấy trường học
  // Thưởng: +3.0 đọc bio - 0.5 chi phí bước = net +2.5
  const step2 = env.step(GitHubAction.READ_BIO_README);
  assertClose(step2.reward, 2.5, 0.01, 'Bước 2: READ_BIO_README nhận net +2.5');
  assert(step2.done === false, 'Chưa kết thúc sau bước 2');

  // Bước 3: Đã đủ bằng chứng cốt lõi -> FINISH_AND_SUBMIT
  // Thưởng lớn: +10.0 hoàn tất - 0.5 chi phí bước = net +9.5
  const step3 = env.step(GitHubAction.FINISH_AND_SUBMIT);
  assertClose(step3.reward, 9.5, 0.01, 'Bước 3: FINISH_AND_SUBMIT nhận net +9.5 (+10.0 thưởng lớn - 0.5 chi phí bước)');
  assert(step3.done === true, 'Đợt kiểm chứng kết thúc thành công sau 3 bước tối ưu');
  assert(step3.info.actionStatus === 'HOÀN_TẤT_XÁC_THỰC_THÀNH_CÔNG', 'Trạng thái ghi nhận HOÀN_TẤT_XÁC_THỰC_THÀNH_CÔNG');

  // Kiểm tra Phạt nộp non (Premature Submit):
  env.reset('standard_pinned');
  // Vừa vào trang đã bấm nộp ngay khi chưa cào được gì: Phạt -5.0 - 0.5 = -5.5
  const prematureRes = env.step(GitHubAction.FINISH_AND_SUBMIT);
  assertClose(prematureRes.reward, -5.5, 0.01, 'Nộp non khi chưa cào đủ thông tin bị phạt -5.5');
  assert(prematureRes.info.actionStatus === 'NỘP_NON_CHƯA_ĐỦ_THÔNG_TIN', 'Trạng thái ghi nhận NỘP_NON_CHƯA_ĐỦ_THÔNG_TIN');

  // --------------------------------------------------------------------------
  // PHẦN 5: Mô phỏng 15 lượt kiểm chứng ngẫu nhiên
  // --------------------------------------------------------------------------
  console.log('\n[Phần 5] Mô phỏng 15 lượt kiểm chứng với hồ sơ và hành động ngẫu nhiên');
  for (let ep = 1; ep <= 15; ep++) {
    let s = env.reset();
    let done = false;
    let steps = 0;
    let totalReward = 0;

    while (!done && steps < 12) {
      // Chọn hành động ngẫu nhiên
      const act = Math.floor(Math.random() * 5) as GitHubAction;
      const res = env.step(act);
      s = res.state;
      totalReward += res.reward;
      done = res.done;
      steps++;

      assert(s.length === 12, `Lượt ${ep} Bước ${steps}: Vector trạng thái đủ 12 chiều`);
      assert(s.every(v => typeof v === 'number' && !Number.isNaN(v)), `Lượt ${ep} Bước ${steps}: Dữ liệu số hợp lệ`);
    }

    assert(done, `Lượt ${ep}: Kết thúc đúng quy trình sau ${steps} bước`);
    console.log(`    Lượt ${ep}: Phân loại=${env.getProfile().archetype}, Số bước=${steps}, Tổng thưởng=${totalReward.toFixed(2)}`);
  }
}

// ============================================================================
// HÀM CHẠY KIỂM THỬ CHÍNH
// ============================================================================

function runPPOVerificationTests(): void {
  const startTime = Date.now();
  console.log('================================================================');
  console.log('     BỘ KIỂM THỬ TỰ ĐỘNG MÔI TRƯỜNG HỌC TĂNG CƯỜNG PPO (HK7)    ');
  console.log('================================================================');

  try {
    testGitHubVerificationEnv();

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
      console.log('\n>> TẤT CẢ CÁC BÀI TEST PPO ĐÃ VƯỢT QUA 100% VỚI 0 LỖI. <<\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('\nXẢY RA LỖI NGOẠI LỆ TRONG KHI TEST PPO:', error);
    process.exit(1);
  }
}

runPPOVerificationTests();
