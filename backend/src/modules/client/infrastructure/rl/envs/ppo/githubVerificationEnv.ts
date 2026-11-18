/**
 * ============================================================================
 * ĐỒ ÁN HỌC TĂNG CƯỜNG (REINFORCEMENT LEARNING - HK7)
 * Đề tài: Nanobrowser HR Agent (Trợ Lý Tuyển Dụng Thông Minh)
 * 
 * FILE: githubVerificationEnv.ts
 * MỤC ĐÍCH: Môi trường mô phỏng chuẩn Gymnasium (Gym-style) bằng TypeScript
 *           phục vụ huấn luyện mô hình PPO / Q-Learning (Thuật toán 2).
 * BÀI TOÁN: Điều hướng tối ưu hóa quy trình kiểm chứng hồ sơ GitHub
 *           (Optimal Navigation Policy for GitHub Candidate Verification).
 * VỊ TRÍ ỨNG DỤNG: Tích hợp vào Chrome Extension Nanobrowser (Background Service Worker)
 * TÀI LIỆU THAM CHIẾU: MDP.md (Phần 3: Thiết kế MDP chi tiết cho Thuật toán 2)
 * ============================================================================
 */

import {
  GitHubAction,
  GitHubStateObject,
  MockGitHubProfile,
  MockGitHubRepo,
  ProfileArchetype,
  GitHubVerificationEnvConfig,
  GitHubStepResult,
} from './types';

// Xuất lại các kiểu dữ liệu để các module khác dễ dàng import
export { GitHubAction } from './types';
export type {
  GitHubStateObject,
  MockGitHubProfile,
  MockGitHubRepo,
  ProfileArchetype,
  GitHubVerificationEnvConfig,
  GitHubStepResult,
};

/**
 * Các tham số mặc định của Môi trường Kiểm chứng GitHub theo MDP.md Phần 3
 */
const DEFAULT_CONFIG: Required<GitHubVerificationEnvConfig> = {
  maxSteps: 10,                 // T_max = 10: Số bước tối đa cho một lượt kiểm chứng
  stepPenalty: -0.5,            // Phạt -0.5 mỗi bước để ép Agent tìm lộ trình ngắn nhất
  extractPinnedReward: 5.0,     // Thưởng +5.0 khi cào thành công Pinned Repos và Stars
  readBioReward: 3.0,           // Thưởng +3.0 khi đọc được trường học và bio
  switchTabReward: 2.0,         // Thưởng +2.0 khi chuyển tab Repositories hợp lý
  abort404Reward: 5.0,          // Thưởng +5.0 khi phát hiện link lỗi 404 và dừng duyệt kịp thời
  finishSubmitReward: 10.0,     // Thưởng lớn +10.0 khi hoàn tất nộp đủ bằng chứng
  prematureSubmitPenalty: -5.0, // Phạt -5.0 nếu bấm nộp quá vội khi chưa cào đủ thông tin
  redundantActionPenalty: -2.0, // Phạt -2.0 khi thao tác lặp lại hoặc sai ngữ cảnh trang
  stochastic: false,            // Mặc định chạy xác định (deterministic) để train ổn định
};

/**
 * Dữ liệu mẫu phục vụ tạo hồ sơ GitHub ngẫu nhiên
 */
const SAMPLE_USERNAMES = [
  'ducnguyen-dev', 'hungpham-ai', 'duongle-swe', 'haiduong-hub',
  'vietnam-coder', 'cloud-architect', 'fullstack-vn', 'ai-researcher'
];

const SAMPLE_FULL_NAMES = [
  'Nguyễn Minh Đức', 'Phạm Văn Hưng', 'Lê Quý Dương', 'Trương Tuần Hải',
  'Phùng Văn Duy', 'Trần Thị Mai', 'Hoàng Minh Tú', 'Vũ Đức Thắng'
];

const SAMPLE_SCHOOLS = [
  'Đại học Bách Khoa Hà Nội (HUST)',
  'Đại học Công Nghệ - ĐHQGHN (UET)',
  'Học viện Công nghệ Bưu chính Viễn thông (PTIT)',
  'Đại học FPT',
  'Đại học Bách Khoa TP.HCM (HCMUT)'
];

