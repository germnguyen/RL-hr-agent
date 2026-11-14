/**
 * ============================================================================
 * ĐỒ ÁN HỌC TĂNG CƯỜNG (REINFORCEMENT LEARNING - HK7)
 * Đề tài: Nanobrowser HR Agent (Trợ Lý Tuyển Dụng Thông Minh)
 * 
 * FILE: types.ts
 * MỤC ĐÍCH: Định nghĩa các kiểu dữ liệu, interface và hằng số cho bài toán
 *           Sàng lọc hồ sơ ứng viên bằng thuật toán Deep Q-Network (DQN).
 * TÀI LIỆU THAM CHIẾU: MDP.md (Phần 2: Thiết kế MDP chi tiết cho DQN)
 * ============================================================================
 */

/**
 * Không gian hành động của bài toán duyệt hồ sơ (Discrete Action Space: 3 hành động)
 * - REJECT (0): Từ chối hồ sơ ứng viên. Không tiêu tốn suất phỏng vấn (k_remain giữ nguyên).
 * - ACCEPT (1): Đồng ý đưa ứng viên vào danh sách phỏng vấn. Tiêu tốn 1 suất (k_remain giảm 1).
 * - HOLD (2): Tạm giữ hồ sơ vào danh sách chờ cân nhắc.
 */
export enum CandidateAction {
  REJECT = 0, // Loại hồ sơ
  ACCEPT = 1, // Duyệt vào phỏng vấn
  HOLD = 2,   // Tạm giữ / Chờ xem xét
}

// Bí danh thuận tiện khi sử dụng trong mã nguồn
export type ScreeningAction = CandidateAction;

/**
 * Cấu trúc đối tượng biểu diễn đầy đủ Vector quan sát 24 chiều (State s_t in R^24)
 * Được chia thành 3 nhóm thông tin chính theo đặc tả toán học trong MDP.md:
 * 
 * - Nhóm 1 (6 chiều): Mức độ tương thích giữa CV và yêu cầu công việc (Job)
 * - Nhóm 2 (10 chiều): Hồ sơ năng lực thực tế, uy tín và thông tin ứng viên
 * - Nhóm 3 (8 chiều): Ngữ cảnh hạn ngạch tuyển dụng và tiến trình đợt tuyển
 */
export interface CandidateFeature {
  // ==========================================================================
  // NHÓM 1: MỨC ĐỘ PHÙ HỢP GIỮA CV VÀ JOB (6 CHIỀU: s1 -> s6)
  // ==========================================================================

  /** s1: [0, 1] Điểm tương đồng ngữ nghĩa do Gemini phân tích giữa CV và JD */
  semanticSimilarity: number;

  /** s2: [0, 1] Tỷ lệ trùng khớp từ khóa kỹ năng cứng (Tech stack match ratio) */
  techStackMatch: number;

  /** s3: [0, 1] Độ tương thích về số năm kinh nghiệm: min(1.0, kn_ung_vien / kn_yeu_cau) */
  experienceMatch: number;

  /** s4: [0, 1] Mức độ phù hợp về học vị (0.0: Không, 0.5: Cao đẳng, 0.8: Đại học, 1.0: Thạc sĩ/Tiến sĩ) */
  educationLevel: number;

  /** s5: [0, 1] Điểm đánh giá độ phức tạp và quy mô của các dự án thực tế trong CV */
  projectScore: number;

  /** s6: [0, 1] Số lượng kỹ năng bổ sung vượt trội ngoài yêu cầu (chuẩn hóa: min(1.0, bonusSkills / 5)) */
  bonusSkills: number;

  // ==========================================================================
  // NHÓM 2: HỒ SƠ NĂNG LỰC THỰC TẾ & UY TÍN (10 CHIỀU: s7 -> s16)
  // ==========================================================================

  /** s7: [0, 1] Số năm kinh nghiệm làm việc thực tế (chuẩn hóa chia cho 10 năm) */
  workExperienceYears: number;

  /** s8: [0, 1] Số lượng dự án thực tế đã hoàn thành (chuẩn hóa chia cho 20 dự án) */
  completedProjects: number;

  /** s9: [0, 1] Điểm trung bình học tập GPA đại học thang 4.0 quy đổi về [0, 1] (GPA / 4.0) */
  gpa: number;

  /** s10: [0, 1] Số sao GitHub tích lũy logarit: log(1 + stars) / log(1 + 1000) */
  githubStars: number;

