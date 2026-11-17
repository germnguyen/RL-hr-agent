# TÀI LIỆU THIẾT KẾ: TÍNH NĂNG RLHF (REINFORCEMENT LEARNING FROM HUMAN FEEDBACK)
**Dự án:** Nanobrowser HR Agent (Học Tăng Cường HK7)  
**Ngày:** 17/11/2026  
**Phương án lựa chọn:** Phương án 1 (Human-in-the-Loop Online Fine-tuning)

---

## 1. MỤC ĐÍCH & Ý NGHĨA (INTENT & THE WHY)
Hiện thực hóa cơ chế **Chế độ 2: Human-in-the-Loop** đã được mô hình hóa trong `MDP.md`:
- Trong thực tế, AI đưa ra gợi ý nhưng chuyên viên HR là người có thẩm quyền quyết định cuối cùng.
- Khi HR tương tác với các gợi ý của AI (đồng ý hoặc điều chỉnh quyết định), hành vi này đóng vai trò là **tín hiệu thưởng từ con người (Human Feedback Reward)**.
- Mạng DQN phải có khả năng tiếp nhận phản hồi này, phạt các quyết định sai lầm, củng cố các quyết định đúng và lập tức cập nhật trọng số mạng nơ-ron (Online Fine-tuning), giúp Q-values thích ứng ngay lập tức với tiêu chuẩn đánh giá của HR.

---

## 2. MỤC TIÊU (GOALS), PHI MỤC TIÊU (NON-GOALS) & CHỐNG MỤC TIÊU (ANTI-GOALS)

### Mục tiêu (Goals)
1. **Backend RLHF Core:**
   - Mở rộng `DQNAgent` với phương thức `learnFromHumanFeedback(state, currentAction, humanAction, isAgree)`:
     - Nếu HR Đồng ý (`isAgree = true`): Gán $r = +2.0$, cập nhật gradient tăng $Q(s, currentAction)$.
     - Nếu HR Ghi đè (`isAgree = false`): Phạt hành động cũ $r = -2.0$, thưởng hành động của HR $r = +2.5$, cập nhật gradient điều chỉnh phân phối Q-values.
     - Tự động lưu trọng số mới vào `backend/weights/dqn_baseline.json`.
     - Trả về vector $Q$-values mới sau khi học.
2. **Backend API:**
   - Endpoint `POST /api/v1/rl/feedback`: Tiếp nhận `{ candidateId, state, currentAction, humanAction, isAgree }`, kích hoạt học và trả về `{ success: true, updatedQValues, message }`.
3. **Frontend UI (Live Feedback Interaction):**
   - Bổ sung cột "Phản hồi HR (RLHF)" trong bảng Live Decision Board của `DQNScreening.jsx`:
     - Nút "👍 Đồng ý": Xác nhận gợi ý của AI.
     - Nút "🔄 Đổi quyết định": Cho phép HR chọn lại (Duyệt ACCEPT, Loại REJECT, hoặc Chờ HOLD).
   - Khi HR bấm nút:
     - Gửi API feedback.
     - Hiển thị toast thông báo sinh động: *"AI đã tiếp thu phản hồi từ HR! Q-values đã được cập nhật."*
     - Cập nhật dòng của ứng viên với badge "Đã xác thực bởi HR" và Q-values mới.
4. **Quy trình Git:**
   - Commit độc lập, an toàn, tuyệt đối không đụng đến `.env`.

### Phi mục tiêu (Non-goals)
- Không can thiệp vào các logic tuyển dụng khác ngoài bảng demo DQN.

### Chống mục tiêu (Anti-goals)
- Không làm gián đoạn trải nghiệm người dùng (mỗi lần bấm feedback phải phản hồi dưới 100ms).
- Không làm hỏng bộ trọng số gốc nếu xảy ra lỗi (có cơ chế try/catch an toàn).

---

## 3. RÀNG BUỘC KỸ THUẬT (CONSTRAINTS)
- Tuân thủ công thức Reward từ Chế độ 2 của `MDP.md`: HR đồng ý $\rightarrow +2.0$; HR bác bỏ $\rightarrow -2.0$; hành động mới của HR $\rightarrow +2.5$.
- 100% TypeScript trong backend, React 19 trong frontend.
- Tuyệt đối loại trừ các tệp `.env`.

---

## 4. KẾ HOẠCH BÀN GIAO & CÁC BƯỚC THỰC HIỆN

- **Task 1:** Hiện thực logic RLHF trong `DQNAgent` (`dqnAgent.ts`) + Unit test backend (`test_rlhf.ts`).
- **Task 2:** Xây dựng Endpoint API `POST /api/v1/rl/feedback` trong `rl.controller.ts` & `rl.route.ts`.
- **Task 3:** Cập nhật giao diện `DQNScreening.jsx` (thêm các nút tương tác RLHF, hiệu ứng cập nhật Q-values theo thời gian thực) + kiểm tra build Vite.
- **Task 4:** Kiểm thử toàn diện tính năng RLHF (bấm thử trên UI/API, xác nhận Q-values thay đổi đúng hướng).
