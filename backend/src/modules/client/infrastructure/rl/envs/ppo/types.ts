/**
 * ============================================================================
 * ĐỒ ÁN HỌC TĂNG CƯỜNG (REINFORCEMENT LEARNING - HK7)
 * Đề tài: Nanobrowser HR Agent (Trợ Lý Tuyển Dụng Thông Minh)
 * 
 * FILE: githubTypes.ts
 * MỤC ĐÍCH: Định nghĩa các kiểu dữ liệu, enum và interface cho Thuật toán 2
 *           (PPO / Q-Learning - Điều hướng kiểm chứng hồ sơ GitHub Nanobrowser).
 * TÀI LIỆU THAM CHIẾU: MDP.md (Phần 3: Thiết kế MDP chi tiết cho Thuật toán 2)
 * ============================================================================
 */

/**
 * Không gian hành động của Agent điều hướng kiểm chứng GitHub (Discrete Action Space: 5 hành động)
 * - EXTRACT_PINNED (0): Quét và bóc tách dữ liệu từ khối Pinned Repositories (tên repo, stars, ngôn ngữ).
 * - SWITCH_TAB_REPOS (1): Chuyển sang tab Repositories khi trang chủ không ghim dự án.
 * - READ_BIO_README (2): Đọc khối Bio bên trái hoặc file README cá nhân để trích xuất trường học/tuổi/bio.
 * - ABORT_ON_404 (3): Nhận biết trang lỗi 404 và ra lệnh dừng duyệt ngay lập tức.
 * - FINISH_AND_SUBMIT (4): Đóng gói dữ liệu kiểm chứng và gửi API xác thực về Backend.
 */
export enum GitHubAction {
  EXTRACT_PINNED = 0,    // 0: Cào khối Pinned Repositories
  SWITCH_TAB_REPOS = 1,  // 1: Chuyển tab sang danh sách Repositories
  READ_BIO_README = 2,   // 2: Đọc thông tin Bio và README cá nhân
  ABORT_ON_404 = 3,      // 3: Dừng duyệt sớm khi gặp link lỗi 404
  FINISH_AND_SUBMIT = 4, // 4: Hoàn tất kiểm chứng và gửi dữ liệu
}

/**
 * Các phân loại hồ sơ mẫu phục vụ Ngẫu nhiên hóa môi trường (Domain Randomization)
 * - 'standard_pinned': Hồ sơ đầy đủ thông tin chuẩn (có Pinned Repositories, Bio)
 * - 'no_pinned': Không ghim repo ở trang chủ, bắt buộc Agent phải biết chuyển tab Repos
 * - 'rich_bio_readme': Có README cá nhân dài và bio chi tiết (chứa thông tin trường đại học)
 * - 'error_404': Link GitHub bị sai hoặc tài khoản bị xóa (trang 404 Not Found)
 */
export type ProfileArchetype =
  | 'standard_pinned'
  | 'no_pinned'
  | 'rich_bio_readme'
  | 'error_404';

/**
 * Cấu trúc đối tượng biểu diễn trạng thái quan sát 12 chiều của Agent điều hướng (State s_t in R^12)
 * Theo đặc tả toán học trong MDP.md Phần 3:
 * - 5 chiều nhận diện loại trang web hiện tại
 * - 5 chiều theo dõi tiến trình thông tin đã cào được
 * - 2 chiều đo lường chi phí bước đi và tỷ lệ hoàn thành
 */
export interface GitHubStateObject {
  // === 5 CHIỀU NHẬN DIỆN TRANG WEB HIỆN TẠI ===
  /** s1: [0, 1] Đang ở trang chủ cá nhân (https://github.com/username) */
  is_profile_page: number;

  /** s2: [0, 1] Đang ở tab kho mã nguồn (?tab=repositories) */
  is_repositories_tab: number;

  /** s3: [0, 1] Đang ở trang báo lỗi 404 Not Found */
  is_404_error_page: number;

  /** s4: [0, 1] Trang web hiện tại có khối Pinned Repositories hay không */
  has_pinned_section: number;

  /** s5: [0, 1] Trang web hiện tại có khối README cá nhân hay không */
  has_readme_section: number;