  /** s11: [0, 1] Số lượng Pinned Repositories trên GitHub (số repo / 6) */
  pinnedRepos: number;

  /** s12: [-1, 1] Trạng thái kiểm chứng qua Nanobrowser (1.0: Đã xác thực, 0.0: Chưa xác thực, -1.0: Có rủi ro/Gian lận) */
  verificationStatus: number;

  /** s13: [0, 1] Số lượng cảnh báo rủi ro (Red Flags) do AI phát hiện (chuẩn hóa: min(1.0, flags / 5)) */
  redFlags: number;

  /** s14: [0, 1] Tính ổn định công việc (thời gian trung bình làm việc tại mỗi công ty cũ / 5 năm) */
  jobStability: number;

  /** s15: [0, 1] Mức độ hoàn thiện thông tin liên hệ (đầy đủ email, số điện thoại, mạng xã hội) */
  contactCompletion: number;

  /** s16: [0, 1] Điểm ưu tiên khu vực địa lý (1.0: cùng tỉnh/thành, 0.5: lân cận, 0.0: xa) */
  locationMatch: number;

  // ==========================================================================
  // NHÓM 3: NGỮ CẢNH TUYỂN DỤNG & HẠN NGẠCH NGÂN SÁCH (8 CHIỀU: s17 -> s24)
  // ==========================================================================

  /** s17: [0, 1] Tỷ lệ suất phỏng vấn còn lại: k_remain / K */
  kRemainRatio: number;

  /** s18: [0, 1] Tỷ lệ hồ sơ chưa duyệt còn lại trong đợt tuyển: n_remain / N */
  nRemainRatio: number;

  /** s19: [0, 1] Tỷ lệ khan hiếm suất phỏng vấn: k_remain / (n_remain + 1) */
  scarcityRatio: number;

  /** s20: [0, 1] Điểm trung bình của các ứng viên đã được chọn (Accept) trước đó / 100 */
  avgAcceptedScore: number;

  /** s21: [0, 1] Điểm trung bình của các ứng viên đã bị từ chối (Reject) trước đó / 100 */
  avgRejectedScore: number;

  /** s22: [0, 1] Tỷ lệ chấp nhận hiện tại của đợt tuyển: số_đã_duyệt / (t + 1) */
  acceptanceRate: number;

  /** s23: [0, 1] Tiến trình duyệt danh sách hiện tại: t / N */
  progressRatio: number;

  /** s24: [0, 1] Cờ báo động áp lực thiếu chỉ tiêu: 1.0 nếu n_remain <= k_remain và k_remain > 0 */
  urgencyFlag: number;
}

/**
 * Dạng mảng số học 24 phần tử nạp trực tiếp vào mạng Deep Q-Network (Input Layer: 24 neurons)
 */
export type CandidateFeatureVector = number[];

/**
 * Kết quả trả về sau mỗi bước chuyển trạng thái (Gymnasium Step Result)
 */
export interface StepResult<S = number[]> {
  /** Vector trạng thái mới kế tiếp s_{t+1} (24 phần tử) */
  state: S;
  /** Giá trị phần thưởng/phạt tức thời r_t nhận được từ môi trường */
  reward: number;
  /** Cờ boolean báo hiệu episode đã kết thúc hay chưa (hết slot hoặc hết CV) */
  done: boolean;
  /** Thông tin bổ sung phục vụ ghi log, debug và vẽ biểu đồ đo đạc */
  info: Record<string, any>;
}

/**
 * Cấu trúc đại diện cho một hồ sơ ứng viên trong danh sách tuyển dụng
 */
export interface CandidatePoolItem {
  /** Định danh duy nhất của ứng viên (MongoDB ObjectId hoặc mã giả lập) */
  id?: string;
  /** Tên ứng viên */
  name?: string;
  /** Điểm tổng hợp năng lực ứng viên M(c, j) trong thang điểm [0, 100] */
  score: number;
  /** Vector đặc trưng nội tại của ứng viên (16 chiều nội tại hoặc 24 chiều đầy đủ) */
  features: number[];
  /** Dữ liệu gốc bổ sung (phục vụ kiểm tra) */
  rawInfo?: Record<string, any>;
}

/**
 * Cấu hình tham số cho Môi trường Sàng lọc hồ sơ (CandidateScreeningEnvConfig)
 */
