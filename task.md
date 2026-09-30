# BẢNG PHÂN CHIA NHIỆM VỤ CHI TIẾT ĐỒ ÁN HỌC TĂNG CƯỜNG (HK7)

* **Tên đề tài:** Nanobrowser HR Agent (Trợ Lý Tuyển Dụng Thông Minh)
* **Môn học:** Học Tăng Cường (Reinforcement Learning) - Học kỳ 7
* **Quy mô nhóm:** 5 thành viên

---

## DANH SÁCH THÀNH VIÊN NHÓM

1. **Nguyễn Minh Đức** (Thành viên 1)
2. **Phùng Văn Duy** (Thành viên 2)
3. **Phạm Văn Hưng** (Thành viên 3)
4. **Lê Quý Dương** (Thành viên 4)
5. **Trương Tuần Hải** (Thành viên 5)

---

## I. TỔNG QUAN HAI BÀI TOÁN HỌC TĂNG CƯỜNG TRONG ĐỒ ÁN

Hệ thống giải quyết 2 bài toán độc lập nhưng bổ trợ chặt chẽ cho nhau trong quy trình tuyển dụng nội bộ của HR:

1. **Thuật toán 1: Deep Q-Network (DQN) - Bài toán Sàng lọc & Khớp nối ứng viên (Candidate Screening & Matching)**
   - Vị trí: Tích hợp tại Backend Express / Dịch vụ AI microservice.
   - Mục tiêu: Tự động ra quyết định Duyệt (Accept), Loại (Reject), hoặc Tạm giữ (Hold) từng hồ sơ theo danh sách tuần tự nhằm tối đa hóa chất lượng ứng viên trong hạn ngạch phỏng vấn cho phép của HR.

2. **Thuật toán 2: PPO / Q-Learning - Bài toán Điều hướng tối ưu Kiểm chứng GitHub (GitHub Verification Policy)**
   - Vị trí: Tích hợp tại Chrome Extension Nanobrowser.
   - Mục tiêu: Điều khiển trình duyệt tự động thực hiện chuỗi hành động cào dữ liệu (Pinned Repos, Stars, School, nhận diện lỗi 404) với số lượt click chuột và thời gian ngắn nhất.

---

## II. BẢNG MA TRẬN TRÁCH NHIỆM TỔNG HỢP

| Thành viên | Trục chuyên môn chính | Trách nhiệm tại Thuật toán 1: DQN (Sàng lọc CV) | Trách nhiệm tại Thuật toán 2: PPO / Q-Learn (Kiểm chứng GitHub) | Sản phẩm bàn giao chính |
| :--- | :--- | :--- | :--- | :--- |
| **Nguyễn Minh Đức** | Toán học & Mô hình hóa MDP | Xây dựng MDP duyệt CV theo hạn ngạch, phương trình Bellman, Epsilon-greedy | Xây dựng MDP điều hướng GitHub, hàm phần thưởng đa mục tiêu, điều kiện dừng 404 | docs/math_formulation_dqn.md, docs/math_formulation_verification.md |
| **Phùng Văn Duy** | Xử lý Dữ liệu & Vector hóa | Trích xuất và chuẩn hóa vector 24 chiều từ MongoDB (Candidate + Job) | Phân tích DOM GitHub, xây dựng vector trạng thái duyệt web nhị phân 12 chiều | dqn_feature_pipeline.py, browser_state_extractor.py, sample_dataset.json |
| **Phạm Văn Hưng** | Lập trình Cốt lõi RL | Lập trình Q-Network, Target Network, Replay Buffer bằng PyTorch | Lập trình Agent học tăng cường (PPO Actor-Critic hoặc Q-Table) | dqn_agent.py, replay_buffer.py, ppo_agent.py |
| **Lê Quý Dương** | Môi trường Giả lập (Gymnasium) | Xây dựng môi trường CandidateScreeningEnv chuẩn Gymnasium | Xây dựng môi trường mô phỏng cấu trúc GitHub GitHubVerificationEnv | candidate_screening_env.py, github_mock_env.py, train scripts |
| **Trương Tuần Hải** | Tích hợp, Benchmark & Báo cáo | Huấn luyện DQN, đo đạc biểu đồ, dựng API FastAPI kết nối Backend Express | Tích hợp Policy vào Extension Nanobrowser, làm slide & báo cáo | main.py (FastAPI), rl_benchmarking.ipynb, slide báo cáo |