  // === 5 CHIỀU TIẾN TRÌNH TRÍCH XUẤT THÔNG TIN ===
  /** s6: [0, 1] Đã trích xuất được họ tên hiển thị hay chưa */
  has_extracted_name: number;

  /** s7: [0, 1] Đã tính được tổng số sao GitHub (stars) hay chưa */
  has_extracted_stars: number;

  /** s8: [0, 1] Đã cào được danh sách các dự án tiêu biểu (pinned/top repos) chưa */
  has_extracted_pinned_repos: number;

  /** s9: [0, 1] Đã trích xuất được thông tin trường học/học vấn/tuổi chưa */
  has_extracted_school_age: number;

  /** s10: [0, 1] Đã xác định được danh sách ngôn ngữ lập trình chủ đạo chưa */
  has_extracted_top_languages: number;

  // === 2 CHIỀU CHI PHÍ VÀ TIẾN ĐỘ BƯỚC DUYỆT ===
  /** s11: [0, 1] Tỷ lệ số bước click đã thực hiện: t / T_max (với T_max = 10) */
  step_ratio: number;

  /** s12: [0, 1] Tỷ lệ hoàn thành dữ liệu kiểm chứng: số_trường_đã_cào / 5 */
  completion_ratio: number;
}

/**
 * Thông tin chi tiết một dự án GitHub giả lập
 */
export interface MockGitHubRepo {
  name: string;
  stars: number;
  language: string;
  description: string;
}

/**
 * Cấu trúc đối tượng hồ sơ GitHub giả lập để Agent tương tác thử nghiệm
 */
export interface MockGitHubProfile {
  username: string;
  fullName: string;
  school: string;
  bio: string;
  is404: boolean;
  hasPinnedSection: boolean;
  hasReadmeSection: boolean;
  pinnedRepos: MockGitHubRepo[];
  tabRepos: MockGitHubRepo[];
  totalStars: number;
  topLanguages: string[];
  archetype: ProfileArchetype;
}

/**
 * Cấu hình tham số cho Môi trường Kiểm chứng GitHub (GitHubVerificationEnvConfig)
 */
export interface GitHubVerificationEnvConfig {
  /** Số bước tối đa cho phép trong một episode (mặc định: T_max = 10) */
  maxSteps?: number;
  /** Phạt chi phí bước đi để ép Agent tối ưu số lần click (mặc định: -0.5) */
  stepPenalty?: number;
  /** Thưởng khi cào thành công khối Pinned Repositories và Stars (mặc định: +5.0) */
  extractPinnedReward?: number;
  /** Thưởng khi đọc Bio / README trích xuất được trường học (mặc định: +3.0) */
  readBioReward?: number;
  /** Thưởng khi chuyển tab Repositories hợp lý (mặc định: +2.0) */
  switchTabReward?: number;
  /** Thưởng phát hiện lỗi 404 và dừng duyệt kịp thời (mặc định: +5.0) */
  abort404Reward?: number;
  /** Thưởng lớn khi hoàn tất kiểm chứng với đầy đủ bằng chứng (mặc định: +10.0) */
  finishSubmitReward?: number;
  /** Phạt khi bấm nộp vội vàng lúc chưa cào đủ thông tin (mặc định: -5.0) */
  prematureSubmitPenalty?: number;
  /** Phạt thao tác sai ngữ cảnh hoặc lặp lại thao tác thừa (mặc định: -2.0) */
  redundantActionPenalty?: number;
  /** Bật/tắt tính ngẫu nhiên nhẹ của mạng (mặc định: false) */
  stochastic?: boolean;
}

/**
 * Kết quả trả về sau mỗi bước hành động điều hướng
 */
export interface GitHubStepResult {
  /** Vector quan sát 12 chiều kế tiếp s_{t+1} */
  state: number[];
  /** Phần thưởng tức thời nhận được r_t */
  reward: number;
  /** Cờ boolean báo hiệu đợt kiểm chứng đã hoàn thành */
  done: boolean;
  /** Thông tin ghi log chi tiết */
  info: Record<string, any>;
}
