/**
 * ============================================================================
 * ĐỒ ÁN HỌC TĂNG CƯỜNG (REINFORCEMENT LEARNING - HK7)
 * Đề tài: Nanobrowser HR Agent (Trợ Lý Tuyển Dụng Thông Minh)
 * 
 * FILE: candidateScreeningEnv.ts
 * MỤC ĐÍCH: Môi trường giả lập theo chuẩn Gymnasium (Gym-style) bằng TypeScript
 *           phục vụ huấn luyện mô hình Deep Q-Network (DQN - Thuật toán 1).
 * BÀI TOÁN: Sàng lọc hồ sơ ứng viên tuần tự có ràng buộc hạn ngạch phỏng vấn
 *           (Sequential Candidate Screening with Budget Constraint).
 * TÀI LIỆU THAM CHIẾU: MDP.md (Phần 2: Thiết kế MDP chi tiết cho DQN)
 * ============================================================================
 */

import {
  CandidateAction,
  CandidateFeature,
  CandidatePoolItem,
  CandidateScreeningEnvConfig,
  StepResult,
} from './types';

// Xuất lại các kiểu dữ liệu để các module bên ngoài sử dụng tiện lợi
export { CandidateAction } from './types';
export type {
  CandidateFeature,
  CandidatePoolItem,
  CandidateScreeningEnvConfig,
  StepResult,
};

/**
 * Các hằng số tham số mặc định cho Môi trường Sàng lọc hồ sơ
 * Được trích xuất chính xác theo công thức toán học trong tài liệu MDP.md
 */
const DEFAULT_CONFIG: Required<CandidateScreeningEnvConfig> = {
  defaultPoolSize: 30,         // N = 30 ứng viên trong một đợt tuyển
  defaultBudgetK: 5,           // K = 5 suất phỏng vấn tối đa của phòng HR
  minMatchThreshold: 75,       // Ngưỡng đạt chuẩn phỏng vấn (theta = 75 điểm)
  excellentMatchThreshold: 85, // Ngưỡng ứng viên xuất sắc / nhân tài (85 điểm)
  terminalBonusMinAvgScore: 80,// Điểm trung bình tối thiểu để nhận thưởng cuối kỳ
  terminalBonus: 5.0,          // Phần thưởng lớn khi chọn đủ K ứng viên chất lượng (+5.0)
  shortfallPenalty: 1.0,       // Phạt cho mỗi suất phỏng vấn bị bỏ trống (-1.0 / suất)
  holdPenalty: -0.2,           // Chi phí trì hoãn khi chọn hành động HOLD (-0.2)
  stepPenalty: 0.0,           // Phạt bước đi cố định
  overQuotaPenalty: -5.0,      // Phạt cực nặng nếu cố tình ACCEPT khi đã hết sạch slot
  terminateOnQuotaFilled: true,// Tự động kết thúc sớm episode khi đã tuyển đủ K suất
};

/**
 * Lớp CandidateScreeningEnv: Hiện thực Môi trường mô phỏng chuẩn Gym
 * Quản lý trạng thái đợt tuyển dụng, xử lý các quyết định duyệt/loại/chờ của Agent,
 * tính toán phần thưởng/phạt và chuyển đổi trạng thái theo quy trình MDP.
 */
export class CandidateScreeningEnv {
  public readonly config: Required<CandidateScreeningEnvConfig>;

  // Không gian hành động và quan sát chuẩn Gymnasium
  public readonly action_space = { n: 3 };    // 3 hành động: REJECT(0), ACCEPT(1), HOLD(2)
  public readonly observation_space = { shape: [24] }; // Vector trạng thái 24 chiều

  // Các biến theo dõi trạng thái nội tại của một Episode (đợt tuyển)
  private candidates: CandidatePoolItem[] = []; // Danh sách ứng viên trong đợt tuyển
  private currentIdx: number = 0;              // Vị trí hồ sơ đang được xem xét (từ 0 đến N-1)
  private budgetK: number = 5;                 // Tổng ngân sách phỏng vấn K
  private kRemain: number = 5;                 // Số suất phỏng vấn còn lại (k_remain)
  private nRemain: number = 30;                // Số hồ sơ còn lại chưa duyệt (n_remain)

