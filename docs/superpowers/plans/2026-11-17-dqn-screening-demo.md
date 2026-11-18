# DQN Candidate Screening Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng bản demo trực quan hoàn chỉnh cho thuật toán Deep Q-Network (DQN) sàng lọc CV ứng viên theo hạn ngạch tuyển dụng $K$, hỗ trợ so sánh đối đầu giữa 2 tập dữ liệu: TH1 (Dữ liệu ảo) và TH2 (Dữ liệu thật), tích hợp backend TypeScript và giao diện dashboard React 19 + Recharts.

**Architecture:** Môi trường `CandidateScreeningEnv` (Gym-style 24 chiều) làm môi trường mô phỏng; DQN Agent gồm mạng nơ-ron đa tầng `QNetwork`, `ReplayBuffer`, chính sách $\epsilon$-greedy và Bellman Loss; API Express xử lý huấn luyện (`/train`) và suy luận (`/simulate`); Frontend React hiển thị điều khiển, biểu đồ Recharts và bảng duyệt ứng viên thời gian thực.

**Tech Stack:** Node.js, TypeScript, Express 5, React 19, Recharts, React Icons, CSS.

**Spec:** `docs/superpowers/specs/2026-11-17-dqn-screening-demo-design.md`

## Global Constraints

- 100% mã nguồn Backend viết bằng TypeScript, thực thi qua `tsx`.
- Tuyệt đối KHÔNG commit bất kỳ tệp `.env` nào (kể cả `frontend/.env` và `backend/.env`). Khi `git add` chỉ thêm đích danh các tệp cần thiết.
- Tuân thủ chính xác công thức toán học và hàm phần thưởng trong `MDP.md`: State 24 chiều, Action 3 chiều (0: REJECT, 1: ACCEPT, 2: HOLD), $\gamma = 0.95$.
- Trọng số mô hình lưu tại `backend/weights/` (nằm ngoài `backend/src/`) để ngăn `nodemon` tự động reload server khi đang demo.
- Mỗi task kết thúc bằng một commit Git riêng biệt, kèm kiểm thử xác nhận.

## Review Focus

1. **Ràng buộc hạn ngạch không bị vượt quá (Over-quota guard):** Khi số ứng viên được chọn (ACCEPT) đạt tối đa $K$, Agent không được phép nhận thêm hoặc môi trường phải dừng hợp lệ theo đúng `terminateOnQuotaFilled: true`.
   * *Test:* Task 3 kiểm tra `kRemain >= 0` và số lượng `acceptedCandidates.length <= K`.
2. **Khả năng xử lý khi mô hình chưa qua huấn luyện (Fallback safety):** Nếu người dùng chưa bấm Train, hệ thống tự động nạp `dqn_baseline.json` để API `/simulate` chạy thành công ngay lập tức.
   * *Test:* Task 4 kiểm tra `/api/v1/rl/simulate` khi vừa khởi động server trả về status 200 và danh sách quyết định hợp lệ.
3. **Bảo toàn định dạng dữ liệu giữa TH1 và TH2:** Cả hai tập dữ liệu phải cung cấp đầy đủ 16 chiều đặc trưng hợp lệ $[0, 1]$ (hoặc $[-1, 1]$ với verificationStatus) để môi trường ghép nối thành vector 24 chiều.
   * *Test:* Task 1 kiểm tra xác thực cấu trúc schema và các giá trị số học của cả 2 file JSON.
4. **Hiển thị đầy đủ 30 ứng viên trên UI khi dừng sớm:** Khi đợt tuyển dừng tại bước thứ $m < 30$, các ứng viên từ $m+1$ đến 30 phải hiển thị với trạng thái "Đã đủ chỉ tiêu (Bỏ qua)" thay vì bị thiếu hàng trên bảng.
   * *Test:* Task 5 kiểm tra số dòng render trên bảng luôn bằng 30.
5. **Độ ổn định không crash của Replay Buffer:** Khi dung lượng bộ nhớ vượt quá $N_{buffer} = 10,000$, cơ chế vòng tròn (Ring buffer) phải ghi đè từ đầu mà không làm phình bộ nhớ RAM.
   * *Test:* Task 2 unit test `ReplayBuffer` với 15,000 lượt push liên tiếp.

---

