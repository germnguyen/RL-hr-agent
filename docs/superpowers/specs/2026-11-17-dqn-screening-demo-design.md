# TÀI LIỆU THIẾT KẾ: DEMO THUẬT TOÁN DEEP Q-NETWORK (DQN) SÀNG LỌC CV ỨNG VIÊN
**Dự án:** Nanobrowser HR Agent (Học Tăng Cường HK7)  
**Ngày:** 17/11/2026  
**Phương án lựa chọn:** Phương án 1 (Full-stack TypeScript Backend API + Giao diện Trực quan hóa React)

---

## 1. MỤC ĐÍCH & Ý NGHĨA (INTENT & THE WHY)
Quy trình sàng lọc hồ sơ ứng viên của HR là bài toán ra quyết định tuần tự có ràng buộc ngân sách (Sequential Decision Making with Budget Constraint):
- HR có $N$ hồ sơ nộp về nhưng chỉ có ngân sách phỏng vấn cho tối đa $K$ ứng viên ($K \ll N$).
- Thuật toán Deep Q-Network (DQN) đóng vai trò thẩm định viên tự động: quan sát từng hồ sơ theo thứ tự và đưa ra 1 trong 3 hành động: `ACCEPT` (Duyệt phỏng vấn), `REJECT` (Loại bỏ), hoặc `HOLD` (Tạm giữ danh sách chờ).
- Mục tiêu của hệ thống demo: Trực quan hóa toàn diện cơ chế hoạt động của DQN trên 2 tập dữ liệu cụ thể:
  - **TH1 (Tệp dữ liệu ảo - Synthetic CVs):** Dữ liệu giả lập mô phỏng thị trường tuyển dụng với 4 phân khúc năng lực (Star, Good, Average, Weak) theo đúng công thức phân phối toán học trong `MDP.md`.
  - **TH2 (Tệp dữ liệu thật - Real CVs):** Dữ liệu ứng viên chi tiết thực tế (kinh nghiệm, kỹ năng, dự án thực tế, số sao GitHub, và điểm phân tích độ tương thích ngữ nghĩa đối với một công việc cụ thể).
- Giúp nhóm sinh viên có công cụ trực quan mạnh mẽ, sống động để demo, báo cáo và bảo vệ đồ án trước hội đồng môn học.

---

## 2. MỤC TIÊU (GOALS), PHI MỤC TIÊU (NON-GOALS) & CHỐNG MỤC TIÊU (ANTI-GOALS)

### Mục tiêu (Goals)
1. **Dữ liệu:**
   - Tạo tệp `backend/src/modules/client/infrastructure/rl/data/synthetic_candidates.json` (TH1: 30 hồ sơ ảo đa dạng phân khúc).
   - Tạo tệp `backend/src/modules/client/infrastructure/rl/data/real_candidates.json` (TH2: 30 hồ sơ ứng viên thực tế có cấu trúc đầy đủ, gắn kèm bối cảnh một vị trí Job tuyển dụng cụ thể như Fullstack / AI Engineer).