---

## III. BẢNG PHÂN CHIA NHIỆM VỤ CHI TIẾT TỪNG THÀNH VIÊN

---

### 1. THÀNH VIÊN 1: NGUYỄN MINH ĐỨC
* **Chuyên môn:** Kiến trúc sư Toán học & Mô hình hóa MDP
* **Vai trò chung:** Chịu trách nhiệm về tính chính xác học thuật và cơ sở lý thuyết toán học của đồ án; thiết kế không gian trạng thái, hành động, phần thưởng; phối hợp cùng các thành viên xây dựng mô hình lý thuyết.

#### Nhiệm vụ cụ thể tại Thuật toán 1: DQN (Sàng lọc hồ sơ)
1. Thiết kế bài toán Markov Decision Process (MDP) cho quy trình duyệt danh sách ứng viên tuần tự có ràng buộc hạn ngạch (Sequential Candidate Screening with Budget Constraint).
2. Định nghĩa toán học cho không gian Trạng thái (State Space S): Bao gồm thông tin hồ sơ ứng viên, yêu cầu công việc, tỷ lệ slot phỏng vấn còn lại (k_remain / K) và tỷ lệ ứng viên chưa duyệt (n_remain / N).
3. Định nghĩa không gian Hành động rời rạc (Action Space A): 3 hành động A = {0: REJECT, 1: ACCEPT, 2: HOLD}.
4. Thiết lập công thức hàm phần thưởng (Reward Function R(s, a)):
   - Thưởng khi chọn ứng viên có độ phù hợp cao: +2.0.
   - Phạt khi chọn ứng viên yếu: -1.5.
   - Phạt nặng khi loại bỏ ứng viên xuất sắc: -2.0.
   - Thưởng hoàn thành episode khi chọn đủ K ứng viên chất lượng: +5.0.