### Task 1: Xây dựng 2 tệp dữ liệu ứng viên TH1 (Ảo) và TH2 (Thật)

**Files:**
- Create: `backend/src/modules/client/infrastructure/rl/data/synthetic_candidates.json`
- Create: `backend/src/modules/client/infrastructure/rl/data/real_candidates.json`
- Create: `backend/src/modules/client/infrastructure/rl/data/types.ts`
- Test: `backend/src/modules/client/infrastructure/rl/data/test_datasets.ts`

**Interfaces:**
- Consumes: `CandidatePoolItem` từ `backend/src/modules/client/infrastructure/rl/envs/dqn/types.ts`
- Produces: `syntheticCandidates: CandidatePoolItem[]`, `realCandidates: CandidatePoolItem[]`

- [ ] **Step 1: Viết test kiểm tra tính toàn vẹn của 2 tệp dữ liệu**
  Tạo `backend/src/modules/client/infrastructure/rl/data/test_datasets.ts` kiểm tra:
  - Cả 2 tệp có đúng 30 ứng viên.
  - Mỗi ứng viên có đủ: `id`, `name`, `score` $\in [0, 100]$, `features` (mảng 16 số thực hợp lệ không chứa NaN).
  - TH1 có đủ 4 tầng ứng viên (`star`, `good`, `average`, `weak`).
  - TH2 có thông tin hồ sơ thực tế (`rawInfo` gồm trường học, số năm kinh nghiệm, kỹ năng chính, link GitHub).

- [ ] **Step 2: Chạy test để xác nhận test thất bại (Red)**
  Run: `npx tsx src/modules/client/infrastructure/rl/data/test_datasets.ts` (trong thư mục `backend`)
  Expected: FAIL (File not found hoặc dữ liệu chưa tồn tại)

- [ ] **Step 3: Tạo tệp `synthetic_candidates.json` (TH1) và `real_candidates.json` (TH2)**
  - TH1: 30 ứng viên sinh theo phân phối chuẩn của `CandidateScreeningEnv` (4 star, 11 good, 9 average, 6 weak).
  - TH2: 30 ứng viên thực tế ứng tuyển vị trí "Senior Fullstack / AI Engineer" với điểm tương thích kỹ năng, thông tin học vấn (HUST, TLU, VNU...), số sao GitHub, và số năm kinh nghiệm.

- [ ] **Step 4: Chạy test để xác nhận test vượt qua (Green)**
  Run: `npx tsx src/modules/client/infrastructure/rl/data/test_datasets.ts` (trong thư mục `backend`)
  Expected: PASS 100%

- [ ] **Step 5: Commit Git**
  ```bash
  git add backend/src/modules/client/infrastructure/rl/data/
  git commit -m "feat(rl): add synthetic and real candidate datasets for TH1 and TH2"
  ```

---

### Task 2: Hiện thực Neural Network, Replay Buffer và DQN Agent bằng TypeScript

**Files:**
- Create: `backend/src/modules/client/infrastructure/rl/core/neuralNetwork.ts`
- Create: `backend/src/modules/client/infrastructure/rl/core/replayBuffer.ts`
- Create: `backend/src/modules/client/infrastructure/rl/core/dqnAgent.ts`
- Create: `backend/src/modules/client/infrastructure/rl/core/types.ts`
- Test: `backend/src/modules/client/infrastructure/rl/core/test_dqn_core.ts`

**Interfaces:**
- Consumes: `CandidateScreeningEnv`, `CandidateAction`, `StepResult` từ `../envs/dqn/`
- Produces:
  - `class QNetwork`: `forward(x: number[]): number[]`, `backward(grad: number[]): void`, `getWeights(): any`, `setWeights(w: any): void`
  - `class ReplayBuffer`: `push(transition: Transition): void`, `sample(batchSize: number): Transition[]`, `size(): number`
  - `class DQNAgent`: `selectAction(state: number[], epsilon: number): CandidateAction`, `trainStep(batchSize: number, gamma: number): number`, `updateTargetNetwork(): void`, `saveWeights(path: string): void`, `loadWeights(path: string): boolean`