const SAMPLE_BIOS = [
  'Full-stack Engineer | TypeScript, Node.js, Python | Open Source Enthusiast',
  'Sinh viên Kỹ thuật Phần mềm ĐH Bách Khoa | Đam mê AI & Deep Learning',
  'Backend Developer chuyên về Microservices, High Concurrency & Cloud Architecture',
  'Kỹ sư AI/ML | TensorFlow, PyTorch, Reinforcement Learning',
  'Software Engineer xây dựng ứng dụng web hiện đại và scalable'
];

/**
 * Lớp GitHubVerificationEnv: Môi trường mô phỏng quy trình kiểm chứng GitHub
 * Cung cấp vòng lặp Gym-style (reset, step) giúp Agent PPO/Q-Learning học cách
 * duyệt web tối ưu với số lượt click ít nhất.
 */
export class GitHubVerificationEnv {
  public readonly config: Required<GitHubVerificationEnvConfig>;

  // Không gian hành động và quan sát chuẩn Gymnasium
  public readonly action_space = { n: 5 };              // 5 hành động: 0 đến 4
  public readonly observation_space = { shape: [12] };  // Vector trạng thái 12 chiều

  // Biến trạng thái nội tại của một Episode kiểm chứng
  private currentStep: number = 0;
  private done: boolean = false;
  private currentPage: 'profile' | 'repos' | '404' = 'profile';
  private profile!: MockGitHubProfile;

  // Cờ theo dõi tiến trình thông tin đã cào được (5 cờ nhị phân)
  private progress = {
    has_name: 0.0,
    has_stars: 0.0,
    has_pinned_projects: 0.0,
    has_school: 0.0,
    has_languages: 0.0,
  };

  // Số lượng dự án đã ghi nhận
  private projectsRecorded: number = 0;

  // Tổng phần thưởng tích lũy trong lượt kiểm chứng này
  private episodeReward: number = 0;