2. **Backend DQN Core (TypeScript):**
   - Hiện thực `ReplayBuffer`: Lưu trữ transitions $(s, a, r, s', done)$ và lấy mẫu ngẫu nhiên mini-batch.
   - Hiện thực `QNetwork`: Mạng nơ-ron đa tầng (Input 24 neurons, Hidden 128 -> 64 với ReLU activation, Output 3 Q-values) và hỗ trợ cập nhật gradient / Bellman MSE loss.
   - Hiện thực `DQNAgent`: Quản lý mạng chính (Policy Net), mạng mục tiêu (Target Net với Soft/Hard update), chính sách khám phá $\epsilon$-greedy suy giảm theo thời gian, lưu/nạp trọng số mô hình.
   - Cung cấp sẵn bộ trọng số khởi tạo chuẩn (Baseline Pre-trained Weights) lưu tại `backend/weights/dqn_baseline.json` để hệ thống sẵn sàng suy luận ngay khi khởi động mà không bắt buộc phải chờ train.
   - Tích hợp liền mạch với `CandidateScreeningEnv` (Gym-style) đã kiểm thử thành công.
3. **Backend API:**
   - Endpoint Express `POST /api/v1/rl/train`: Kích hoạt quá trình huấn luyện DQN (chạy trên phân phối tổng quát hoặc dataset tùy chọn), trả về biểu đồ loss và episode reward qua các vòng lặp.
   - Endpoint Express `POST /api/v1/rl/simulate`: Chạy thử nghiệm suy luận (Inference với $\epsilon = 0$) trên tập dữ liệu TH1 hoặc TH2, trả về log chi tiết từng bước (step-by-step decision log), điểm $Q$-values, và số liệu thống kê tổng kết.
   - Endpoint Express `GET /api/v1/rl/datasets`: Lấy danh sách hồ sơ trong 2 tệp dữ liệu TH1 và TH2.
4. **Frontend UI (React 19 + Recharts):**
   - Thêm route và trang mới `/dqn-screening` trong client portal (`frontend/src/pages/client/DQNScreening`).
   - Thêm nút chuyển hướng "DQN Sàng lọc CV" trên Sidebar.
   - Giao diện gồm 4 khối chính:
     - Khối cấu hình & điều khiển (Chọn TH1/TH2, chỉnh $K$, nút Huấn luyện, nút Chạy mô phỏng).
     - Khối biểu đồ Recharts (Training Reward & Loss, Q-values distribution).
     - Khối bảng tiến trình duyệt từng ứng viên (Live Decision Board: hiển thị CV, Q-value, hành động, reward, hạn ngạch còn lại; hiển thị rõ trạng thái các ứng viên bị dừng sớm khi đã đủ chỉ tiêu $K$).
     - Khối đối chiếu so sánh kết quả TH1 vs TH2.
5. **Quy trình Git:**
   - Commit từng task nhỏ độc lập, rõ ràng.
   - Tuyệt đối loại trừ (bỏ qua) toàn bộ các tệp `.env` cá nhân.

### Phi mục tiêu (Non-goals)
- Không can thiệp hoặc thay đổi các nghiệp vụ auth, recruiter flow khác đã có của hệ thống ngoài phạm vi RL.
- Không huấn luyện mô hình học máy ngôn ngữ lớn (LLM) trong luồng này (điểm tương đồng ngữ nghĩa $s_1$ được trích xuất sẵn từ trước theo pipeline).

### Chống mục tiêu (Anti-goals)
- Không dùng code Python rời rạc mà thiếu kết nối với backend/frontend chính của đồ án.
- Không để xảy ra lỗi vi phạm hạn ngạch (Over-quota: số lượng ACCEPT vượt quá ngân sách $K$).
- Không commit bất kỳ thông tin nhạy cảm hoặc tệp `.env` nào lên Git.
- Không lưu trọng số runtime vào thư mục đang được nodemon watch (`src/`) để tránh việc server reload đột ngột khi đang demo.

---

## 3. RÀNG BUỘC KỸ THUẬT (CONSTRAINTS)
- **Ngôn ngữ lõi Backend:** 100% TypeScript, chạy trên môi trường Node.js qua `tsx`.
- **Đặc tả toán học:** Bám sát tuyệt đối công thức MDP trong `MDP.md`:
  - Không gian trạng thái: 24 chiều.
  - Không gian hành động: 3 hành động (0: REJECT, 1: ACCEPT, 2: HOLD).
  - Hàm phần thưởng: Thưởng ứng viên giỏi (+2.0 đến +3.0), phạt người yếu (-1.5 đến -3.0), phạt loại nhầm nhân tài (-2.0 đến -3.0), phạt lạm dụng HOLD (-0.2), thưởng hoàn thành (+5.0), phạt thiếu chỉ tiêu (-1.0/suất), phạt vượt hạn ngạch (-5.0).
  - Discount factor $\gamma = 0.95$.
- **Frontend:** React 19, Recharts, React Icons, CSS đồng bộ với phong cách hiện tại của hệ thống.
- **Git Commit:** Mỗi task hoàn thành phải được commit riêng biệt bằng `git commit`, chỉ định rõ tên tệp cần commit, không dùng `git add .` để tránh vướng `.env`.

---

## 4. QUYẾT ĐỊNH THIẾT KẾ ĐÃ ĐƯỢC LÀM RÕ (DESIGN DECISIONS)

1. **Chiến lược huấn luyện & Đánh giá (Training & Evaluation Strategy):**
   - DQN được huấn luyện trên phân phối tổng quát theo Algorithm 1 của `MDP.md` (sinh ngẫu nhiên các đợt tuyển với đủ 4 phân khúc năng lực). Sau khi học xong, Policy tối ưu này sẽ được dùng chung để chạy suy luận (Inference) trên cả 2 tệp kiểm thử chuẩn: TH1 (Tệp dữ liệu ảo tĩnh) và TH2 (Tệp dữ liệu thật).
   - Ngoài ra, hệ thống cho phép tùy chọn huấn luyện trực tiếp trên từng dataset cụ thể nếu người dùng muốn tinh chỉnh (fine-tune).

2. **Khởi tạo mô hình & Lưu trữ trọng số (Model Weights & Persistence):**
   - Đi kèm bộ trọng số mẫu chuẩn (`backend/weights/dqn_baseline.json`) được huấn luyện sẵn. Khi khởi động, Backend tự động nạp trọng số này để trang demo có thể "Chạy Sàng lọc" ngay lập tức mà không cần bấm Huấn luyện trước.
   - Thư mục lưu trữ trọng số đặt tại `backend/weights/` (nằm ngoài `backend/src/`), đảm bảo `nodemon` không tự khởi động lại khi cập nhật trọng số trong lúc đang thao tác demo.

3. **Phạm vi hiển thị tiến trình duyệt (Decision Scope & Early Termination):**
   - Theo đặc tả `CandidateScreeningEnv`, episode sẽ kết thúc ngay khi tuyển đủ $K=5$ suất phỏng vấn (Early Termination).
   - Trên giao diện "Live Decision Board", tất cả $N=30$ ứng viên đều được hiển thị đầy đủ: các ứng viên được xét trước khi kết thúc sẽ hiển thị rõ quyết định (ACCEPT / REJECT / HOLD) cùng Q-values; các ứng viên còn lại sau khi đã hết $K$ suất sẽ hiển thị trạng thái *"Đã đủ chỉ tiêu (Bỏ qua)"*, giúp người xem hiểu trực quan vì sao ứng viên dù tốt ở cuối danh sách vẫn bị lỡ cơ hội do hạn ngạch.

---

## 5. KẾ HOẠCH BÀN GIAO & CÁC BƯỚC THỰC HIỆN (TASK BREAKDOWN & COMMITS)

Mỗi task dưới đây sẽ được kiểm thử độc lập và tạo commit riêng (không đụng đến `.env`):
- **Task 1:** Tạo 2 tệp dữ liệu ứng viên TH1 (`synthetic_candidates.json`) và TH2 (`real_candidates.json`). *(Commit 1)*
- **Task 2:** Hiện thực Neural Network, Replay Buffer và DQN Agent bằng TypeScript (`neuralNetwork.ts`, `replayBuffer.ts`, `dqnAgent.ts`). *(Commit 2)*
- **Task 3:** Viết kịch bản kiểm thử, huấn luyện sinh trọng số chuẩn `dqn_baseline.json` (`test_dqn_training.ts`). *(Commit 3)*
- **Task 4:** Xây dựng Controller và Route API Express cho RL (`rl.controller.ts`, `rl.route.ts`), đăng ký vào `index.route.ts`. *(Commit 4)*
- **Task 5:** Xây dựng trang giao diện React `DQNScreening.jsx` kèm biểu đồ Recharts, tích hợp Sidebar và Route Client. *(Commit 5)*
- **Task 6:** Kiểm thử tích hợp toàn diện từ giao diện web tới backend API, đối chiếu kết quả TH1 và TH2. *(Commit 6)*