- [ ] **Step 1: Viết test cho Core DQN (QNetwork, ReplayBuffer, DQNAgent)**
  Tạo `backend/src/modules/client/infrastructure/rl/core/test_dqn_core.ts` kiểm tra:
  - `QNetwork` forward ra mảng 3 giá trị Q, gradient update làm giảm MSE loss.
  - `ReplayBuffer` lưu trữ và sample đúng kích thước batch; ring buffer ghi đè khi đầy mà không lỗi.
  - `DQNAgent` chọn hành động hợp lệ $a \in \{0, 1, 2\}$, suy giảm $\epsilon$ qua từng episode, cập nhật target network thành công.

- [ ] **Step 2: Chạy test để xác nhận test thất bại (Red)**
  Run: `npx tsx src/modules/client/infrastructure/rl/core/test_dqn_core.ts` (trong thư mục `backend`)
  Expected: FAIL (Modules not found)

- [ ] **Step 3: Hiện thực `neuralNetwork.ts`, `replayBuffer.ts` và `dqnAgent.ts`**
  - `neuralNetwork.ts`: Kiến trúc DenseLayer (He initialization, Adam/SGD optimizer) và QNetwork (24 -> 128 -> 64 -> 3).
  - `replayBuffer.ts`: Lưu trữ tuple $(s, a, r, s', done)$, hỗ trợ sample ngẫu nhiên đồng đều.
  - `dqnAgent.ts`: Policy Network + Target Network (Polyak soft-update $\tau = 0.005$ và hard-update sau mỗi 50 steps), tính Bellman loss $y_i = r_i + \gamma (1 - done_i) \max_{a'} Q(s'_i, a'; \theta^-)$, hỗ trợ save/load JSON weights.

- [ ] **Step 4: Chạy test để xác nhận test vượt qua (Green)**
  Run: `npx tsx src/modules/client/infrastructure/rl/core/test_dqn_core.ts` (trong thư mục `backend`)
  Expected: PASS 100%

- [ ] **Step 5: Commit Git**
  ```bash
  git add backend/src/modules/client/infrastructure/rl/core/
  git commit -m "feat(rl): implement QNetwork, ReplayBuffer, and DQNAgent in TypeScript"
  ```

---

### Task 3: Kịch bản Huấn luyện, Sinh trọng số chuẩn `dqn_baseline.json` & Benchmark

**Files:**
- Create: `backend/weights/dqn_baseline.json`
- Create: `backend/src/modules/client/infrastructure/rl/scripts/train_baseline.ts`
- Create: `backend/src/modules/client/infrastructure/rl/scripts/evaluate_th1_th2.ts`

**Interfaces:**
- Consumes: `DQNAgent`, `CandidateScreeningEnv`, `synthetic_candidates.json`, `real_candidates.json`
- Produces: `backend/weights/dqn_baseline.json` (Trọng số đã huấn luyện hội tụ sẵn)

- [ ] **Step 1: Viết script huấn luyện `train_baseline.ts`**
  - Chạy 200 episodes trên `CandidateScreeningEnv` theo Algorithm 1 của `MDP.md`.
  - Ghi log: Episode, Reward trung bình, Loss, Epsilon.
  - Lưu trọng số tốt nhất ra `backend/weights/dqn_baseline.json`.

- [ ] **Step 2: Viết script đánh giá so sánh `evaluate_th1_th2.ts`**
  - Nạp trọng số `dqn_baseline.json`.
  - Chạy Inference ($\epsilon = 0$) trên TH1 (30 hồ sơ ảo) với ngân sách $K=5$.
  - Chạy Inference ($\epsilon = 0$) trên TH2 (30 hồ sơ thật) với ngân sách $K=5$.
  - In bảng so sánh chi tiết: Số lượng ACCEPT, điểm trung bình được chọn, tổng reward, tỷ lệ bắt đúng ứng viên xuất sắc.

- [ ] **Step 3: Chạy script huấn luyện để tạo tệp trọng số `dqn_baseline.json`**
  Run: `npx tsx src/modules/client/infrastructure/rl/scripts/train_baseline.ts` (trong thư mục `backend`)
  Expected: Hoàn thành 200 episodes, Loss giảm, tệp `backend/weights/dqn_baseline.json` được tạo thành công.

- [ ] **Step 4: Chạy script đánh giá so sánh xác nhận kết quả hoạt động chuẩn xác**
  Run: `npx tsx src/modules/client/infrastructure/rl/scripts/evaluate_th1_th2.ts` (trong thư mục `backend`)
  Expected: In kết quả chi tiết từng bước cho cả TH1 và TH2 không gặp lỗi.

- [ ] **Step 5: Commit Git**
  ```bash
  git add backend/weights/dqn_baseline.json backend/src/modules/client/infrastructure/rl/scripts/
  git commit -m "feat(rl): add baseline weights and evaluation scripts for TH1 and TH2"
  ```

---

### Task 4: Xây dựng Controller và Route API Express cho RL

**Files:**
- Create: `backend/src/modules/client/infrastructure/rl/controllers/rl.controller.ts`
- Create: `backend/src/modules/client/presentation/http/routes/rl.route.ts`
- Modify: `backend/src/modules/client/presentation/http/routes/index.route.ts`
- Test: `backend/src/modules/client/infrastructure/rl/tests/test_rl_api.ts`

**Interfaces:**
- Consumes: `DQNAgent`, `CandidateScreeningEnv`, dataset TH1 & TH2
- Produces Express endpoints:
  - `GET /api/v1/rl/datasets` -> `{ success: true, synthetic: [...], real: [...] }`
  - `POST /api/v1/rl/train` -> `{ success: true, history: [{ episode, reward, loss, epsilon }] }`
  - `POST /api/v1/rl/simulate` -> `{ success: true, datasetType, budgetK, decisions: [...], summary: { totalAccepted, avgScore, totalReward } }`

- [ ] **Step 1: Viết test kiểm tra các endpoint API RL**
  Tạo `backend/src/modules/client/infrastructure/rl/tests/test_rl_api.ts` kiểm thử trực tiếp controller logic cho:
  - `GET /datasets`: Trả về đúng 30 ứng viên mỗi tập.
  - `POST /simulate` với `dataset: 'synthetic', budgetK: 5`: Trả về 30 quyết định, số lượng ACCEPT bằng đúng 5, có đủ Q-values cho từng bước.
  - `POST /simulate` với `dataset: 'real', budgetK: 5`: Trả về quyết định hợp lệ trên dữ liệu thật.

- [ ] **Step 2: Chạy test để xác nhận test thất bại (Red)**
  Run: `npx tsx src/modules/client/infrastructure/rl/tests/test_rl_api.ts` (trong thư mục `backend`)
  Expected: FAIL (Controller/Route chưa tồn tại)

- [ ] **Step 3: Hiện thực `rl.controller.ts`, `rl.route.ts` và đăng ký vào `index.route.ts`**
  - Tích hợp logic khởi tạo Agent (tự động load `backend/weights/dqn_baseline.json` khi boot).
  - Đăng ký `rlRoute` tại `/api/v1/rl` trong `index.route.ts`.

- [ ] **Step 4: Chạy test API để xác nhận test vượt qua (Green)**
  Run: `npx tsx src/modules/client/infrastructure/rl/tests/test_rl_api.ts` (trong thư mục `backend`)
  Expected: PASS 100%

- [ ] **Step 5: Commit Git**
  ```bash
  git add backend/src/modules/client/infrastructure/rl/controllers/ backend/src/modules/client/presentation/http/routes/rl.route.ts backend/src/modules/client/presentation/http/routes/index.route.ts backend/src/modules/client/infrastructure/rl/tests/
  git commit -m "feat(api): add RL routes and controller for DQN training and simulation"
  ```

---

### Task 5: Xây dựng Giao diện React `DQNScreening.jsx` (Recharts + Decision Board)

**Files:**
- Create: `frontend/src/pages/client/DQNScreening/DQNScreening.jsx`
- Create: `frontend/src/pages/client/DQNScreening/DQNScreening.css`
- Create: `frontend/src/services/client/rlService.js`
- Modify: `frontend/src/components/clients/siderbar/index.jsx` (thêm mục menu "DQN Sàng lọc CV")
- Modify: `frontend/src/routes/index.jsx` (thêm route `/dqn-screening`)

**Interfaces:**
- Consumes: Backend API `/api/v1/rl/*` qua `rlService.js`
- Produces: Giao diện trực quan hóa hoàn chỉnh gồm:
  - Bộ điều khiển: Chọn TH1 / TH2, chỉnh ngân sách $K$, nút "🚀 Bắt đầu Huấn luyện" và "🔍 Chạy Sàng lọc (Inference)".
  - Biểu đồ Recharts: Reward qua các episode và Loss hội tụ.
  - Bảng tiến trình duyệt từng ứng viên (Live Decision Board: Tên, điểm năng lực, 3 giá trị Q-value, Quyết định ACCEPT/REJECT/HOLD, lý do AI chọn).
  - Bảng đối đầu so sánh kết quả giữa TH1 và TH2.

- [ ] **Step 1: Tạo `frontend/src/services/client/rlService.js`**
  Hàm gọi API `getDatasets()`, `trainAgent(episodes)`, `simulate(datasetType, budgetK)`.

- [ ] **Step 2: Xây dựng component `DQNScreening.jsx` và CSS `DQNScreening.css`**
  - Tích hợp biểu đồ Recharts `LineChart`, `ResponsiveContainer`, `BarChart`.
  - Hiển thị bảng duyệt động từng ứng viên với màu sắc trực quan (Xanh: ACCEPT, Đỏ: REJECT, Vàng: HOLD, Xám: Đã đủ chỉ tiêu).
  - Hiển thị bảng đối đầu so sánh TH1 vs TH2.

- [ ] **Step 3: Cập nhật Sidebar và Route Client**
  - Thêm icon `MdSmartToy` / `MdPsychology` với label "DQN Sàng lọc CV" dẫn tới `/dqn-screening` trong `menuItems` của Sidebar.
  - Đăng ký route `{ path: "dqn-screening", element: <DQNScreening /> }` trong `frontend/src/routes/index.jsx`.

- [ ] **Step 4: Kiểm tra build frontend bằng Vite để đảm bảo không có lỗi cú pháp hoặc import**
  Run: `npm run build` (trong thư mục `frontend`)
  Expected: Build thành công tạo thư mục `dist/` với 0 lỗi.

- [ ] **Step 5: Commit Git**
  ```bash
  git add frontend/src/pages/client/DQNScreening/ frontend/src/services/client/rlService.js frontend/src/components/clients/siderbar/index.jsx frontend/src/routes/index.jsx
  git commit -m "feat(ui): add DQN screening dashboard page with Recharts and sidebar integration"
  ```

---

### Task 6: Kiểm thử Tích hợp Toàn diện (End-to-End Verification)

**Files:**
- Create: `backend/src/modules/client/infrastructure/rl/tests/test_e2e_verification.ts`

**Interfaces:**
- Consumes: Toàn bộ hệ thống backend và frontend artifacts
- Produces: Báo cáo kết quả kiểm thử đối chiếu toàn diện TH1 vs TH2

- [ ] **Step 1: Viết kịch bản kiểm thử E2E xác thực luồng hoạt động hoàn chỉnh**
  Tạo `backend/src/modules/client/infrastructure/rl/tests/test_e2e_verification.ts` tự động:
  - Kiểm tra nạp dataset TH1 và TH2.
  - Khởi tạo DQN Agent và nạp trọng số baseline.
  - Chạy mô phỏng TH1: Kiểm tra tính đúng đắn của quyết định, tính tuân thủ ngân sách $K=5$, điểm trung bình ứng viên trúng tuyển.
  - Chạy mô phỏng TH2: Kiểm tra quyết định trên ứng viên thật, tỷ lệ chọn nhân tài (hồ sơ có kinh nghiệm và kỹ năng cao).
  - Xuất bảng tóm tắt so sánh chỉ số để chuẩn bị nội dung báo cáo cho người dùng.

- [ ] **Step 2: Chạy kiểm thử E2E xác thực kết quả**
  Run: `npx tsx src/modules/client/infrastructure/rl/tests/test_e2e_verification.ts` (trong thư mục `backend`)
  Expected: PASS 100%, in ra bảng so sánh kết quả trực quan TH1 vs TH2.

- [ ] **Step 3: Kiểm tra `git status` đảm bảo không có tệp `.env` nào bị stage hoặc thay đổi**
  Run: `git status`
  Expected: Working tree chỉ chứa các tệp thuộc đồ án, tuyệt đối không có `.env`.

- [ ] **Step 4: Commit Git hoàn tất**
  ```bash
  git add backend/src/modules/client/infrastructure/rl/tests/test_e2e_verification.ts
  git commit -m "test(rl): add end-to-end verification and comparison suite for TH1 vs TH2"
  ```