  /**
   * Hàm khởi tạo môi trường
   * @param customConfig Cấu hình tham số tùy chọn ghi đè cấu hình mặc định
   */
  constructor(customConfig?: GitHubVerificationEnvConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...customConfig,
    };
  }

  /**
   * PHƯƠNG THỨC RESET (Khởi tạo phiên kiểm chứng mới):
   * Áp dụng kỹ thuật Ngẫu nhiên hóa miền (Domain Randomization) để tạo ra các dạng hồ sơ khác nhau:
   * - standard_pinned: Hồ sơ chuẩn có Pinned Repos và Bio
   * - no_pinned: Không có Pinned repos, bắt buộc phải biết chuyển sang tab Repositories
   * - rich_bio_readme: Có README và Bio phong phú
   * - error_404: Link tài khoản bị hỏng hoặc 404
   * 
   * @param archetype Phân loại hồ sơ cụ thể (nếu muốn chỉ định trước)
   * @param customProfile Đối tượng hồ sơ tùy chỉnh (nếu muốn nạp dữ liệu thật)
   * @returns Vector trạng thái 12 chiều ban đầu s_0
   */
  public reset(
    archetype?: ProfileArchetype,
    customProfile?: Partial<MockGitHubProfile>
  ): number[] {
    this.currentStep = 0;
    this.done = false;
    this.projectsRecorded = 0;
    this.episodeReward = 0;

    // Thiết lập cờ tiến trình ban đầu (chưa cào được trường nào)
    this.progress = {
      has_name: 0.0,
      has_stars: 0.0,
      has_pinned_projects: 0.0,
      has_school: 0.0,
      has_languages: 0.0,
    };

    // Chọn ngẫu nhiên phân loại hồ sơ nếu không chỉ định
    const selectedArchetype: ProfileArchetype =
      archetype ?? this.randomArchetype();

    // Sinh hồ sơ GitHub mô phỏng theo phân loại đã chọn
    this.profile = this.createMockProfile(selectedArchetype, customProfile);

    // Xác định trang xuất phát
    if (this.profile.is404) {
      this.currentPage = '404';
    } else {
      this.currentPage = 'profile';
      // Ở trang cá nhân hợp lệ, họ tên hiển thị được tự động nhận diện
      this.progress.has_name = 1.0;
    }

    return this.getState();
  }

  /**
   * PHƯƠNG THỨC STEP (HÀM CHUYỂN TRẠNG THÁI VÀ TÍNH PHẦN THƯỞNG):
   * Tiếp nhận hành động điều hướng của Agent, thực hiện:
   * 1. Trừ chi phí bước đi cố định r_step = -0.5.
   * 2. Xử lý hành động tương ứng:
   *    - EXTRACT_PINNED (0): Cào Pinned repos + Stars (+5.0).
   *    - SWITCH_TAB_REPOS (1): Chuyển tab sang Repositories (+2.0).
   *    - READ_BIO_README (2): Đọc trường học và bio (+3.0).
   *    - ABORT_ON_404 (3): Nếu ở trang 404, thưởng +5.0 và kết thúc sớm.
   *    - FINISH_AND_SUBMIT (4): Nộp đủ thông tin thưởng +10.0, nộp non phạt -5.0.
   * 3. Phạt nếu thực hiện thao tác thừa, lặp lại hoặc sai ngữ cảnh.
   * 4. Tăng bước duyệt t, kiểm tra điều kiện kết thúc (done).
   * 
   * @param action Hành động điều hướng (từ 0 đến 4)
   * @returns Đối tượng GitHubStepResult chứa { state, reward, done, info }
   */
  public step(action: GitHubAction | number): GitHubStepResult {
    if (this.done) {
      return {
        state: this.getState(),
        reward: 0,
        done: true,
        info: { warning: 'Lượt kiểm chứng đã kết thúc. Hãy gọi reset() để bắt đầu lại.' },
      };
    }

    this.currentStep += 1;
    let stepReward = this.config.stepPenalty; // Áp dụng chi phí bước đi: -0.5
    const info: Record<string, any> = {
      step: this.currentStep,
      action,
      actionName: GitHubAction[action] ?? 'KHÔNG_XÁC_ĐỊNH',
      actionStatus: 'THÀNH_CÔNG',
    };

    // ========================================================================
    // XỬ LÝ TRƯỜNG HỢP TRANG BÁO LỖI 404
    // ========================================================================
    if (this.profile.is404) {
      if (action === GitHubAction.ABORT_ON_404) {
        // Agent phát hiện lỗi 404 và dừng duyệt kịp thời: Thưởng lớn +5.0 và kết thúc
        stepReward += this.config.abort404Reward;
        this.done = true;
        info.actionStatus = 'DỪNG_404_THÀNH_CÔNG';
        info.message = 'Agent nhận biết link lỗi 404 và dừng duyệt sớm kịp thời, tiết kiệm tài nguyên.';
      } else {
        // Đang ở trang 404 mà vẫn cố bấm các nút khác: Phạt nặng -4.0
        stepReward += -4.0;
        info.actionStatus = 'THAO_TÁC_SAI_TRÊN_404';
        info.message = 'Trang bị lỗi 404, hành động này không hợp lệ!';
      }

      // Kiểm tra kết thúc nếu đã chạm số bước tối đa T_max
      if (this.currentStep >= this.config.maxSteps && !this.done) {
        this.done = true;
        info.truncated = true;
        info.message = 'Hết thời gian duyệt tối đa (T_max = 10 bước).';
      }

      this.episodeReward += stepReward;
      return {
        state: this.getState(),
        reward: Math.round(stepReward * 100) / 100,
        done: this.done,
        info,
      };
    }

    // ========================================================================
    // XỬ LÝ 5 HÀNH ĐỘNG TRÊN TRANG GITHUB HỢP LỆ
    // ========================================================================
    switch (action) {
      // ----------------------------------------------------------------------
      // HÀNH ĐỘNG 0: EXTRACT_PINNED (Cào khối Pinned Repositories)
      // ----------------------------------------------------------------------
      case GitHubAction.EXTRACT_PINNED: {
        if (this.currentPage !== 'profile') {
          // Phạt nếu bấm cào pinned khi đang ở tab repositories
          stepReward += this.config.redundantActionPenalty;
          info.actionStatus = 'SAI_NGỮ_CẢNH_KHÔNG_Ở_TRANG_CHỦ';
        } else if (!this.profile.hasPinnedSection) {
          // Phạt -2.0 nếu trang không có khối Pinned mà vẫn bấm
          stepReward += -2.0;
          info.actionStatus = 'TRANG_KHÔNG_CÓ_PINNED_SECTION';
        } else if (this.progress.has_pinned_projects === 1.0) {
          // Phạt -3.0 nếu bấm lại thao tác đã làm rồi
          stepReward += -3.0;
          info.actionStatus = 'LẶP_LẠI_ĐÃ_CÀO_PINNED_RỒI';
        } else {
          // Cào thành công Pinned Repositories và Stars: Thưởng +5.0
          this.progress.has_pinned_projects = 1.0;
          this.progress.has_stars = 1.0;
          this.progress.has_languages = 1.0;
          this.projectsRecorded += this.profile.pinnedRepos.length;
          stepReward += this.config.extractPinnedReward;
          info.actionStatus = 'CÀO_PINNED_THÀNH_CÔNG';
          info.reposExtracted = this.profile.pinnedRepos;
        }
        break;
      }

      // ----------------------------------------------------------------------
      // HÀNH ĐỘNG 1: SWITCH_TAB_REPOS (Chuyển sang tab Repositories)
      // ----------------------------------------------------------------------
      case GitHubAction.SWITCH_TAB_REPOS: {
        if (this.currentPage === 'repos') {
          // Phạt nếu đã ở tab repos rồi mà vẫn bấm chuyển tiếp
          stepReward += this.config.redundantActionPenalty;
          info.actionStatus = 'ĐÃ_Ở_TAB_REPOSITORIES';
        } else {
          this.currentPage = 'repos';

          // Nếu trang chủ không có Pinned, việc chuyển tab Repos là cực kỳ chuẩn xác: Thưởng +2.0
          if (!this.profile.hasPinnedSection) {
            stepReward += this.config.switchTabReward;
            info.actionStatus = 'CHUYỂN_TAB_HỢP_LÝ_DO_KHÔNG_CÓ_PINNED';
          } else {
            // Có pinned rồi mà vẫn qua tab Repos để tìm thêm dự án
            stepReward += 1.0;
            info.actionStatus = 'CHUYỂN_TAB_TÌM_THÊM_DỰ_ÁN';
          }

          // Tự động quét các repo nổi bật tại tab Repositories nếu chưa cào
          if (this.progress.has_pinned_projects === 0.0) {
            this.progress.has_pinned_projects = 1.0;
            this.progress.has_stars = 1.0;
            this.progress.has_languages = 1.0;
            this.projectsRecorded += this.profile.tabRepos.length;
            stepReward += 3.0; // Thưởng bổ sung vì đã lấy được thông tin repo
          }
        }
        break;
      }

      // ----------------------------------------------------------------------
      // HÀNH ĐỘNG 2: READ_BIO_README (Đọc Bio và README cá nhân)
      // ----------------------------------------------------------------------
      case GitHubAction.READ_BIO_README: {
        if (this.progress.has_school === 1.0) {
          // Phạt nếu đã đọc bio rồi mà đọc lại
          stepReward += this.config.redundantActionPenalty;
          info.actionStatus = 'ĐÃ_ĐỌC_BIO_RỒI';
        } else {
          this.progress.has_school = 1.0;
          stepReward += this.config.readBioReward; // Thưởng +3.0
          info.actionStatus = 'ĐỌC_BIO_THÀNH_CÔNG';
          info.school = this.profile.school;
          info.bio = this.profile.bio;
        }
        break;
      }

      // ----------------------------------------------------------------------
      // HÀNH ĐỘNG 3: ABORT_ON_404 (Bấm dừng 404 khi trang KHÔNG bị lỗi)
      // ----------------------------------------------------------------------
      case GitHubAction.ABORT_ON_404: {
        // Phạt nặng -4.0 vì nhầm lẫn trang web bình thường thành lỗi 404
        stepReward += -4.0;
        this.done = true;
        info.actionStatus = 'DỪNG_NHẦM_TRANG_BÌNH_THƯỜNG';
        info.message = 'Trang web ứng viên hoàn toàn hợp lệ nhưng Agent lại bỏ cuộc!';
        break;
      }

      // ----------------------------------------------------------------------
      // HÀNH ĐỘNG 4: FINISH_AND_SUBMIT (Hoàn tất và gửi dữ liệu về Backend)
      // ----------------------------------------------------------------------
      case GitHubAction.FINISH_AND_SUBMIT: {
        this.done = true;
        // Đếm số lượng trường thông tin cốt lõi đã thu thập được
        const collectedFields =
          this.progress.has_name +
          this.progress.has_stars +
          this.progress.has_pinned_projects +
          this.progress.has_school +
          this.progress.has_languages;

        if (collectedFields >= 4) {
          // Thu thập đủ bằng chứng xác thực quan trọng: Thưởng lớn +10.0
          stepReward += this.config.finishSubmitReward;
          info.actionStatus = 'HOÀN_TẤT_XÁC_THỰC_THÀNH_CÔNG';
          info.collectedFields = collectedFields;
        } else {
          // Bấm nộp non khi chưa cào đủ thông tin: Phạt -5.0
          stepReward += this.config.prematureSubmitPenalty;
          info.actionStatus = 'NỘP_NON_CHƯA_ĐỦ_THÔNG_TIN';
          info.collectedFields = collectedFields;
        }
        break;
      }

      default: {
        stepReward += -1.0;
        info.actionStatus = 'CHỈ_SỐ_HÀNH_ĐỘNG_KHÔNG_HỢP_LỆ';
        break;
      }
    }

    // Kết thúc episode nếu vượt quá số bước tối đa T_max
    if (this.currentStep >= this.config.maxSteps && !this.done) {
      this.done = true;
      info.truncated = true;
      info.message = 'Hết thời gian duyệt tối đa (T_max = 10 bước).';
    }

    this.episodeReward += stepReward;

    return {
      state: this.getState(),
      reward: Math.round(stepReward * 100) / 100,
      done: this.done,
      info,
    };
  }

  /**
   * XÂY DỰNG VECTOR QUAN SÁT 12 CHIỀU (STATE VECTOR s_t in R^12):
   * Theo đúng đặc tả toán học trong MDP.md Phần 3:
   * - s1 -> s5: Nhận diện trang (profile, repos, 404, has_pinned, has_readme)
   * - s6 -> s10: Tiến trình cào (has_name, has_stars, has_pinned, has_school, has_languages)
   * - s11: Tỷ lệ số bước đã duyệt (step / maxSteps)
   * - s12: Tỷ lệ hoàn thành dữ liệu (các trường đã cào / 5)
   */
  public getState(): number[] {
    const isProfile = this.currentPage === 'profile' && !this.profile.is404 ? 1.0 : 0.0;
    const isReposTab = this.currentPage === 'repos' && !this.profile.is404 ? 1.0 : 0.0;
    const is404 = this.profile.is404 ? 1.0 : 0.0;
    const hasPinned = this.currentPage === 'profile' && this.profile.hasPinnedSection ? 1.0 : 0.0;
    const hasReadme = this.currentPage === 'profile' && this.profile.hasReadmeSection ? 1.0 : 0.0;

    const stepRatio = Math.min(1.0, this.currentStep / this.config.maxSteps);

    // Tỷ lệ các trường đã cào được trên tổng số 5 trường thông tin
    const completionRatio =
      (this.progress.has_name +
        this.progress.has_stars +
        this.progress.has_pinned_projects +
        this.progress.has_school +
        this.progress.has_languages) /
      5.0;

    return [
      isProfile,                          // s1
      isReposTab,                         // s2
      is404,                              // s3
      hasPinned,                          // s4
      hasReadme,                          // s5
      this.progress.has_name,             // s6
      this.progress.has_stars,            // s7
      this.progress.has_pinned_projects,  // s8
      this.progress.has_school,           // s9
      this.progress.has_languages,        // s10
      stepRatio,                          // s11
      completionRatio,                    // s12
    ];
  }

  /**
   * Trả về đối tượng trạng thái có tên trường rõ ràng hỗ trợ debug và ghi log
   */
  public getStateObject(): GitHubStateObject {
    const s = this.getState();
    return {
      is_profile_page: s[0] ?? 0,
      is_repositories_tab: s[1] ?? 0,
      is_404_error_page: s[2] ?? 0,
      has_pinned_section: s[3] ?? 0,
      has_readme_section: s[4] ?? 0,
      has_extracted_name: s[5] ?? 0,
      has_extracted_stars: s[6] ?? 0,
      has_extracted_pinned_repos: s[7] ?? 0,
      has_extracted_school_age: s[8] ?? 0,
      has_extracted_top_languages: s[9] ?? 0,
      step_ratio: s[10] ?? 0,
      completion_ratio: s[11] ?? 0,
    };
  }

  /**
   * MẶT NẠ HÀNH ĐỘNG (ACTION MASK):
   * Trả về mảng 5 giá trị boolean cho biết những hành động nào là hợp lệ tại trạng thái hiện tại.
   * Rất hữu ích khi huấn luyện PPO để chặn bớt các hành động vô lý, giúp Agent hội tụ nhanh gấp 5 lần.
   */
  public getActionMask(): boolean[] {
    if (this.profile.is404) {
      // Khi gặp trang lỗi 404, hành động hợp lệ duy nhất là dừng lại (ABORT_ON_404)
      return [false, false, false, true, false];
    }

    const canExtractPinned =
      this.currentPage === 'profile' &&
      this.profile.hasPinnedSection &&
      this.progress.has_pinned_projects === 0.0;

    const canSwitchTab = this.currentPage !== 'repos';

    const canReadBio = this.progress.has_school === 0.0;

    const canAbort404 = false; // Không nên bấm abort khi trang bình thường

    const canFinish =
      this.progress.has_pinned_projects === 1.0 &&
      this.progress.has_stars === 1.0;

    return [canExtractPinned, canSwitchTab, canReadBio, canAbort404, canFinish];
  }

  // ==========================================================================
  // HÀM TẠO DỮ LIỆU GIẢ LẬP HỒ SƠ GITHUB (DOMAIN RANDOMIZATION)
  // ==========================================================================

  private randomArchetype(): ProfileArchetype {
    const roll = Math.random();
    if (roll < 0.40) return 'standard_pinned';   // 40% Hồ sơ chuẩn
    if (roll < 0.65) return 'no_pinned';         // 25% Không ghim dự án
    if (roll < 0.85) return 'rich_bio_readme';   // 20% Bio và README chi tiết
    return 'error_404';                          // 15% Link lỗi 404
  }

  private createMockProfile(
    archetype: ProfileArchetype,
    overrides?: Partial<MockGitHubProfile>
  ): MockGitHubProfile {
    const idx = Math.floor(Math.random() * SAMPLE_USERNAMES.length);
    const username = SAMPLE_USERNAMES[idx]!;
    const fullName = SAMPLE_FULL_NAMES[idx]!;
    const school = SAMPLE_SCHOOLS[idx % SAMPLE_SCHOOLS.length]!;
    const bio = SAMPLE_BIOS[idx % SAMPLE_BIOS.length]!;

    if (archetype === 'error_404') {
      return {
        username: `nonexistent-user-${Math.floor(Math.random() * 1000)}`,
        fullName: '',
        school: '',
        bio: '',
        is404: true,
        hasPinnedSection: false,
        hasReadmeSection: false,
        pinnedRepos: [],
        tabRepos: [],
        totalStars: 0,
        topLanguages: [],
        archetype: 'error_404',
        ...overrides,
      };
    }

    const sampleRepos: MockGitHubRepo[] = [
      { name: 'nestjs-microservices-clean-arch', stars: 120, language: 'TypeScript', description: 'Clean architecture in NestJS' },
      { name: 'reinforcement-learning-agent', stars: 85, language: 'Python', description: 'DQN and PPO implementations' },
      { name: 'high-performance-crawler', stars: 45, language: 'Go', description: 'Concurrent web scraper' },
      { name: 'react-tailwind-dashboard', stars: 30, language: 'TypeScript', description: 'Modern admin dashboard' },
    ];

    const hasPinned = archetype !== 'no_pinned';
    const hasReadme = archetype === 'rich_bio_readme' || Math.random() > 0.4;

    return {
      username,
      fullName,
      school,
      bio,
      is404: false,
      hasPinnedSection: hasPinned,
      hasReadmeSection: hasReadme,
      pinnedRepos: hasPinned ? sampleRepos.slice(0, 2) : [],
      tabRepos: sampleRepos,
      totalStars: 280,
      topLanguages: ['TypeScript', 'Python', 'Go'],
      archetype,
      ...overrides,
    };
  }

  // ==========================================================================
  // CÁC HÀM TRỢ GIÚP VÀ TRUY VẤN (GETTERS)
  // ==========================================================================

  /** Lấy thông tin hồ sơ GitHub giả lập hiện tại */
  public getProfile(): MockGitHubProfile {
    return { ...this.profile };
  }

  /** Lấy bước duyệt hiện tại */
  public getCurrentStep(): number {
    return this.currentStep;
  }

  /** Lấy tên trang web hiện tại ('profile' | 'repos' | '404') */
  public getCurrentPage(): string {
    return this.currentPage;
  }

  /** Lấy tổng phần thưởng tích lũy trong lượt kiểm chứng */
  public getEpisodeReward(): number {
    return this.episodeReward;
  }

  /** Kiểm tra xem lượt kiểm chứng đã kết thúc chưa */
  public isDone(): boolean {
    return this.done;
  }
}