  // Danh sách lưu trữ hồ sơ theo từng nhóm quyết định
  private acceptedCandidates: CandidatePoolItem[] = []; // Các ứng viên đã được chọn phỏng vấn
  private rejectedCandidates: CandidatePoolItem[] = []; // Các ứng viên bị từ chối
  private heldCandidates: CandidatePoolItem[] = [];     // Các ứng viên tạm giữ vào danh sách chờ

  // Tổng phần thưởng tích lũy trong episode hiện tại
  private episodeReward: number = 0;

  // Cờ báo hiệu episode đã kết thúc
  private done: boolean = false;

  /**
   * Hàm khởi tạo môi trường với các cấu hình tùy chọn
   * @param customConfig Các tham số ghi đè cấu hình mặc định (nếu có)
   */
  constructor(customConfig?: CandidateScreeningEnvConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...customConfig,
    };
    this.budgetK = this.config.defaultBudgetK;
    this.kRemain = this.budgetK;
    this.nRemain = this.config.defaultPoolSize;
  }

  /**
   * PHƯƠNG THỨC RESET (Khởi tạo đợt tuyển dụng mới):
   * Đưa môi trường về trạng thái ban đầu của một episode:
   * - Tạo mới danh sách N ứng viên (hoặc nhận pool tùy chỉnh từ DB).
   * - Reset số suất phỏng vấn còn lại về K.
   * - Đặt lại con trỏ duyệt về ứng viên đầu tiên (currentIdx = 0).
   * - Xóa lịch sử duyệt của đợt trước.
   * 
   * @param customPool Danh sách ứng viên tùy chỉnh (tùy chọn)
   * @param budgetK Ngân sách phỏng vấn cho đợt này (mặc định lấy theo config)
   * @returns Vector trạng thái ban đầu s_0 (24 chiều)
   */
  public reset(
    customPool?: CandidatePoolItem[] | { id?: string; name?: string; score?: number; features?: number[]; rawInfo?: any }[],
    budgetK?: number
  ): number[] {
    this.budgetK = budgetK ?? this.config.defaultBudgetK;
    this.kRemain = this.budgetK;

    if (customPool && customPool.length > 0) {
      // Chuẩn hóa danh sách ứng viên được truyền vào
      this.candidates = customPool.map((item, idx) => {
        if ('features' in item && Array.isArray(item.features) && item.features.length >= 16) {
          const score =
            typeof item.score === 'number'
              ? item.score
              : CandidateScreeningEnv.computeScoreFromFeatures(item.features);
          return {
            id: item.id ?? `cand_${idx + 1}`,
            name: item.name ?? `Ứng viên ${idx + 1}`,
            score,
            features: item.features,
            rawInfo: item.rawInfo,
          };
        } else {
          // Tự động bổ sung các chiều mặc định nếu thiếu
          const features = (item.features ?? []).slice(0, 16);
          while (features.length < 16) {
            features.push(0);
          }
          const score =
            typeof item.score === 'number'
              ? item.score
              : CandidateScreeningEnv.computeScoreFromFeatures(features);
          return {
            id: item.id ?? `cand_${idx + 1}`,
            name: item.name ?? `Ứng viên ${idx + 1}`,
            score,
            features,
            rawInfo: item.rawInfo,
          };
        }
      });
    } else {
      // Tự động sinh ngẫu nhiên danh sách N ứng viên đa dạng
      this.candidates = this.generateSyntheticPool(this.config.defaultPoolSize);
    }

    this.currentIdx = 0;
    this.nRemain = this.candidates.length;
    this.acceptedCandidates = [];
    this.rejectedCandidates = [];
    this.heldCandidates = [];
    this.episodeReward = 0;
    this.done = false;

    // Trả về vector trạng thái 24 chiều ban đầu
    return this.getState();
  }

  /**
   * PHƯƠNG THỨC STEP (HÀM CHUYỂN TRẠNG THÁI VÀ TÍNH PHẦN THƯỞNG):
   * Tiếp nhận hành động của Agent cho ứng viên hiện tại, thực hiện:
   * 1. Áp dụng hành động (ACCEPT / REJECT / HOLD) và cập nhật số slot còn lại.
   * 2. Tính toán phần thưởng tức thời r_t dựa trên công thức hàm Reward trong MDP.md.
   * 3. Chuyển con trỏ sang ứng viên tiếp theo (currentIdx + 1).
   * 4. Kiểm tra điều kiện kết thúc đợt tuyển (hết CV hoặc hết slot).
   * 5. Trả về trạng thái kế tiếp s_{t+1}, reward r_t, cờ done và thông tin info.
   * 
   * @param action Hành động chọn: REJECT (0), ACCEPT (1), hoặc HOLD (2)
   * @returns Đối tượng StepResult chứa { state, reward, done, info }
   */
  public step(action: CandidateAction | number): StepResult {
    // Trường hợp episode đã kết thúc nhưng vẫn cố gọi step
    if (this.done) {
      return {
        state: this.getState(),
        reward: 0,
        done: true,
        info: {
          warning: 'Đợt tuyển đã kết thúc. Hãy gọi reset() để bắt đầu đợt mới.',
          currentIdx: this.currentIdx,
          kRemain: this.kRemain,
          nRemain: this.nRemain,
          episodeReward: this.episodeReward,
        },
      };
    }

    const currentCand = this.candidates[this.currentIdx];
    if (!currentCand) {
      this.done = true;
      return {
        state: this.getState(),
        reward: 0,
        done: true,
        info: { error: 'Không tìm thấy hồ sơ ứng viên tại vị trí hiện tại' },
      };
    }

    const M = currentCand.score; // Điểm năng lực tổng hợp của ứng viên [0, 100]
    let stepReward = 0;

    // ========================================================================
    // TÍNH TOÁN PHẦN THƯỞNG/PHẠT THEO CÔNG THỨC TOÁN TRONG MDP.md
    // ========================================================================
    switch (action) {
      case CandidateAction.ACCEPT: {
        if (this.kRemain <= 0) {
          // Phạt rất nặng nếu chọn ACCEPT khi ngân sách phỏng vấn đã hết sạch
          stepReward = this.config.overQuotaPenalty;
        } else {
          // Trừ 1 suất phỏng vấn trong hạn ngạch
          this.kRemain -= 1;
          this.acceptedCandidates.push(currentCand);

          if (M >= this.config.minMatchThreshold) {
            // Duyệt đúng ứng viên đạt chuẩn (M >= 75 điểm): Thưởng từ +2.0 đến +3.0
            // Công thức: r = 2.0 + ((M - 75) / 25) * 1.0
            stepReward = 2.0 + ((M - 75.0) / 25.0) * 1.0;
          } else {
            // Duyệt nhầm ứng viên yếu (M < 75 điểm): Phạt từ -1.5 đến -3.0
            // Công thức: r = -1.5 - ((75 - M) / 75) * 1.5
            stepReward = -1.5 - ((75.0 - M) / 75.0) * 1.5;
          }
        }
        break;
      }

      case CandidateAction.REJECT: {
        this.rejectedCandidates.push(currentCand);

        if (M < this.config.minMatchThreshold) {
          // Loại bỏ đúng ứng viên không đạt yêu cầu (M < 75 điểm): Thưởng sàng lọc +1.0
          stepReward = 1.0;
        } else if (M >= this.config.excellentMatchThreshold) {
          // Bỏ lỡ (loại nhầm) nhân tài xuất sắc (M >= 85 điểm): Phạt nặng từ -2.0 đến -3.0
          // Công thức: r = -2.0 - ((M - 85) / 15) * 1.0
          stepReward = -2.0 - ((M - 85.0) / 15.0) * 1.0;
        } else {
          // Loại ứng viên ở mức trung bình khá (75 <= M < 85): Trung hòa 0.0 điểm
          stepReward = 0.0;
        }
        break;
      }

      case CandidateAction.HOLD: {
        this.heldCandidates.push(currentCand);
        // Phạt nhẹ chi phí trì hoãn quyết định (-0.2 điểm)
        stepReward = this.config.holdPenalty;
        break;
      }

      default: {
        // Hành động không hợp lệ
        stepReward = -1.0;
        break;
      }
    }

    // Áp dụng phạt bước đi cố định nếu có cấu hình
    if (this.config.stepPenalty !== 0) {
      stepReward -= this.config.stepPenalty;
    }

    // ========================================================================
    // CHUYỂN DỊCH VỊ TRÍ TRẠNG THÁI (STATE TRANSITION)
    // ========================================================================
    // Tăng con trỏ sang ứng viên kế tiếp
    this.currentIdx += 1;
    // Cập nhật số lượng hồ sơ chưa duyệt còn lại
    this.nRemain = Math.max(0, this.candidates.length - this.currentIdx);

    // ========================================================================
    // ĐÁNH GIÁ ĐIỀU KIỆN KẾT THÚC EPISODE (TERMINATION CONDITIONS)
    // Episode kết thúc khi:
    // 1. Đã xem xét hết toàn bộ N hồ sơ trong danh sách (currentIdx >= N), HOẶC
    // 2. Đã tuyển đủ chỉ tiêu phỏng vấn (kRemain == 0) và bật chế độ dừng sớm.
    // ========================================================================
    const isTerminal =
      this.currentIdx >= this.candidates.length ||
      (this.config.terminateOnQuotaFilled && this.kRemain === 0);

    let terminalReward = 0;
    if (isTerminal) {
      this.done = true;
      const kChosen = this.acceptedCandidates.length;

      if (kChosen === this.budgetK) {
        // Tính điểm trung bình của các ứng viên đã được chọn vào phỏng vấn
        const avgScore =
          kChosen > 0
            ? this.acceptedCandidates.reduce((sum, c) => sum + c.score, 0) /
              kChosen
            : 0;

        if (avgScore >= this.config.terminalBonusMinAvgScore) {
          // THƯỞNG LỚN CUỐI EPISODE (+5.0): Chọn đủ K suất với chất lượng đội ngũ cao (>= 80 điểm)
          terminalReward = this.config.terminalBonus;
        }
      } else if (kChosen < this.budgetK) {
        // PHẠT THIẾU CHỈ TIÊU: Phạt -1.0 điểm cho mỗi suất phỏng vấn bị bỏ trống khi hết danh sách
        terminalReward =
          -this.config.shortfallPenalty * (this.budgetK - kChosen);
      }

      stepReward += terminalReward;
    }

    this.episodeReward += stepReward;

    // Trích xuất vector trạng thái kế tiếp s_{t+1} (24 chiều)
    const nextState = this.getState();

    // Đóng gói thông tin chi tiết hỗ trợ debug và ghi log
    const info: Record<string, any> = {
      step: this.currentIdx,
      action,
      actionName: CandidateAction[action] ?? 'KHÔNG_XÁC_ĐỊNH',
      candidate: {
        id: currentCand.id,
        name: currentCand.name,
        score: currentCand.score,
      },
      kRemain: this.kRemain,
      nRemain: this.nRemain,
      budgetK: this.budgetK,
      poolSize: this.candidates.length,
      acceptedCount: this.acceptedCandidates.length,
      rejectedCount: this.rejectedCandidates.length,
      heldCount: this.heldCandidates.length,
      stepReward: Math.round(stepReward * 1000) / 1000,
      terminalReward: Math.round(terminalReward * 1000) / 1000,
      totalEpisodeReward: Math.round(this.episodeReward * 1000) / 1000,
      avgAcceptedScore:
        this.acceptedCandidates.length > 0
          ? Math.round(
              (this.acceptedCandidates.reduce((s, c) => s + c.score, 0) /
                this.acceptedCandidates.length) *
                10
            ) / 10
          : 0,
    };

    return {
      state: nextState,
      reward: Math.round(stepReward * 1000) / 1000,
      done: this.done,
      info,
    };
  }

  /**
   * Lấy vector trạng thái quan sát 24 chiều hiện tại s_t
   */
  public getState(): number[] {
    return this.buildStateVector(this.currentIdx);
  }

  /**
   * BỘ SINH DỮ LIỆU ỨNG VIÊN GIẢ LẬP ĐA PHÂN TẦNG:
   * Tạo ra danh sách N ứng viên với phân phối năng lực thực tế gồm 4 phân tầng:
   * - Tầng 1: Nhân tài xuất sắc (Star ~15%, điểm M trong khoảng [85, 98])
   * - Tầng 2: Ứng viên khá giỏi (Good ~35%, điểm M trong khoảng [75, 84.9])
   * - Tầng 3: Ứng viên trung bình (Average ~30%, điểm M trong khoảng [60, 74.9])
   * - Tầng 4: Ứng viên yếu / có rủi ro (Weak ~20%, điểm M trong khoảng [25, 59.9])
   * 
   * @param n Số lượng ứng viên cần tạo (mặc định: 30)
   * @returns Mảng các đối tượng CandidatePoolItem với 16 đặc trưng nội tại và điểm M
   */
  public generateSyntheticPool(n: number = 30): CandidatePoolItem[] {
    const pool: CandidatePoolItem[] = [];

    for (let i = 0; i < n; i++) {
      const roll = Math.random();
      let tier: 'star' | 'good' | 'average' | 'weak';

      if (roll < 0.15) {
        tier = 'star';    // Xuất sắc
      } else if (roll < 0.50) {
        tier = 'good';    // Khá giỏi
      } else if (roll < 0.80) {
        tier = 'average'; // Trung bình
      } else {
        tier = 'weak';    // Yếu
      }

      const features: number[] = new Array(16).fill(0);

      switch (tier) {
        case 'star': {
          // Hồ sơ ứng viên xuất sắc
          features[0] = Math.min(1.0, 0.86 + Math.random() * 0.13); // s1: Điểm tương đồng ngữ nghĩa Gemini
          features[1] = Math.min(1.0, 0.82 + Math.random() * 0.18); // s2: Trùng khớp kỹ năng cứng
          features[2] = Math.min(1.0, 0.85 + Math.random() * 0.15); // s3: Số năm kinh nghiệm phù hợp
          features[3] = Math.random() > 0.3 ? 0.8 : 1.0;            // s4: Học vị (Đại học hoặc Thạc sĩ)
          features[4] = Math.min(1.0, 0.82 + Math.random() * 0.16); // s5: Điểm đánh giá dự án thực tế
          features[5] = Math.min(1.0, (2 + Math.floor(Math.random() * 4)) / 5); // s6: Kỹ năng vượt trội
          features[6] = Math.min(1.0, (4 + Math.random() * 5) / 10); // s7: Kinh nghiệm (4 - 9 năm)
          features[7] = Math.min(1.0, (8 + Math.random() * 10) / 20); // s8: Số lượng dự án (8 - 18 dự án)
          features[8] = Math.min(1.0, (3.4 + Math.random() * 0.6) / 4.0); // s9: GPA đại học (3.4 - 4.0)
          const stars = 100 + Math.floor(Math.random() * 800);
          features[9] = Math.log(1 + stars) / Math.log(1 + 1000);  // s10: Số sao GitHub
          features[10] = Math.min(1.0, (3 + Math.floor(Math.random() * 4)) / 6); // s11: Pinned repos
          features[11] = 1.0;                                      // s12: Đã xác thực uy tín qua Nanobrowser
          features[12] = 0.0;                                      // s13: Không có cảnh báo rủi ro (0 Red flags)
          features[13] = Math.min(1.0, (2.5 + Math.random() * 2.5) / 5); // s14: Độ ổn định công việc cao
          features[14] = 1.0;                                      // s15: Đầy đủ thông tin liên hệ
          features[15] = Math.random() > 0.3 ? 1.0 : 0.5;          // s16: Khu vực địa lý phù hợp
          break;
        }

        case 'good': {
          // Hồ sơ ứng viên khá giỏi
          features[0] = Math.min(1.0, 0.74 + Math.random() * 0.14);
          features[1] = Math.min(1.0, 0.72 + Math.random() * 0.15);
          features[2] = Math.min(1.0, 0.70 + Math.random() * 0.20);
          features[3] = 0.8; // Bằng Đại học
          features[4] = Math.min(1.0, 0.68 + Math.random() * 0.18);
          features[5] = Math.min(1.0, (1 + Math.floor(Math.random() * 3)) / 5);
          features[6] = Math.min(1.0, (2 + Math.random() * 4) / 10); // 2 - 6 năm KN
          features[7] = Math.min(1.0, (4 + Math.random() * 7) / 20);
          features[8] = Math.min(1.0, (2.8 + Math.random() * 0.7) / 4.0); // GPA 2.8 - 3.5
          const stars = 20 + Math.floor(Math.random() * 150);
          features[9] = Math.log(1 + stars) / Math.log(1 + 1000);
          features[10] = Math.min(1.0, (1 + Math.floor(Math.random() * 3)) / 6);
          features[11] = Math.random() > 0.3 ? 1.0 : 0.0;
          features[12] = Math.random() > 0.8 ? 0.2 : 0.0; // Tối đa 1 red flag nhỏ
          features[13] = Math.min(1.0, (1.5 + Math.random() * 2.0) / 5);
          features[14] = Math.random() > 0.1 ? 1.0 : 0.8;
          features[15] = Math.random() > 0.4 ? 1.0 : 0.5;
          break;
        }

        case 'average': {
          // Hồ sơ ứng viên trung bình
          features[0] = Math.min(1.0, 0.58 + Math.random() * 0.18);
          features[1] = Math.min(1.0, 0.55 + Math.random() * 0.20);
          features[2] = Math.min(1.0, 0.50 + Math.random() * 0.25);
          features[3] = Math.random() > 0.4 ? 0.8 : 0.5; // Đại học hoặc Cao đẳng
          features[4] = Math.min(1.0, 0.50 + Math.random() * 0.20);
          features[5] = Math.min(1.0, Math.floor(Math.random() * 2) / 5);
          features[6] = Math.min(1.0, (1 + Math.random() * 3) / 10);
          features[7] = Math.min(1.0, (2 + Math.random() * 4) / 20);
          features[8] = Math.min(1.0, (2.4 + Math.random() * 0.6) / 4.0);
          const stars = Math.floor(Math.random() * 30);
          features[9] = Math.log(1 + stars) / Math.log(1 + 1000);
          features[10] = Math.min(1.0, Math.floor(Math.random() * 2) / 6);
          features[11] = 0.0;
          features[12] = Math.random() > 0.6 ? 0.2 : 0.0;
          features[13] = Math.min(1.0, (1.0 + Math.random() * 1.5) / 5);
          features[14] = 0.8;
          features[15] = Math.random() > 0.5 ? 0.5 : 0.0;
          break;
        }

        case 'weak': {
          // Hồ sơ ứng viên yếu / rủi ro
          features[0] = Math.min(1.0, 0.25 + Math.random() * 0.30);
          features[1] = Math.min(1.0, 0.20 + Math.random() * 0.30);
          features[2] = Math.min(1.0, 0.15 + Math.random() * 0.35);
          features[3] = Math.random() > 0.5 ? 0.5 : 0.0;
          features[4] = Math.min(1.0, 0.20 + Math.random() * 0.30);
          features[5] = 0.0;
          features[6] = Math.min(1.0, Math.random() * 1.5 / 10);
          features[7] = Math.min(1.0, Math.random() * 2 / 20);
          features[8] = Math.min(1.0, (2.0 + Math.random() * 0.5) / 4.0);
          features[9] = 0.0;
          features[10] = 0.0;
          features[11] = Math.random() > 0.5 ? -1.0 : 0.0; // Có thể bị cờ gian lận (-1.0)
          features[12] = Math.min(1.0, (1 + Math.floor(Math.random() * 3)) / 5); // 1 - 3 red flags
          features[13] = Math.min(1.0, Math.random() * 1.0 / 5);
          features[14] = 0.5;
          features[15] = 0.0;
          break;
        }
      }

      const score = CandidateScreeningEnv.computeScoreFromFeatures(features);

      pool.push({
        id: `cand_synthetic_${i + 1}`,
        name: `Ứng viên ${i + 1} (${tier.toUpperCase()})`,
        score,
        features,
        rawInfo: { tier, index: i },
      });
    }

    return pool;
  }

  /**
   * Sinh mảng thuần các vector đặc trưng 16 chiều cho N ứng viên giả lập
   */
  public generateSyntheticFeatureVectors(n: number = 30): number[][] {
    return this.generateSyntheticPool(n).map((c) => c.features);
  }

  /**
   * TÍNH ĐIỂM NĂNG LỰC TỔNG HỢP M(c, j) TRONG KHOẢNG [0, 100]:
   * Áp dụng công thức tổng có trọng số từ 16 đặc trưng nội tại của CV và JD:
   * - Điểm ngữ nghĩa Gemini: 28%
   * - Kỹ năng cứng (Tech stack): 24%
   * - Kinh nghiệm làm việc: 14%
   * - Đánh giá dự án: 10%
   * - Học vị & Bằng cấp: 8%
   * - GPA: 5%, Số sao GitHub: 4%, Độ ổn định công việc: 4%, Kỹ năng bổ sung: 3%
   * - Điều chỉnh uy tín xác thực Nanobrowser (+4 nếu Verified, -15 nếu Risky)
   * - Trừ điểm cảnh báo rủi ro (Red Flags: tối đa -20 điểm)
   */
  public static computeScoreFromFeatures(features: number[]): number {
    const s1_sem = features[0] ?? 0;
    const s2_tech = features[1] ?? 0;
    const s3_exp = features[2] ?? 0;
    const s4_edu = features[3] ?? 0;
    const s5_proj = features[4] ?? 0;
    const s6_bonus = features[5] ?? 0;
    const s7_workExp = features[6] ?? 0;
    const s8_projects = features[7] ?? 0;
    const s9_gpa = features[8] ?? 0;
    const s10_stars = features[9] ?? 0;
    const s11_pinned = features[10] ?? 0;
    const s12_verified = features[11] ?? 0;
    const s13_redFlags = features[12] ?? 0;
    const s14_stability = features[13] ?? 0;
    const s15_contact = features[14] ?? 0;
    const s16_location = features[15] ?? 0;

    // Tổng điểm cơ bản có trọng số
    let raw =
      s1_sem * 28 +
      s2_tech * 24 +
      s3_exp * 14 +
      s4_edu * 8 +
      s5_proj * 10 +
      s6_bonus * 3 +
      s9_gpa * 5 +
      s10_stars * 4 +
      s14_stability * 4;

    // Điều chỉnh dựa trên trạng thái kiểm chứng Nanobrowser
    if (s12_verified > 0.5) {
      raw += 4;  // Cộng 4 điểm nếu hồ sơ đã được kiểm chứng GitHub thực tế
    } else if (s12_verified < -0.5) {
      raw -= 15; // Trừ nặng 15 điểm nếu phát hiện hồ sơ rủi ro/khai khống
    }

    // Trừ điểm cảnh báo rủi ro (Red flags / 5 * 20)
    raw -= s13_redFlags * 20;

    // Giới hạn điểm số chặt chẽ trong khoảng [0, 100]
    return Math.min(100, Math.max(0, Math.round(raw * 10) / 10));
  }

  /**
   * XÂY DỰNG VECTOR QUAN SÁT 24 CHIỀU (STATE VECTOR s_t in R^24):
   * Kết hợp 16 đặc trưng nội tại của ứng viên hiện tại với 8 đặc trưng ngữ cảnh
   * hạn ngạch tuyển dụng theo đúng đặc tả toán học trong MDP.md.
   */
  private buildStateVector(candidateIndex: number): number[] {
    const K = this.budgetK;
    const N = this.candidates.length;

    // 16 chiều đặc trưng của ứng viên tại vị trí candidateIndex
    const candFeatures: number[] = new Array(16).fill(0);
    if (candidateIndex < N && this.candidates[candidateIndex]) {
      const cand = this.candidates[candidateIndex]!;
      for (let i = 0; i < 16; i++) {
        candFeatures[i] = cand.features[i] ?? 0;
      }
    }

    // 8 chiều ngữ cảnh hạn ngạch & tiến trình tuyển dụng
    const kRemainRatio = K > 0 ? Math.max(0, this.kRemain) / K : 0; // s17: k_remain / K
    const nRemainRatio = N > 0 ? Math.max(0, this.nRemain) / N : 0; // s18: n_remain / N
    const scarcityRatio =
      Math.max(0, this.kRemain) / (Math.max(0, this.nRemain) + 1);    // s19: Tỷ lệ khan hiếm slot

    // s20: Điểm trung bình của các ứng viên đã được chọn (Accept) trước đó
    const avgAcceptedScore =
      this.acceptedCandidates.length > 0
        ? this.acceptedCandidates.reduce((sum, c) => sum + c.score, 0) /
          (this.acceptedCandidates.length * 100)
        : 0;

    // s21: Điểm trung bình của các ứng viên đã bị từ chối (Reject) trước đó
    const avgRejectedScore =
      this.rejectedCandidates.length > 0
        ? this.rejectedCandidates.reduce((sum, c) => sum + c.score, 0) /
          (this.rejectedCandidates.length * 100)
        : 0;

    // s22: Tỷ lệ chấp nhận hiện tại trong đợt tuyển
    const evaluatedCount = candidateIndex;
    const acceptanceRate =
      evaluatedCount > 0
        ? this.acceptedCandidates.length / evaluatedCount
        : 0;

    // s23: Tiến trình duyệt danh sách hiện tại (t / N)
    const progressRatio = N > 0 ? Math.min(1.0, candidateIndex / N) : 1.0;

    // s24: Cờ báo động áp lực thiếu chỉ tiêu (1.0 nếu số hồ sơ còn lại <= số slot cần chọn)
    const urgencyFlag =
      this.nRemain <= this.kRemain && this.kRemain > 0 ? 1.0 : 0.0;

    // Ghép đủ 24 chiều hoàn chỉnh
    return [
      ...candFeatures,    // 16 chiều đặc trưng ứng viên (s1 -> s16)
      kRemainRatio,       // s17
      nRemainRatio,       // s18
      scarcityRatio,      // s19
      avgAcceptedScore,   // s20
      avgRejectedScore,   // s21
      acceptanceRate,     // s22
      progressRatio,      // s23
      urgencyFlag,        // s24
    ];
  }

  // ==========================================================================
  // CÁC PHƯƠNG THỨC TRỢ GIÚP VÀ TRUY XUẤT THÔNG TIN (GETTERS)
  // ==========================================================================

  /** Lấy số suất phỏng vấn còn lại (k_remain) */
  public getKRemain(): number {
    return this.kRemain;
  }

  /** Lấy số hồ sơ chưa duyệt còn lại (n_remain) */
  public getNRemain(): number {
    return this.nRemain;
  }

  /** Lấy vị trí con trỏ hồ sơ hiện tại (0 đến N-1) */
  public getCurrentIdx(): number {
    return this.currentIdx;
  }

  /** Lấy danh sách toàn bộ hồ sơ ứng viên trong đợt tuyển này */
  public getCandidates(): CandidatePoolItem[] {
    return [...this.candidates];
  }

  /** Lấy danh sách các ứng viên đã được Agent duyệt vào phỏng vấn */
  public getAcceptedCandidates(): CandidatePoolItem[] {
    return [...this.acceptedCandidates];
  }

  /** Lấy danh sách các ứng viên đã bị Agent từ chối */
  public getRejectedCandidates(): CandidatePoolItem[] {
    return [...this.rejectedCandidates];
  }

  /** Lấy danh sách các ứng viên đang được tạm giữ trong danh sách chờ */
  public getHeldCandidates(): CandidatePoolItem[] {
    return [...this.heldCandidates];
  }

  /** Lấy tổng phần thưởng tích lũy của episode hiện tại */
  public getEpisodeReward(): number {
    return this.episodeReward;
  }

  /** Kiểm tra xem đợt tuyển hiện tại đã kết thúc chưa */
  public isDone(): boolean {
    return this.done;
  }
}