export interface CandidateScreeningEnvConfig {
  /** Tổng số hồ sơ nộp về trong 1 đợt tuyển N (mặc định: 30 CV) */
  defaultPoolSize?: number;
  /** Hạn ngạch số suất phỏng vấn tối đa K (mặc định: 5 suất) */
  defaultBudgetK?: number;
  /** Ngưỡng điểm đạt chuẩn phỏng vấn theta (mặc định: 75 điểm) */
  minMatchThreshold?: number;
  /** Ngưỡng điểm nhân tài xuất sắc (mặc định: 85 điểm) */
  excellentMatchThreshold?: number;
  /** Điểm trung bình tối thiểu của top K ứng viên để nhận thưởng lớn cuối episode (mặc định: 80 điểm) */
  terminalBonusMinAvgScore?: number;
  /** Mức thưởng lớn khi chọn đủ K ứng viên chất lượng cao (mặc định: +5.0) */
  terminalBonus?: number;
  /** Mức phạt cho mỗi suất phỏng vấn bị thiếu hụt khi kết thúc đợt (mặc định: -1.0 / suất) */
  shortfallPenalty?: number;
  /** Mức phạt nhẹ chi phí trì hoãn cho hành động HOLD (mặc định: -0.2) */
  holdPenalty?: number;
  /** Phạt bước đi cố định nếu cần tối ưu tốc độ duyệt (mặc định: 0.0) */
  stepPenalty?: number;
  /** Mức phạt rất nặng nếu cố tình ACCEPT khi đã hết sạch hạn ngạch K (mặc định: -5.0) */
  overQuotaPenalty?: number;
  /** Có kết thúc sớm episode khi đã duyệt đủ K suất hay không (mặc định: true theo MDP.md) */
  terminateOnQuotaFilled?: boolean;
}

/**
 * Hàm tiện ích: Chuyển đổi đối tượng cấu trúc CandidateFeature thành mảng số 24 chiều
 * Dùng để nạp dữ liệu vào mạng Deep Q-Network.
 */
export function candidateFeatureToVector(feat: CandidateFeature): number[] {
  return [
    feat.semanticSimilarity,
    feat.techStackMatch,
    feat.experienceMatch,
    feat.educationLevel,
    feat.projectScore,
    feat.bonusSkills,
    feat.workExperienceYears,
    feat.completedProjects,
    feat.gpa,
    feat.githubStars,
    feat.pinnedRepos,
    feat.verificationStatus,
    feat.redFlags,
    feat.jobStability,
    feat.contactCompletion,
    feat.locationMatch,
    feat.kRemainRatio,
    feat.nRemainRatio,
    feat.scarcityRatio,
    feat.avgAcceptedScore,
    feat.avgRejectedScore,
    feat.acceptanceRate,
    feat.progressRatio,
    feat.urgencyFlag,
  ];
}

/**
 * Hàm tiện ích: Đọc ngược từ mảng số 24 chiều thành đối tượng có tên trường rõ ràng
 * Giúp debug, ghi log và theo dõi trực quan giá trị từng thuộc tính.
 */
export function vectorToCandidateFeature(vec: number[]): CandidateFeature {
  return {
    semanticSimilarity: vec[0] ?? 0,
    techStackMatch: vec[1] ?? 0,
    experienceMatch: vec[2] ?? 0,
    educationLevel: vec[3] ?? 0,
    projectScore: vec[4] ?? 0,
    bonusSkills: vec[5] ?? 0,
    workExperienceYears: vec[6] ?? 0,
    completedProjects: vec[7] ?? 0,
    gpa: vec[8] ?? 0,
    githubStars: vec[9] ?? 0,
    pinnedRepos: vec[10] ?? 0,
    verificationStatus: vec[11] ?? 0,
    redFlags: vec[12] ?? 0,
    jobStability: vec[13] ?? 0,
    contactCompletion: vec[14] ?? 0,
    locationMatch: vec[15] ?? 0,
    kRemainRatio: vec[16] ?? 0,
    nRemainRatio: vec[17] ?? 0,
    scarcityRatio: vec[18] ?? 0,
    avgAcceptedScore: vec[19] ?? 0,
    avgRejectedScore: vec[20] ?? 0,
    acceptanceRate: vec[21] ?? 0,
    progressRatio: vec[22] ?? 0,
    urgencyFlag: vec[23] ?? 0,
  };
}