5. Xây dựng công thức hàm mất mát (Loss Function) theo sai số Bellman:
   L(theta) = E [ (r + gamma * max_a' Q(s', a'; theta^-) - Q(s, a; theta))^2 ]
6. Thiết kế chiến lược suy giảm khám phá Epsilon-greedy:
   eps_t = max(eps_min, eps_start * (delta)^t)

#### Nhiệm vụ cụ thể tại Thuật toán 2: PPO / Q-Learning (Kiểm chứng GitHub Nanobrowser)
1. Mô hình hóa quá trình điều hướng trang GitHub của ứng viên thành bài toán MDP:
   - State: Biểu diễn trạng thái trang hiện tại (Profile, Tab Repos, lỗi 404) và các trường thông tin đã cào được.
   - Action: A = {0: EXTRACT_PINNED, 1: SWITCH_TAB_REPOS, 2: READ_BIO, 3: ABORT_ON_404, 4: FINISH_AND_SUBMIT}.
2. Xây dựng hàm phần thưởng đa mục tiêu (Multi-objective Reward Function):
   - Thưởng khi cào thành công Pinned Repositories và Stars: +5.0.
   - Thưởng khi phát hiện link lỗi 404 và dừng duyệt kịp thời: +5.0.
   - Phạt chi phí bước đi (Step Penalty: -0.5) nhằm tối ưu hóa số lần click và thời gian duyệt.
   - Thưởng hoàn thành toàn bộ quy trình gửi dữ liệu: +10.0.
3. Thiết lập công thức mục tiêu PPO Clipped Surrogate:
   L_CLIP(theta) = E_t [ min(r_t(theta) * A_hat_t, clip(r_t(theta), 1 - eps, 1 + eps) * A_hat_t) ]

#### Sản phẩm bàn giao (Deliverables):
* `docs/math_formulation_dqn.md`: Tài liệu đặc tả toán học chi tiết cho Thuật toán 1.
* `docs/math_formulation_verification.md`: Tài liệu đặc tả toán học chi tiết cho Thuật toán 2.
* Kế hoạch phân công và biên bản họp nhóm hàng tuần.

#### Tiêu chí hoàn thành (Definition of Done):
* Tài liệu toán học đầy đủ công thức, chứng minh được bài toán thỏa mãn tính chất Markov, không gian trạng thái không bị bùng nổ chiều, không mâu thuẫn trong thiết kế Reward.

#### Câu hỏi vấn đáp giảng viên dự kiến:
* "Tại sao bài toán sàng lọc CV lại là một MDP tuần tự mà không phải là bài toán phân lớp hay Multi-Armed Bandit?"
* "Làm thế nào để đảm bảo hàm phần thưởng không khuyến khích Agent gian lận điểm (Reward Hacking)?"

---

### 2. THÀNH VIÊN 2: PHÙNG VĂN DUY
* **Chuyên môn:** Kỹ sư Dữ liệu & Xử lý Đặc trưng (Data & Feature Engineering)
* **Vai trò chung:** Chịu trách nhiệm thiết kế cấu trúc dữ liệu, trích xuất và chuẩn hóa toàn bộ dữ liệu từ MongoDB và cấu trúc DOM trang web thành các vector số học chuẩn mực để nạp vào mô hình RL.

#### Nhiệm vụ cụ thể tại Thuật toán 1: DQN (Sàng lọc hồ sơ)
1. Khảo sát cấu trúc schema cơ sở dữ liệu `Candidate` (`candidate.model.ts`) và `Job` (`job.model.ts`) trong hệ thống.
2. Xây dựng pipeline trích xuất vector đặc trưng 24 chiều:
   - Nhóm 1 (Tương đồng kỹ năng - 6 chiều): Điểm phù hợp Gemini (Matching score), số kỹ năng kỹ thuật trùng khớp, tỷ lệ độ bao phủ yêu cầu công việc.
   - Nhóm 2 (Hồ sơ năng lực - 10 chiều): Số năm kinh nghiệm làm việc, số lượng công ty từng làm, học vị cao nhất, điểm GPA, số sao GitHub tích lũy, số lượng dự án thực tế, cờ trạng thái kiểm chứng (Verified = 1, Unverified = 0, Risky = -1).
   - Nhóm 3 (Ngữ cảnh hạn ngạch - 8 chiều): Số suất phỏng vấn còn lại (k_remain), số hồ sơ còn lại trong đợt tuyển (n_remain), tỷ lệ lấp đầy hạn ngạch, điểm trung bình của các ứng viên đã được chọn trước đó.
3. Chuẩn hóa dữ liệu về đoạn [0, 1] bằng phương pháp Min-Max Scaling để mạng nơ-ron hội tụ ổn định.
4. Xây dựng bộ sinh dữ liệu tổng hợp (Data Synthesizer) tạo ra tập dữ liệu 500 CV giả lập cho các đợt huấn luyện thử nghiệm ban đầu.

#### Nhiệm vụ cụ thể tại Thuật toán 2: PPO / Q-Learning (Kiểm chứng GitHub Nanobrowser)
1. Phân tích cấu trúc HTML/DOM của các trang GitHub phổ biến:
   - Trang cá nhân tổng quan (`https://github.com/username`).
   - Trang danh sách kho mã nguồn (`https://github.com/username?tab=repositories`).
   - Trang báo lỗi 404 (`https://github.com/nonexistent_user`).
2. Viết hàm chuyển đổi trạng thái trình duyệt thành State Vector (12 chiều):
   - 5 chiều nhị phân nhận diện trang: `[is_profile, is_repos_tab, is_404, has_pinned, has_readme]`.
   - 5 chiều nhị phân tiến trình cào: `[has_name, has_stars, has_pinned_projects, has_school, has_bio]`.
   - 2 chiều đo lường: Số bước đã đi hiện tại (step / max_step), số lượng dự án đã ghi nhận.

#### Sản phẩm bàn giao (Deliverables):
* `rl_service/features/dqn_feature_pipeline.py`: Module trích xuất và chuẩn hóa vector 24 chiều từ MongoDB.
* `rl_service/features/browser_state_extractor.py`: Module phân tích HTML thành vector trạng thái 12 chiều.
* `data/synthesized_candidates.json`: Bộ dữ liệu mẫu 500 ứng viên phục vụ huấn luyện offline.

#### Tiêu chí hoàn thành (Definition of Done):
* Vector đầu ra không chứa giá trị NaN hoặc Null; thời gian trích xuất vector trên một hồ sơ đạt dưới 10 mili-giây.

#### Câu hỏi vấn đáp giảng viên dự kiến:
* "Cách nhóm xử lý những hồ sơ bị thiếu thông tin (như không có link GitHub, không ghi GPA) như thế nào?"
* "Tại sao cần đưa thông tin số suất phỏng vấn còn lại vào trong vector trạng thái của DQN?"

---

### 3. THÀNH VIÊN 3: PHẠM VĂN HƯNG
* **Chuyên môn:** Lập trình viên Cốt lõi Học Tăng Cường (Core RL Developer)
* **Vai trò chung:** Chịu trách nhiệm trực tiếp viết mã nguồn các mô hình học tăng cường bằng thư viện PyTorch; hiện thực các cơ chế lưu trữ bộ nhớ, tối ưu hóa đạo hàm và cập nhật mạng nơ-ron.

#### Nhiệm vụ cụ thể tại Thuật toán 1: DQN (Sàng lọc hồ sơ)
1. Lập trình kiến trúc mạng Deep Q-Network (`QNetwork`) bằng PyTorch:
   - Lớp đầu vào (Input layer): 24 nơ-ron.
   - Hai tầng ẩn (Hidden layers): 128 nơ-ron và 64 nơ-ron, sử dụng hàm kích hoạt ReLU.
   - Lớp đầu ra (Output layer): 3 nơ-ron (tương ứng với giá trị Q(s, a) cho 3 hành động REJECT, ACCEPT, HOLD).
2. Xây dựng mạng mục tiêu (`TargetNetwork`) song song để tránh mất ổn định khi ước lượng hàm mục tiêu; hiện thực cơ chế cập nhật trọng số định kỳ (Hard Update sau mỗi C bước hoặc Soft Update Polyak với tau = 0.005).
3. Lập trình cấu trúc dữ liệu Bộ nhớ đệm chuyển trạng thái (`ReplayBuffer`):
   - Lưu trữ các bộ tứ chuyển trạng thái (s_t, a_t, r_t, s_{t+1}, done_t).
   - Hỗ trợ lấy mẫu ngẫu nhiên đồng đều (Uniform Random Sampling) với kích thước batch cố định (Batch size = 64).
4. Hiện thực thuật toán huấn luyện một bước (`train_step`):
   - Tính toán giá trị Q hiện tại và Q mục tiêu theo phương trình Bellman.
   - Tính tổn thất Huber Loss hoặc MSE Loss, thực hiện lan truyền ngược (Backpropagation) và cắt tỉa gradient (Gradient Clipping) để tránh bùng nổ đạo hàm.

#### Nhiệm vụ cụ thể tại Thuật toán 2: PPO / Q-Learning (Kiểm chứng GitHub Nanobrowser)
1. Lập trình mạng Actor-Critic cho thuật toán PPO:
   - Mạng Actor: Nhận State 12 chiều, xuất ra phân phối xác suất trên 5 hành động (Softmax Categorical Distribution).
   - Mạng Critic: Nhận State 12 chiều, xuất ra ước lượng giá trị trạng thái V(s).
2. Hiện thực cơ chế ước lượng lợi thế tổng quát (Generalized Advantage Estimation - GAE) với tham số lambda = 0.95 và gamma = 0.99.
3. Cài đặt vòng lặp cập nhật trọng số PPO (PPO Update Loop) với hàm mục tiêu Clipped Objective, hàm tổn thất Value Loss và hệ số Entropy Bonus để khuyến khích khám phá.
4. (Phương án dự phòng): Hiện thực phiên bản Tabular Q-Learning hoặc DQN nhỏ nếu bài toán kiểm chứng yêu cầu gọn nhẹ để nhúng trực tiếp vào JavaScript của Extension.

#### Sản phẩm bàn giao (Deliverables):
* `rl_service/algorithms/dqn_agent.py`: Lớp `DQNAgent` hoàn chỉnh (select_action, store_transition, train_step, save_model, load_model).
* `rl_service/algorithms/replay_buffer.py`: Module quản lý bộ nhớ đệm Replay Buffer.
* `rl_service/algorithms/ppo_agent.py`: Lớp `PPOAgent` và mạng Actor-Critic.

#### Tiêu chí hoàn thành (Definition of Done):
* Mã nguồn có chú thích rõ ràng, chạy mượt mà trên CPU/GPU; hàm loss hội tụ ổn định qua quá trình huấn luyện, không xảy ra hiện tượng tràn bộ nhớ RAM/VRAM.

#### Câu hỏi vấn đáp giảng viên dự kiến:
* "Tác dụng cốt lõi của Target Network và Replay Buffer trong thuật toán DQN là gì?"
* "Tại sao PPO lại dùng cơ chế Clipped Surrogate Objective thay vì Policy Gradient thông thường?"

---

### 4. THÀNH VIÊN 4: LÊ QUÝ DƯƠNG
* **Chuyên môn:** Kỹ sư Môi trường Giả lập & Huấn luyện (Simulation Environment Engineer)
* **Vai trò chung:** Chịu trách nhiệm thiết kế và lập trình các môi trường mô phỏng chuẩn Gymnasium (OpenAI Gym), giúp các mô hình RL có thể tự học qua hàng ngàn kịch bản thử nghiệm trước khi triển khai vào môi trường thực tế.

#### Nhiệm vụ cụ thể tại Thuật toán 1: DQN (Sàng lọc hồ sơ)
1. Xây dựng môi trường giả lập tuyển dụng `CandidateScreeningEnv` kế thừa lớp `gymnasium.Env`:
   - Hàm `reset()`: Khởi tạo đợt tuyển dụng mới với 1 vị trí Job ngẫu nhiên, danh sách N hồ sơ ứng viên (ví dụ N = 30) và ngân sách phỏng vấn K suất (ví dụ K = 5).
   - Hàm `step(action)`: 
     - Nhận hành động của Agent cho ứng viên hiện tại.
     - Tính toán Reward tương ứng dựa trên quy tắc nghiệp vụ.
     - Cập nhật số suất phỏng vấn còn lại, chuyển con trỏ sang ứng viên tiếp theo.
     - Xác định điều kiện kết thúc episode (terminated khi duyệt hết danh sách hoặc hết slot, truncated khi vượt quá số bước tối đa).
   - Định nghĩa không gian quan sát (observation_space = Box(24,)) và không gian hành động (action_space = Discrete(3)).
2. Viết kịch bản kiểm tra tính hợp lệ của môi trường bằng công cụ `check_env` từ thư viện Gymnasium.

#### Nhiệm vụ cụ thể tại Thuật toán 2: PPO / Q-Learning (Kiểm chứng GitHub Nanobrowser)
1. Xây dựng môi trường mô phỏng cấu trúc GitHub `GitHubVerificationEnv` chuẩn Gymnasium:
   - Mô phỏng các dạng hồ sơ GitHub: Profile đầy đủ Pinned repos và Stars, profile không có Pinned repos, profile có bio trường học, profile bị lỗi 404.
   - Hàm `step(action)`: Mô phỏng hành động điều hướng (như click vào Pinned, chuyển tab sang Repositories, cuộn xem README, dừng do 404); cập nhật State và trả về Reward tương ứng.
2. Xây dựng cơ chế ngẫu nhiên hóa môi trường (Domain Randomization) để Agent học được cách thích ứng với nhiều cấu trúc trang cá nhân khác nhau.

#### Sản phẩm bàn giao (Deliverables):
* `rl_service/envs/candidate_screening_env.py`: Môi trường Gymnasium hoàn chỉnh cho bài toán sàng lọc hồ sơ.
* `rl_service/envs/github_mock_env.py`: Môi trường Gymnasium mô phỏng quá trình kiểm chứng GitHub.
* `rl_service/train_screening.py`: Kịch bản huấn luyện tự động cho DQN.
* `rl_service/train_verification.py`: Kịch bản huấn luyện tự động cho PPO/Q-Learning.

#### Tiêu chí hoàn thành (Definition of Done):
* Môi trường hoạt động ổn định, vượt qua bài kiểm thử của Gymnasium, tốc độ thực thi đạt tối thiểu 500 steps/giây trên môi trường CPU tiêu chuẩn.

#### Câu hỏi vấn đáp giảng viên dự kiến:
* "Môi trường giả lập mô phỏng phần thưởng như thế nào để phản ánh đúng thực tế quyết định của chuyên viên HR?"
* "Làm thế nào để đảm bảo Agent không bị học vẹt (Overfitting) trên các kịch bản của môi trường giả lập?"

---

### 5. THÀNH VIÊN 5: TRƯƠNG TUẦN HẢI
* **Chuyên môn:** Kỹ sư Tích hợp Hệ thống, Benchmark & Báo cáo (Integration & Benchmark Engineer)
* **Vai trò chung:** Chịu trách nhiệm huấn luyện mô hình thực tế, đo đạc các chỉ số khoa học, vẽ biểu đồ đối chứng, đóng gói mô hình thành API và tích hợp vào hệ thống Web/Extension hiện có của dự án; đồng thời chủ trì phần slide và báo cáo tổng kết.

#### Nhiệm vụ cụ thể tại Thuật toán 1: DQN (Sàng lọc hồ sơ)
1. Chạy huấn luyện mô hình DQN qua 1.000 - 2.000 episodes, ghi log chi tiết các chỉ số: Loss, Cumulative Reward, tỷ lệ chọn ứng viên đạt chuẩn.
2. Thực hiện bài toán đối chứng (Benchmark):
   - So sánh DQN với **Random Policy** (chọn ngẫu nhiên hồ sơ).
   - So sánh DQN với **Greedy Policy** (chọn tuần tự từ trên xuống dưới chỉ dựa vào điểm số tĩnh của Gemini mà không tính toán hạn ngạch).
   - Vẽ biểu đồ đường cong học tập (Learning Curves) và biểu đồ phân phối điểm số của các ứng viên được chọn.
3. Đóng gói mô hình thành dịch vụ API bằng **FastAPI**:
   - Endpoint `POST /api/rl/screen-candidates`: Nhận danh sách ứng viên và công việc, trả về danh sách ứng viên được DQN đề xuất duyệt.
4. Tích hợp API này vào Backend Express hiện tại của nhóm tại route `RL-hr-agent/backend/src/modules/client/presentation/http/controllers/job.controller.ts`.

#### Nhiệm vụ cụ thể tại Thuật toán 2: PPO / Q-Learning (Kiểm chứng GitHub Nanobrowser)
1. Chạy huấn luyện và đo đạc các chỉ số của Agent kiểm chứng:
   - Số bước trung bình hoàn thành một lượt kiểm chứng (Average Steps per Verification).
   - Tỷ lệ nhận diện chính xác link 404 và dừng duyệt kịp thời.
2. Kết nối Policy đã huấn luyện vào Chrome Extension:
   - Tích hợp vào background service worker của `nanobrowser/chrome-extension/src/background/index.ts` để tối ưu hóa chuỗi hành động cào dữ liệu kiểm chứng.
3. Thiết kế toàn bộ slide thuyết trình bảo vệ đồ án và biên tập tài liệu báo cáo tổng kết môn học.

#### Sản phẩm bàn giao (Deliverables):
* `rl_service/main.py`: Dịch vụ FastAPI phục vụ mô hình học tăng cường.
* `notebooks/rl_benchmarking.ipynb`: Jupyter Notebook chứa toàn bộ mã nguồn đo đạc thực nghiệm và biểu đồ đối chứng.
* `docs/presentation_slides.pdf`: Bộ slide thuyết trình đồ án cho cả nhóm.
* Mã nguồn tích hợp API vào Backend Express và Extension Nanobrowser.

#### Tiêu chí hoàn thành (Definition of Done):
* Có đầy đủ biểu đồ hội tụ khoa học, thời gian phản hồi của API dưới 100ms, hệ thống hoạt động thông suốt từ giao diện Web -> Backend -> Mô hình RL.

#### Câu hỏi vấn đáp giảng viên dự kiến:
* "Các số liệu thực nghiệm chứng minh thuật toán DQN tốt hơn phương pháp lựa chọn truyền thống ở những điểm nào?"
* "Độ trễ và tài nguyên tiêu tốn khi chạy mô hình trong môi trường thực tế là bao nhiêu?"

---

## IV. LỘ TRÌNH TRIỂN KHAI CHI TIẾT THEO 4 TUẦN (TIMELINE)

### Tuần 1: Nghiên cứu, Thiết kế Toán học & Chuẩn bị Dữ liệu
* **Nguyễn Minh Đức (Thành viên 1):** Hoàn thiện tài liệu thiết kế MDP (State, Action, Reward) cho cả 2 bài toán.
* **Phùng Văn Duy (Thành viên 2):** Viết xong pipeline trích xuất vector 24 chiều từ MongoDB và sinh dữ liệu mẫu.
* **Phạm Văn Hưng (Thành viên 3):** Xây dựng khung kiến trúc mạng nơ-ron PyTorch và Replay Buffer.
* **Lê Quý Dương (Thành viên 4):** Thiết kế khung sườn 2 môi trường Gymnasium (reset, step).
* **Trương Tuần Hải (Thành viên 5):** Thiết lập môi trường chạy thử nghiệm, cài đặt FastAPI và viết template báo cáo.

### Tuần 2: Lập trình Lõi Thuật toán & Môi trường Giả lập
* **Nguyễn Minh Đức (Thành viên 1):** Rà soát công thức hàm Loss, kiểm tra điều kiện dừng và tỷ lệ phạt.
* **Phùng Văn Duy (Thành viên 2):** Hoàn thiện bộ trích xuất trạng thái DOM cho kiểm chứng GitHub.
* **Phạm Văn Hưng (Thành viên 3):** Hoàn thành module `DQNAgent` và module `PPOAgent`.
* **Lê Quý Dương (Thành viên 4):** Hoàn thành môi trường `CandidateScreeningEnv` và `GitHubVerificationEnv`.
* **Trương Tuần Hải (Thành viên 5):** Chạy thử nghiệm các vòng lặp huấn luyện đầu tiên, sửa lỗi kết nối giữa Agent và Environment.

### Tuần 3: Huấn luyện, Tinh chỉnh Siêu tham số & Đo đạc Thực nghiệm
* **Nguyễn Minh Đức (Thành viên 1):** Đánh giá tính hội tụ toán học, điều chỉnh hệ số khám phá epsilon và hệ số chiết khấu gamma.
* **Phùng Văn Duy (Thành viên 2):** Tối ưu hóa tốc độ tiền xử lý dữ liệu và kiểm tra các trường hợp biên.
* **Phạm Văn Hưng (Thành viên 3):** Tinh chỉnh siêu tham số mạng nơ-ron (Learning rate, Batch size, Target update frequency).
* **Lê Quý Dương (Thành viên 4):** Tăng độ phức tạp của môi trường giả lập để thử thách độ bền vững của mô hình.
* **Trương Tuần Hải (Thành viên 5):** Thực hiện benchmark đối chứng giữa DQN với Greedy/Random, xuất các biểu đồ học tập khoa học.

### Tuần 4: Đóng gói API, Tích hợp Hệ thống & Báo cáo Tổng kết
* **Nguyễn Minh Đức (Thành viên 1):** Tổng hợp phần lý thuyết và kết quả toán học vào báo cáo chính thức.
* **Phùng Văn Duy (Thành viên 2):** Kiểm thử tính ổn định của vector đầu vào trên dữ liệu thực tế từ database.
* **Phạm Văn Hưng (Thành viên 3):** Đóng gói trọng số mô hình đã train (.pth / .pt) và tối ưu hóa thời gian inference.
* **Lê Quý Dương (Thành viên 4):** Viết tài liệu hướng dẫn chạy lại môi trường giả lập (Reproducibility guide).
* **Trương Tuần Hải (Thành viên 5):** Tích hợp API FastAPI vào Backend Express, kết nối Extension, hoàn thành slide và diễn tập thuyết trình cùng nhóm.
