# TÀI LIỆU THIẾT KẾ VÀ MÔ HÌNH HÓA QUY TRÌNH QUYẾT ĐỊNH MARKOV (MDP)

* **Tên đề tài:** Nanobrowser HR Agent (Trợ Lý Tuyển Dụng Thông Minh)
* **Môn học:** Học Tăng Cường (Reinforcement Learning) - Học kỳ 7
* **Mục tiêu tài liệu:** Định nghĩa khái niệm, mục đích khoa học của việc xây dựng MDP và đặc tả toán học chi tiết cho 2 bài toán cốt lõi trong hệ thống.

---

## PHẦN 1: TỔNG QUAN VỀ QUY TRÌNH QUYẾT ĐỊNH MARKOV (MDP)

### 1. MDP là gì? (Markov Decision Process)

Quy trình Quyết định Markov (Markov Decision Process - viết tắt là **MDP**) là một khung toán học hình thức (Formal Mathematical Framework) được sử dụng để mô tả và mô hình hóa các bài toán ra quyết định tuần tự (Sequential Decision Making) trong môi trường có tính biến động hoặc bất định, trong đó kết quả một phần phụ thuộc vào hành động của tác tử (Agent) và một phần phụ thuộc vào phản ứng ngẫu nhiên của môi trường (Environment).

Nền tảng triết học và toán học quan trọng nhất của MDP là **Tính chất Markov (Markov Property)**:
> *"Tương lai độc lập với quá khứ khi đã biết trạng thái hiện tại."*

Điều này có nghĩa là trạng thái hiện tại $s_t$ tại thời điểm $t$ đã tóm tắt đầy đủ toàn bộ lịch sử tương tác trước đó. Để dự đoán trạng thái kế tiếp $s_{t+1}$ và phần thưởng $r_{t+1}$, tác tử chỉ cần biết trạng thái hiện tại $s_t$ và hành động được chọn $a_t$, mà không cần phải truy vết lại toàn bộ chuỗi trạng thái trong quá khứ:

$$P(s_{t+1} = s', r_{t+1} = r \mid s_t, a_t, s_{t-1}, a_{t-1}, \dots, s_0, a_0) = P(s_{t+1} = s', r_{t+1} = r \mid s_t, a_t)$$

#### Bộ 5 thành phần chuẩn của một MDP:
Một MDP hoàn chỉnh trong Học Tăng Cường được định nghĩa bởi một bộ 5 phần tử:

$$(S, A, P, R, \gamma)$$

1. **Không gian Trạng thái ($S$ - State Space):** Tập hợp tất cả các trạng thái hợp lệ mà môi trường có thể có. Trạng thái $s \in S$ cung cấp cho Agent góc nhìn toàn diện về bối cảnh hiện tại để đưa ra quyết định.
2. **Không gian Hành động ($A$ - Action Space):** Tập hợp tất cả các hành động mà Agent có thể thực hiện. Có thể là không gian rời rạc (Discrete) hoặc liên tục (Continuous).
3. **Mô hình Chuyển trạng thái ($P$ - Transition Probability):** Xác suất môi trường chuyển từ trạng thái $s$ sang trạng thái mới $s'$ khi Agent thực hiện hành động $a$:
   $$P(s' \mid s, a) = \mathbb{P}(S_{t+1} = s' \mid S_t = s, A_t = a)$$
4. **Hàm Phần thưởng ($R$ - Reward Function):** Giá trị số học (Scalar Feedback) mà môi trường trả về cho Agent sau khi thực hiện hành động $a$ tại trạng thái $s$ và chuyển sang $s'$:
   $$R(s, a) = \mathbb{E}[R_{t+1} \mid S_t = s, A_t = a]$$
5. **Hệ số Chiết khấu ($\gamma \in [0, 1]$ - Discount Factor):** Tham số thể hiện mức độ quan tâm của Agent đối với các phần thưởng trong tương lai so với phần thưởng ngay lập tức. Nếu $\gamma \to 0$, Agent thiển cận (chỉ quan tâm trước mắt); nếu $\gamma \to 1$, Agent có tầm nhìn xa (ưu tiên tổng lợi ích dài hạn).

---

### 2. Mục đích của việc xây dựng MDP là gì?

Trong kỹ thuật học máy và học tăng cường, việc mô hình hóa bài toán nghiệp vụ thành MDP đóng vai trò sống còn vì 3 mục đích sau:

#### Mục đích 1: Chuyển đổi bài toán thực tế thành bài toán toán học giải được bằng máy tính
Trong nghiệp vụ nhân sự thực tế, các quyết định của HR thường mang tính cảm tính hoặc mô tả bằng lời nói (ví dụ: "CV này nhìn ổn", "ứng viên này có vẻ thiếu kinh nghiệm", "trang web GitHub này có nhiều sao"). Máy tính không thể tự học nếu không có cấu trúc toán học. Việc xây dựng MDP giúp:
* Biến hồ sơ CV và yêu cầu Job thành các **vector trạng thái số học** chuẩn hóa.
* Định nghĩa rõ ràng danh sách các **hành động cụ thể** mà Agent được phép bấm.
* Lượng hóa tiêu chí tốt/xấu thành một thước đo thống nhất gọi là **phần thưởng (Reward)**.

#### Mục đích 2: Giải quyết xung đột giữa "Lợi ích ngắn hạn" và "Lợi ích dài hạn"
Nếu giải quyết bài toán tuyển dụng bằng thuật toán tham lam (Greedy) hoặc chấm điểm đơn thuần (Classification):
* Hệ thống chỉ xét từng hồ sơ riêng lẻ mà không biết nhìn toàn cục: Nếu 3 hồ sơ đầu tiên đạt 80 điểm mà duyệt cả 3, hệ thống sẽ hết sạch ngân sách phỏng vấn, dẫn đến việc bỏ lỡ các hồ sơ 95-100 điểm ở phía sau danh sách.
* MDP giúp giải quyết bài toán chuỗi quyết định tuần tự: Agent học cách tối đa hóa **Tổng phần thưởng tích lũy kỳ vọng** (Expected Cumulative Return $G_t$):
  $$G_t = R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \dots = \sum_{k=0}^{\infty} \gamma^k R_{t+k+1}$$
  Nhờ đó, Agent biết khi nào nên kiên nhẫn từ chối hồ sơ trung bình để giữ slot cho hồ sơ xuất sắc hơn.

#### Mục đích 3: Nền tảng bắt buộc để áp dụng các thuật toán RL hiện đại (DQN, PPO)
Mọi thuật toán Học Tăng Cường (Value-based như DQN hay Policy-based như PPO) đều xây dựng dựa trên phương trình tối ưu Bellman (Bellman Optimality Equation). Nếu bài toán không được mô hình hóa thành một MDP hợp lệ:
* Không thể định nghĩa được hàm giá trị trạng thái $V(s)$ hoặc hàm giá trị hành động $Q(s, a)$.
* Không thể tính toán được đạo hàm hàm mất mát (Loss Function) để cập nhật trọng số mạng nơ-ron qua thuật toán Gradient Descent.

---

## PHẦN 2: THIẾT KẾ MDP CHI TIẾT CHO THUẬT TOÁN 1 (DQN - SÀNG LỌC CV THEO HẠN NGẠCH)

### 1. Bối cảnh nghiệp vụ
HR đăng tuyển một vị trí công việc (Job) và nhận được một tập hợp gồm $N$ hồ sơ ứng viên nộp về (ví dụ $N = 30$ CV). Tuy nhiên, lịch trình và ngân sách của phòng phỏng vấn chỉ cho phép chọn tối đa $K$ ứng viên (ví dụ $K = 5$ suất). 
Agent đóng vai trò là chuyên viên thẩm định hồ sơ: duyệt lần lượt từng CV trong danh sách từ đầu đến cuối và ra quyết định ngay tại thời điểm xem xét hồ sơ đó.

---

### 2. Đặc tả bộ 5 phần tử MDP

#### (1) Không gian Trạng thái ($S$ - State Space)
Trạng thái $s_t \in \mathbb{R}^{24}$ tại bước $t$ là một vector 24 chiều kết hợp 3 nhóm thông tin chính:

* **Nhóm 1: Mức độ tương thích CV và Job (6 chiều):**
  * $s_1$: Điểm tương đồng ngữ nghĩa do Gemini phân tích (chuẩn hóa về $[0, 1]$).
  * $s_2$: Tỷ lệ trùng khớp từ khóa kỹ năng cứng (Tech stack match ratio: số kỹ năng CV có chia cho số kỹ năng Job yêu cầu).
  * $s_3$: Độ lệch số năm kinh nghiệm: $\min(1.0, \frac{\text{Kinh nghiệm ứng viên}}{\text{Kinh nghiệm yêu cầu}})$.
  * $s_4$: Mức độ phù hợp về học vị (0.0: Không bằng cấp, 0.5: Cao đẳng, 0.8: Đại học, 1.0: Thạc sĩ/Tiến sĩ).
  * $s_5$: Điểm đánh giá dự án thực tế (dựa trên độ phức tạp của các dự án đã làm).
  * $s_6$: Số lượng kỹ năng vượt trội (Bonus skills) mà ứng viên có thêm ngoài yêu cầu.

* **Nhóm 2: Hồ sơ năng lực thực tế & Uy tín (10 chiều):**
  * $s_7$: Số năm kinh nghiệm làm việc thực tế (chuẩn hóa chia cho 10 năm).
  * $s_8$: Số lượng dự án thực tế đã hoàn thành (chuẩn hóa chia cho 20 dự án).
  * $s_9$: Điểm học tập GPA đại học (thang điểm 4 chuyển đổi về $[0, 1]$).
  * $s_{10}$: Số sao GitHub tích lũy (chuẩn hóa logarit: $\frac{\log(1 + stars)}{\log(1 + 1000)}$).
  * $s_{11}$: Số lượng Pinned Repositories trên GitHub.
  * $s_{12}$: Trạng thái kiểm chứng hồ sơ qua Nanobrowser ($1.0$: Verified, $0.0$: Unverified, $-1.0$: Risky).
  * $s_{13}$: Số lượng cảnh báo rủi ro (Red Flags) do AI phát hiện (chuẩn hóa: $\min(1.0, \frac{\text{số flags}}{5})$).
  * $s_{14}$: Tính ổn định công việc (thời gian làm việc trung bình tại mỗi công ty cũ).
  * $s_{15}$: Mức độ hoàn thiện thông tin liên hệ (đầy đủ email, số điện thoại, link mạng xã hội).
  * $s_{16}$: Điểm ưu tiên khu vực địa lý (1.0 nếu cùng tỉnh/thành phố với Job, 0.5 nếu lân cận, 0.0 nếu khác xa).

* **Nhóm 3: Ngữ cảnh tuyển dụng & Hạn ngạch ngân sách (8 chiều):**
  * $s_{17}$: Số suất phỏng vấn còn lại ($k_{remain} / K$).
  * $s_{18}$: Số hồ sơ còn lại chưa duyệt trong danh sách ($n_{remain} / N$).
  * $s_{19}$: Tỷ lệ khan hiếm suất phỏng vấn: $\frac{k_{remain}}{n_{remain} + 1}$.
  * $s_{20}$: Điểm trung bình của các ứng viên đã được chọn (Accept) trước đó trong episode này.
  * $s_{21}$: Điểm trung bình của các ứng viên đã bị từ chối (Reject) trước đó.
  * $s_{22}$: Tỷ lệ chấp nhận hiện tại: $\frac{\text{số đã duyệt}}{t + 1}$.
  * $s_{23}$: Vị trí tiến trình duyệt hiện tại: $t / N$.
  * $s_{24}$: Cờ cảnh báo áp lực kết thúc đợt tuyển (gần hết danh sách mà vẫn chưa đủ $K$ suất).

* **Hai nửa của sự chuyển đổi trạng thái trong bài toán DQN lọc CV:**
  Như đã phân tích ở trên, vector trạng thái $s_t$ có 24 chiều, được chia làm hai phần chính với cơ chế biến đổi hoàn toàn khác biệt:
  * **16 chiều đầu ($s_1 \dots s_{16}$):** Thông tin của ứng viên đang xét tại bước $t$ (kết hợp Nhóm 1 và Nhóm 2).
  * **8 chiều cuối ($s_{17} \dots s_{24}$):** Thông tin ngân sách và ngữ cảnh tuyển dụng tại bước $t$ (Nhóm 3).

  Khi Agent bấm một nút ($a_t \in \{\text{REJECT}, \text{ACCEPT}, \text{HOLD}\}$), môi trường chuyển từ bước $t$ sang $t+1$ ($s_t \to s_{t+1}$) theo 2 cơ chế sau:

  1. **Nửa 1: Chuyển đổi Tất định (Deterministic) — 8 chiều cuối ($s_{17} \dots s_{24}$):**
     * *"Tất định"* nghĩa là xác suất xảy ra bằng đúng $100\%$ ($P = 1.0$), tính bằng công thức toán học cố định, không có bất kỳ sự hên xui nào.
     * **Ví dụ:** Hiện tại còn $k_{remain} = 3$ suất phỏng vấn (trên tổng $K = 5 \Rightarrow s_{17} = 3/5 = 0.6$).
       * Nếu Agent chọn $a = 1$ (**ACCEPT**): Chắc chắn $100\%$ ở bước tiếp theo, số suất còn lại sẽ giảm đi 1 ($k'_{remain} = 2 \Rightarrow s'_{17} = 2/5 = 0.4$). Không bao giờ có chuyện bấm ACCEPT mà số suất lại giữ nguyên hay giảm đi 2.
       * Nếu Agent chọn $a = 0$ (**REJECT**) hoặc $a = 2$ (**HOLD**): Chắc chắn $100\%$ số suất giữ nguyên ($s'_{17} = 0.6$).
       * Số hồ sơ còn lại $n_{remain}$ cũng chắc chắn giảm đi 1 ($n'_{remain} = n_{remain} - 1 \Rightarrow s'_{18} = (n_{remain} - 1)/N$). Tiến trình duyệt tăng: $s'_{23} = (t+1)/N$.

  2. **Nửa 2: Chuyển đổi Ngẫu nhiên (Stochastic) — 16 chiều đầu ($s_1 \dots s_{16}$):**
     * Sau khi xử lý xong ứng viên thứ $t$, hệ thống bốc hồ sơ của ứng viên tiếp theo (ứng viên thứ $t+1$) lên để xem.
     * **Vấn đề:** Ở thời điểm đang xem CV số 1, Agent không thể biết trước CV số 2 sẽ là một siêu nhân (95 điểm, 1000 sao GitHub) hay một sinh viên mới ra trường chưa có kinh nghiệm (40 điểm, 0 sao GitHub).
     * Do hồ sơ nộp vào là ngẫu nhiên từ thị trường lao động, việc 16 chiều đầu tiên biến đổi từ ông $A$ sang ông $B$ tuân theo phân phối xác suất của tập dữ liệu ứng viên $\mathcal{D}$.
     * Chính tính chất ngẫu nhiên của 16 chiều đầu buộc mạng DQN phải học cách ước lượng giá trị kỳ vọng tương lai (Expected Future Return), biết kiên nhẫn từ chối hồ sơ trung bình ở đầu danh sách nếu kỳ vọng xuất hiện ứng viên xuất sắc ở các bước sau là cao.

---

#### (2) Không gian Hành động ($A$ - Action Space)
Agent có $3$ hành động rời rạc:

$$A = \{0, 1, 2\}$$

* $a = 0$ (**REJECT - Loại bỏ**): Từ chối hồ sơ ứng viên này, không mời phỏng vấn. Số suất phỏng vấn $k_{remain}$ không đổi.
* $a = 1$ (**ACCEPT - Chấp nhận**): Đồng ý đưa ứng viên này vào danh sách phỏng vấn. Số suất phỏng vấn giảm đi 1: $k_{remain} \leftarrow k_{remain} - 1$.
* $a = 2$ (**HOLD - Tạm giữ**): Đưa hồ sơ vào danh sách dự phòng để xem xét lại nếu cuối đợt tuyển vẫn chưa đủ người.

---

#### (3) Xác suất Chuyển trạng thái ($P(s' \mid s, a)$)

Trong bài toán này, môi trường chuyển trạng thái theo quy luật **Tất định từng phần (Partially Deterministic)** được hợp thành từ 2 nửa trạng thái:
* **Thành phần tất định ($P = 1.0$):** Đối với 8 chiều ngân sách và ngữ cảnh ($s_{17} \dots s_{24}$), trạng thái mới $s'_{17:24}$ được cập nhật chính xác $100\%$ theo quy tắc số học dựa trên hành động $a_t$ đã chọn.
* **Thành phần ngẫu nhiên:** Đối với 16 chiều hồ sơ ứng viên ($s_1 \dots s_{16}$), trạng thái mới $s'_{1:16}$ được lấy mẫu ngẫu nhiên từ tập dữ liệu ứng viên nộp về $\mathcal{D}$.

* **Công thức toán học hóa cho bài toán:**
  Nếu giảng viên yêu cầu viết công thức xác suất chuyển trạng thái $P(s' \mid s, a)$ cho MDP 1, ta tách trạng thái thành $s = (c, b)$ trong đó $c \in \mathbb{R}^{16}$ là đặc trưng ứng viên và $b \in \mathbb{R}^{8}$ là trạng thái ngân sách:

  $$P(s_{t+1} \mid s_t, a_t) = P(c_{t+1}, b_{t+1} \mid c_t, b_t, a_t) = \underbrace{P(b_{t+1} \mid b_t, c_t, a_t)}_{\text{Tất định } (= 1 \text{ hoặc } 0)} \times \underbrace{P(c_{t+1})}_{\text{Phân phối dữ liệu CV}}$$

  * **Ý nghĩa bản chất toán học:**
    * **Hành động của Agent chỉ tác động lên ngân sách $b_{t+1}$:** Khi Agent chọn $a_t \in \{\text{REJECT}, \text{ACCEPT}, \text{HOLD}\}$, hành động này chỉ cập nhật các biến đếm hạn ngạch $k_{remain}$, $n_{remain}$ và tiến trình duyệt theo quy tắc tất định:
      $$P(b_{t+1} \mid b_t, c_t, a_t) = \mathbb{I}(b_{t+1} = f_{budget}(b_t, a_t)) \in \{0, 1\}$$
    * **Hành động của Agent hoàn toàn độc lập với năng lực ứng viên tiếp theo $c_{t+1}$:** Hành động duyệt hay loại người thứ $t$ không làm thay đổi năng lực $c_{t+1}$ của người nộp đơn tiếp theo. Hồ sơ $c_{t+1}$ được lấy mẫu ngẫu nhiên từ phân phối dữ liệu thị trường tuyển dụng $P(c_{t+1}) \sim \mathcal{D}$.

---

#### (4) Hàm Phần thưởng ($R(s, a)$ - Reward Function)

Hàm phần thưởng được thiết kế nhằm mục tiêu: Khuyến khích chọn người giỏi, phạt khi chọn người kém, phạt nặng khi bỏ lỡ người xuất sắc và phạt khi vi phạm hạn ngạch.

* **Cơ chế vận hành của Hàm phần thưởng qua 2 chế độ:**

  1. **Chế độ 1: Khi Huấn luyện giả lập (Offline Training — Chưa có HR thật ngồi bấm):**
     * Khi cho Agent chạy $10.000$ vòng lặp để học, không có chuyên viên HR thật nào ngồi chấm cả $10.000$ vòng đó. Vì vậy, hệ thống đã **"mô phỏng hóa tiêu chuẩn của HR"** thành điểm năng lực $M(c, j) \in [0, 100]$ và ngưỡng đạt chuẩn $\theta = 75$:
       * Điểm $M \ge 75$ đại diện cho việc: *"Với hồ sơ đẹp thế này, nếu là HR thật thì chắc chắn HR sẽ hài lòng và đồng ý phỏng vấn"*.
       * Điểm $M < 75$ đại diện cho hồ sơ chưa đạt chuẩn yêu cầu công việc.
     * Hàm Reward lấy hành động của Agent so chiếu với tiêu chuẩn $M$ này:
       * Agent chọn **ACCEPT** + Hồ sơ có $M = 85$ (chuẩn HR thích): Thưởng cho Agent $r_t = +2.0 + \frac{85 - 75}{25} \times 1.0 = +2.4$ điểm.
       * Agent chọn **REJECT** + Hồ sơ có $M = 90$ (loại nhầm người mà HR rất cần): Phạt Agent $r_t = -2.0 - \frac{90 - 85}{15} \times 1.0 \approx -2.33$ điểm.
       * Agent chọn **REJECT** + Hồ sơ yếu $M = 50$: Thưởng $+1.0$ điểm vì đã thanh lọc hồ sơ dởm.

  2. **Chế độ 2: Khi chạy Thực tế trên Web (Online / Human-in-the-Loop — Có HR tương tác thật):**
     * Khi hệ thống đã đưa lên giao diện web (`/candidates`) cho HR sử dụng thật:
       * Agent chạy suy luận trước, gợi ý danh sách $K$ ứng viên được chọn (ACCEPT).
       * HR thật nhìn vào danh sách đó và thực hiện hành vi trên giao diện: bấm **"Chốt mời phỏng vấn"** hoặc bấm **"Loại bỏ gợi ý này"**.
     * Lúc này, **hành vi của HR chính là tín hiệu kích hoạt hàm Reward** theo cơ chế **RLHF (Reinforcement Learning from Human Feedback)**:
       * HR bấm đồng ý với gợi ý của Agent $\rightarrow$ Hệ thống gọi hàm Reward trả về **$+2.0$ điểm** cho Agent để nó củng cố kiến thức.
       * HR xóa ứng viên mà Agent gợi ý $\rightarrow$ Hệ thống trả về **$-1.5$ điểm** để Agent lưu vào Replay Buffer và tự sửa sai ở các đợt duyệt sau.

* **Công thức toán học chi tiết của Hàm phần thưởng từng bước ($r_t$):**
  Gọi $M(c, j) \in [0, 100]$ là điểm năng lực thực tế của ứng viên $c$ đối với công việc $j$. Ngưỡng đạt chuẩn phỏng vấn là $\theta = 75$ điểm.
  Hàm phần thưởng từng bước $r_t$ được tính như sau:

* **Trường hợp 1: Agent chọn $a = 1$ (ACCEPT)**
  * Nếu ứng viên giỏi ($M \ge 75$):
    $$r_t = +2.0 + \frac{M - 75}{25} \times 1.0 \quad (\text{thưởng từ } +2.0 \text{ đến } +3.0)$$
  * Nếu ứng viên yếu ($M < 75$):
    $$r_t = -1.5 - \frac{75 - M}{75} \times 1.5 \quad (\text{phạt từ } -1.5 \text{ đến } -3.0)$$
  * Nếu hết suất phỏng vấn ($k_{remain} = 0$) mà vẫn cố tình chọn ACCEPT:
    $$r_t = -5.0 \quad (\text{phạt nặng hành vi vi phạm hạn ngạch})$$

* **Trường hợp 2: Agent chọn $a = 0$ (REJECT)**
  * Nếu loại đúng ứng viên yếu ($M < 75$):
    $$r_t = +1.0 \quad (\text{thưởng vì đã thanh lọc hồ sơ dởm})$$
  * Nếu loại nhầm ứng viên xuất sắc ($M \ge 85$):
    $$r_t = -2.0 - \frac{M - 85}{15} \times 1.0 \quad (\text{phạt vì để mất nhân tài})$$

* **Trường hợp 3: Agent chọn $a = 2$ (HOLD)**
  * Phạt chi phí trì hoãn nhẹ: $r_t = -0.2$ (tránh việc Agent do dự, lạm dụng nút HOLD cho tất cả mọi hồ sơ).

* **Phần thưởng kết thúc Episode ($r_{terminal}$):**
  * Khi duyệt hết $N$ hồ sơ:
    * Nếu chọn đủ đúng $K$ suất phỏng vấn với điểm trung bình cao: Thưởng lớn $+5.0$.
    * Nếu chọn thiếu (ví dụ chỉ chọn được 1 hoặc 2 người vì quá kén chọn): Phạt thiếu người $-1.0 \times (K - k_{chosen})$.

---

#### (5) Hệ số Chiết khấu ($\gamma$)
Chọn **$\gamma = 0.95$**.
Hệ số này đủ lớn để Agent có tầm nhìn bao quát toàn bộ danh sách tuyển dụng, sẵn sàng từ chối hồ sơ 76 điểm ở đầu danh sách nếu nhận thấy xác suất có ứng viên 90 điểm ở các bước tiếp theo là cao.

---

### 3. Phương trình tối ưu Bellman và Cơ chế Huấn luyện cho DQN

Mạng nơ-ron Q-Network xấp xỉ hàm giá trị hành động tối ưu $Q(s, a; \theta) \approx Q^{\ast}(s, a)$. Mục tiêu của quá trình huấn luyện là tìm bộ trọng số tối ưu $\theta^{\ast}$ thỏa mãn **Phương trình tối ưu Bellman (Bellman Optimality Equation)**.

#### (1) Phương trình tối ưu Bellman lý thuyết (Dạng kỳ vọng)
Do bài toán sàng lọc CV có 16 chiều đặc trưng ứng viên biến thiên ngẫu nhiên theo thị trường lao động, phương trình Bellman tối ưu bắt buộc phải chứa **toán tử kỳ vọng $\mathbb{E}$** theo phân phối chuyển trạng thái $P(s' \mid s, a)$:

$$Q^{\ast}(s, a) = \mathbb{E}_{s' \sim P(\cdot \mid s, a)} \left[ R(s, a) + \gamma \max_{a' \in \mathcal{A}} Q^{\ast}(s', a') \right]$$

Hoặc dưới dạng phân rã tổng xác suất chuyển trạng thái:

$$Q^{\ast}(s, a) = \sum_{s' \in \mathcal{S}} P(s' \mid s, a) \left[ R(s, a) + \gamma \max_{a' \in \mathcal{A}} Q^{\ast}(s', a') \right]$$

#### (2) Hàm mất mát theo sai số Bellman (Bellman Loss Function)
Trong học tăng cường sâu (Deep Q-Learning), vì ta không biết trước toàn bộ phân phối xác suất lý thuyết $P(s' \mid s, a)$, Agent lấy mẫu ngẫu nhiên một mini-batch $B$ các bộ chuyển trạng thái từ Bộ nhớ đệm trải nghiệm (Replay Buffer $\mathcal{D}$):

$$B = \left\{ (s_i, a_i, r_i, s'_i, done_i) \right\}_{i=1}^{|B|} \sim \mathcal{D}$$

Hàm mất mát Mean Squared Error (MSE Loss) tại mỗi bước cập nhật trọng số:

$$L(\theta) = \frac{1}{|B|} \sum_{i=1}^{|B|} \left( y_i^{DQN} - Q(s_i, a_i; \theta) \right)^2$$

*(Có thể sử dụng thêm Huber Loss / Smooth L1 Loss để chống bùng nổ đạo hàm khi phần thưởng có độ lệch lớn).*

#### (3) Giá trị mục tiêu Bellman ($y_i^{DQN}$) và Mạng mục tiêu (Target Network)
Giá trị mục tiêu $y_i^{DQN}$ được tính thông qua mạng **Target Network** có bộ trọng số riêng biệt $\theta^-$:

$$y_i^{DQN} = r_i + (1 - done_i) \cdot \gamma \max_{a' \in \mathcal{A}} Q(s'_i, a'; \theta^-)$$

* **Ý nghĩa cốt lõi của thành phần $(1 - done_i)$:**
  * Khi đợt tuyển dụng chưa kết thúc ($done_i = 0$): Giá trị tương lai của trạng thái kế tiếp $s'_i$ được tính có chiết khấu $\gamma \max_{a'} Q(s'_i, a'; \theta^-)$.
  * Khi đợt tuyển dụng kết thúc ($done_i = 1$, duyệt hết danh sách $N$ hồ sơ hoặc hết sạch suất $K$): Trạng thái kế tiếp là Terminal State, không còn tương lai, giá trị mục tiêu rút gọn về đúng phần thưởng tức thời: $y_i^{DQN} = r_i$.
* **Cơ chế chống mất ổn định mục tiêu (Moving Target Problem):**
  * Nếu dùng chung trọng số $\theta$ để tính cả $Q(s_i, a_i; \theta)$ và giá trị mục tiêu, mục tiêu sẽ dịch chuyển liên tục sau mỗi bước Gradient Descent khiến mạng nơ-ron bị phân kỳ hoặc dao động mất kiểm soát.
  * Mạng Target Network giữ cố định trọng số $\theta^-$ và được đồng bộ định kỳ theo 1 trong 2 cơ chế:
    * **Hard Update:** Sau mỗi $C$ bước huấn luyện (ví dụ $C = 100$ bước):
      $$\theta^- \leftarrow \theta$$
    * **Soft Update (Polyak Averaging):** Cập nhật từ từ sau mỗi bước với hệ số $\tau \ll 1$ (ví dụ $\tau = 0.005$):
      $$\theta^- \leftarrow \tau \theta + (1 - \tau)\theta^-$$

#### (4) Cơ chế chọn hành động: Cân bằng Khám phá & Khai thác ($\epsilon$-greedy)
Trong quá trình huấn luyện, Agent chọn hành động theo chiến lược suy giảm khám phá $\epsilon$-greedy:

$$a_t = \begin{cases} 
\arg\max_{a \in \mathcal{A}} Q(s_t, a; \theta) & \text{với xác suất } 1 - \epsilon_t \quad (\text{Khai thác - Exploitation}) \\ 
\text{ngẫu nhiên } a \in \mathcal{A} & \text{với xác suất } \epsilon_t \quad (\text{Khám phá - Exploration}) 
\end{cases}$$

Hệ số khám phá $\epsilon_t$ suy giảm theo cấp số nhân qua từng episode:
$$\epsilon_t = \max \left( \epsilon_{min}, \, \epsilon_{start} \cdot d^t \right) \quad (\text{với } \epsilon_{start} = 1.0, \, \epsilon_{min} = 0.05, \, d = 0.995)$$
Khi đưa vào sử dụng thực tế (Inference / Production), ta đặt $\epsilon = 0$ để Agent luôn hành động tối ưu theo chính sách tham lam (Greedy Policy): $\pi(s) = \arg\max_{a \in \mathcal{A}} Q(s, a; \theta)$.

#### (5) Mã giả thuật toán DQN Sàng lọc CV (Algorithm 1 Pseudocode)

Dưới đây là mã giả chuẩn học thuật và quy trình thực thi chi tiết của thuật toán DQN cho bài toán Sàng lọc CV có ràng buộc hạn ngạch ngân sách:

```text
================================================================================================
THUẬT TOÁN 1: DEEP Q-NETWORK (DQN) SÀNG LỌC HỒ SƠ ỨNG VIÊN THEO HẠN NGẠCH
================================================================================================
Đầu vào:
  - Tập dữ liệu hồ sơ ứng viên D_cand, Thông tin mô tả công việc Job
  - Hạn ngạch phỏng vấn tối đa K, Số lượng hồ sơ trong mỗi đợt tuyển N
  - Siêu tham số: Số episode M, Dung lượng bộ đệm N_buffer, Kích thước batch |B|
  - Hệ số chiết khấu gamma = 0.95, Tốc độ học alpha = 0.0005, Hệ số Polyak tau = 0.005
  - Tham số Epsilon-greedy: eps_start = 1.0, eps_min = 0.05, tốc độ suy giảm d = 0.995
  - Chu kỳ cập nhật Target Network C bước

Đầu ra:
  - Bộ trọng số mạng nơ-ron tối ưu theta* của Q-Network phục vụ gợi ý hồ sơ thực tế.

KHỞI TẠO:
  1. Khởi tạo Bộ nhớ đệm trải nghiệm Replay Buffer D với dung lượng N_buffer.
  2. Khởi tạo mạng Q-Network Q(s, a; theta) với trọng số ngẫu nhiên theta (Input: 24, Hidden: 128-64, Output: 3).
  3. Khởi tạo mạng Target Network Q(s, a; theta^-) với trọng số ban đầu theta^- = theta.
  4. Đặt epsilon = eps_start.
  5. Đặt biến đếm bước toàn cục step_count = 0.

VÒNG LẶP HUẤN LUYỆN (TRAINING LOOP):
Cho từng episode từ 1 đến M thực hiện:
  1. Khởi tạo Môi trường (Env Reset):
     - Lấy ngẫu nhiên N hồ sơ ứng viên {c_1, c_2, ..., c_N} từ D_cand cho vị trí Job.
     - Khởi tạo ngân sách: k_remain = K (số suất còn), n_remain = N (số hồ sơ còn), t = 0 (chỉ số ứng viên).
     - Trích xuất vector trạng thái ban đầu s_0 in R^24 (16 chiều từ c_0 và 8 chiều hạn ngạch ban đầu).
     - Đặt cờ kết thúc done = False, tổng phần thưởng episode_reward = 0.

  2. Lặp khi chưa kết thúc (While done == False):
     a. Lựa chọn hành động a_t theo chiến lược epsilon-greedy:
        - Sinh số ngẫu nhiên p ~ Uniform(0, 1)
        - Nếu p < epsilon:
            a_t = random_choice({0, 1, 2})       // Khám phá (0: REJECT, 1: ACCEPT, 2: HOLD)
          Ngược lại:
            a_t = argmax_{a in {0, 1, 2}} Q(s_t, a; theta)  // Khai thác tri thức hiện tại

     b. Thực thi hành động a_t trong môi trường (Env Step):
        - Nếu a_t == 1 (ACCEPT):
            k_remain = k_remain - 1
            Ghi nhận ứng viên c_t vào danh sách được chọn
        - n_remain = n_remain - 1
        - t = t + 1
        
        - Tính toán phần thưởng tức thời r_t theo điểm năng lực M(c_t, Job):
            + Nếu a_t == 1 và M >= 75: r_t = +2.0 + ((M - 75) / 25) * 1.0
            + Nếu a_t == 1 và M < 75:  r_t = -1.5 - ((75 - M) / 75) * 1.5
            + Nếu a_t == 1 và k_remain < 0 (vi phạm quota): r_t = -5.0
            + Nếu a_t == 0 và M < 75:  r_t = +1.0
            + Nếu a_t == 0 và M >= 85: r_t = -2.0 - ((M - 85) / 15) * 1.0
            + Nếu a_t == 2:            r_t = -0.2

        - Kiểm tra điều kiện kết thúc episode:
            Nếu t == N HOẶC k_remain == 0:
                done = True
                // Thưởng/Phạt kết thúc (Terminal Reward):
                Nếu k_chosen == K và điểm trung bình M_avg >= 80:
                    r_t = r_t + 5.0
                Ngược lại nếu k_chosen < K:
                    r_t = r_t - 1.0 * (K - k_chosen)

        - Quan sát trạng thái mới s_{t+1}:
            + Nếu done == False: Lấy 16 chiều đặc trưng của ứng viên tiếp theo c_{t+1}.
            + 8 chiều hạn ngạch cập nhật theo công thức: (k_remain/K, n_remain/N, ...).

     c. Lưu trữ chuyển trạng thái vào Replay Buffer:
        Lưu tuple (s_t, a_t, r_t, s_{t+1}, done) vào D.

     d. Cập nhật trọng số mạng nơ-ron (Optimization Step):
        Nếu số mẫu trong D >= |B|:
            - Lấy mẫu ngẫu nhiên mini-batch B = {(s_i, a_i, r_i, s'_i, done_i)}_{i=1}^{|B|} từ D.
            - Tính giá trị mục tiêu cho từng transition i in B:
                y_i = r_i + (1 - done_i) * gamma * max_{a' in {0,1,2}} Q(s'_i, a'; theta^-)
            - Tính hàm mất mát MSE Loss:
                Loss(theta) = (1 / |B|) * sum_{i=1}^{|B|} (y_i - Q(s_i, a_i; theta))^2
            - Thực hiện lan truyền ngược (Backpropagation) và cập nhật theta qua Adam:
                theta = theta - alpha * nabla_theta Loss(theta)

     e. Đồng bộ trọng số mạng Target Network:
        - Cách 1 (Hard Update): Nếu step_count % C == 0 thì theta^- = theta.
        - Cách 2 (Soft Update): theta^- = tau * theta + (1 - tau) * theta^-.

     f. Chuyển trạng thái:
        s_t = s_{t+1}
        episode_reward = episode_reward + r_t
        step_count = step_count + 1

  3. Suy giảm epsilon sau mỗi episode:
     epsilon = max(eps_min, epsilon * d)

TRẢ VỀ: Trọng số tối ưu theta*.
================================================================================================
```

---

## PHẦN 3: THIẾT KẾ MDP CHI TIẾT CHO THUẬT TOÁN 2 (PPO / Q-LEARNING - KIỂM CHỨNG GITHUB NANOBROWSER)

### 1. Bối cảnh nghiệp vụ
Khi HR xem hồ sơ một ứng viên và kích hoạt tính năng **"Kiểm chứng qua Extension"**, Nanobrowser nhận URL GitHub của ứng viên và mở tab trình duyệt.
Agent đóng vai trò là người điều khiển trình duyệt tự động: quan sát trang web hiện tại, quyết định xem nên click vào đâu (Pinned, Repositories tab, đọc bio hay dừng lại vì lỗi 404) để trích xuất đầy đủ bằng chứng xác thực trong thời gian ngắn nhất và số lần click ít nhất.

---

### 2. Đặc tả bộ 5 phần tử MDP

#### (1) Không gian Trạng thái ($S$ - State Space)
Trạng thái trình duyệt $s_t \in \mathbb{R}^{12}$ tại thời điểm quan sát là một vector 12 chiều:

* **Đặc trưng loại trang web hiện tại (5 chiều nhị phân):**
  * $s_1$: `is_profile_page` (Đang ở trang chủ cá nhân của ứng viên).
  * $s_2$: `is_repositories_tab` (Đang ở tab danh sách kho mã nguồn `/repositories`).
  * $s_3$: `is_404_error_page` (Trang báo lỗi 404 Not Found hoặc tài khoản không tồn tại).
  * $s_4$: `has_pinned_section` (Trang hiện tại có hiển thị khối Pinned Repositories hay không).
  * $s_5$: `has_readme_section` (Trang hiện tại có khối README cá nhân giới thiệu bản thân hay không).

* **Đặc trưng tiến trình trích xuất thông tin (5 chiều nhị phân):**
  * $s_6$: `has_extracted_name` (Đã lấy được họ tên hiển thị chưa).
  * $s_7$: `has_extracted_stars` (Đã tính được tổng số sao GitHub chưa).
  * $s_8$: `has_extracted_pinned_repos` (Đã cào đủ danh sách dự án ghim chưa).
  * $s_9$: `has_extracted_school_age` (Đã lấy được thông tin trường học hoặc tính được tuổi chưa).
  * $s_{10}$: `has_extracted_top_languages` (Đã xác định được danh sách ngôn ngữ lập trình chủ đạo chưa).

* **Đặc trưng chi phí và giới hạn bước duyệt (2 chiều liên tục):**
  * $s_{11}$: Tỷ lệ số bước đã duyệt: $\frac{t}{T_{max}}$ (với số bước tối đa $T_{max} = 10$).
  * $s_{12}$: Tỷ lệ hoàn thành dữ liệu kiểm chứng: $\frac{\text{số trường đã cào được}}{5}$.

---

#### (2) Không gian Hành động ($A$ - Action Space)
Agent có $5$ hành động điều khiển cấp cao:

$$A = \{0, 1, 2, 3, 4\}$$

* $a = 0$ (**EXTRACT_PINNED**): Quét và bóc tách dữ liệu từ khối Pinned Repositories (tên dự án, số sao, ngôn ngữ, URL).
* $a = 1$ (**SWITCH_TAB_REPOS**): Điều hướng trình duyệt chuyển sang tab `Repositories` để lấy thông tin các repo có nhiều sao nhất (sử dụng khi ứng viên không ghim dự án ở trang chủ).
* $a = 2$ (**READ_BIO_README**): Cuộn chuột quét khối thông tin Bio bên trái hoặc file README cá nhân để tìm trường học, tuổi và thông tin liên hệ.
* $a = 3$ (**ABORT_ON_404**): Phát hiện trang 404, lập tức ra lệnh dừng cào, ghi nhận `isVerified = false` và kết thúc sớm.
* $a = 4$ (**FINISH_AND_SUBMIT**): Đóng gói toàn bộ dữ liệu kiểm chứng thành định dạng JSON chuẩn và gửi API `POST /verification/candidate` về Backend.

---

#### (3) Xác suất Chuyển trạng thái ($P(s' \mid s, a)$)
Môi trường chuyển trạng thái mang tính ngẫu nhiên nhẹ (Stochastic) do độ trễ tải trang web hoặc cấu trúc DOM có sự khác biệt giữa các tài khoản GitHub:
* Nếu thực hiện `SWITCH_TAB_REPOS`, với xác suất $95\%$ trang chuyển sang tab Repositories, $5\%$ trang bị mạng lag hoặc timeout.
* Nếu thực hiện `EXTRACT_PINNED`, trạng thái cập nhật $has\_extracted\_pinned\_repos = 1$ nếu khối Pinned tồn tại.

---

#### (4) Hàm Phần thưởng ($R(s, a)$ - Reward Function)
Hàm phần thưởng được thiết kế nhằm mục tiêu: Khuyến khích cào đúng, cào đủ, phạt các bước đi lòng vòng, và thưởng khi phát hiện link lỗi để dừng kịp thời.

* **Phạt chi phí bước đi (Step Penalty):**
  Mỗi bước hành động bất kỳ đều bị trừ điểm:
  $$r_{step} = -0.5$$
  Quy tắc này ép Agent phải tìm đường đi ngắn nhất, hoàn thành kiểm chứng chỉ trong 2-3 bước thay vì bấm thừa thãi.

* **Thưởng trích xuất dữ liệu thành công:**
  * Bấm `EXTRACT_PINNED` thành công: $+5.0$.
  * Bấm `READ_BIO_README` trích xuất được trường học/tuổi: $+3.0$.
  * Bấm `SWITCH_TAB_REPOS` hợp lý (khi trang chủ không có pinned): $+2.0$.

* **Phạt hành động sai ngữ cảnh:**
  * Bấm `EXTRACT_PINNED` khi trang không có khối Pinned: Phạt $-2.0$.
  * Bấm lại hành động đã trích xuất rồi (lặp lại thao tác): Phạt $-3.0$.
  * Đang ở trang 404 mà vẫn cố tình bấm cào dữ liệu: Phạt $-4.0$.

* **Thưởng xử lý lỗi 404 thông minh:**
  * Khi trang web là 404, nếu Agent chọn ngay hành động $a = 3$ (**ABORT_ON_404**): Thưởng lớn $+5.0$ và kết thúc episode ngay lập tức (tiết kiệm thời gian và tài nguyên mạng).

* **Phần thưởng hoàn tất (Terminal Reward):**
  * Khi chọn $a = 4$ (**FINISH_AND_SUBMIT**):
    * Nếu đã cào đủ cả 5 trường dữ liệu quan trọng: Thưởng lớn $+10.0$.
    * Nếu bấm kết thúc quá vội vàng khi chưa cào đủ thông tin: Phạt $-5.0$.

---

#### (5) Hệ số Chiết khấu ($\gamma$)
Chọn **$\gamma = 0.99$**.
Trong bài toán điều hướng web, phần thưởng lớn nhất ($+10.0$) nằm ở bước cuối cùng (`FINISH_AND_SUBMIT`). Do đó hệ số $\gamma$ cần tiệm cận $1.0$ để Agent nhận thức được giá trị to lớn của hành động kết thúc thành công và kiên trì thực hiện các bước chuẩn bị trước đó.

---

### 3. Cơ chế tối ưu hóa chính sách PPO (Proximal Policy Optimization) cho Agent Kiểm Chứng

Khác với MDP 1 dùng mô hình Value-based (DQN), bài toán điều hướng web tự động trong MDP 2 đối mặt với môi trường bất định và cấu trúc DOM đa dạng giữa các trang GitHub. Do đó, mô hình sử dụng thuật toán **PPO (Proximal Policy Optimization)** theo kiến trúc **Actor-Critic (Policy-based)** để học một chính sách ngẫu nhiên (Stochastic Policy) tối ưu.

#### (1) Kiến trúc mạng kép Actor - Critic
Agent kiểm chứng sử dụng hai mạng nơ-ron (hoặc một mạng backbone chia sẻ tham số):
* **Mạng Actor ($\pi_\theta(a \mid s)$):** Nhận vector trạng thái 12 chiều $s_t$, đi qua 2 tầng ẩn (Dense 64 $\to$ Dense 32, kích hoạt ReLU) và xuất ra phân phối xác suất trên 5 hành động rời rạc thông qua hàm Softmax:
  $$\pi_\theta(a \mid s) = \frac{e^{z_a}}{\sum_{j=0}^{4} e^{z_j}} \quad \text{với } a \in \{0, 1, 2, 3, 4\}$$
* **Mạng Critic ($V_\phi(s)$):** Cùng kiến trúc tầng ẩn, xuất ra một giá trị vô hướng ước lượng giá trị kỳ vọng dài hạn của trạng thái $s_t$.

#### (2) Tỷ lệ xác suất chính sách ($r_t(\theta)$)
PPO đánh giá mức độ thay đổi giữa chính sách mới $\pi_\theta$ và chính sách cũ $\pi_{\theta_{old}}$ thông qua tỷ lệ xác suất (Probability Ratio):
$$r_t(\theta) = \frac{\pi_\theta(a_t \mid s_t)}{\pi_{\theta_{old}}(a_t \mid s_t)}$$

#### (3) Ước lượng Lợi thế tổng quát (Generalized Advantage Estimation - GAE)
Hàm lợi thế $\hat{A}_t$ đo lường hành động $a_t$ tốt hơn bao nhiêu so với hành động trung bình tại trạng thái $s_t$. Sử dụng GAE với $\gamma = 0.99$ và $\lambda = 0.95$:
$$\delta_t^V = R_{t+1} + \gamma V_\phi(S_{t+1}) - V_\phi(S_t)$$
$$\hat{A}_t^{GAE} = \sum_{l=0}^{\infty} (\gamma \lambda)^l \delta_{t+l}^V$$
Cơ chế này giúp giảm phương sai của hàm lợi thế trong các chuỗi thao tác web ngắn, đồng thời truyền tín hiệu phần thưởng đích $+10.0$ ngược về các bước trích xuất ban đầu một cách mượt mà.

#### (4) Hàm mục tiêu PPO Clipped Surrogate Objective ($L^{CLIP}$)
Để ngăn chặn việc cập nhật trọng số quá lớn làm sụp đổ chính sách khi gặp các trang web có cấu trúc DOM dị biệt hoặc độ trễ mạng cao, PPO giới hạn tỷ lệ $r_t(\theta)$ trong khoảng $[1 - \epsilon, 1 + \epsilon]$ (với $\epsilon = 0.2$):
$$L^{CLIP}(\theta) = \hat{\mathbb{E}}_t \left[ \min \left( r_t(\theta) \hat{A}_t, \, \text{clip}(r_t(\theta), 1 - \epsilon, 1 + \epsilon) \hat{A}_t \right) \right]$$

#### (5) Hàm mất mát tổng thể khi huấn luyện ($L^{PPO}$)
Hàm mất mát kết hợp cả 3 thành phần: tối đa hóa mục tiêu chính sách, cực tiểu hóa sai số dự đoán giá trị của Critic và tối đa hóa Entropy để khuyến khích Agent tiếp tục khám phá:
$$L^{PPO}(\theta, \phi) = - L^{CLIP}(\theta) + c_1 L^{VF}(\phi) - c_2 S[\pi_\theta](s_t)$$
Trong đó:
* $L^{VF}(\phi) = \frac{1}{|B|} \sum_{t} \left( V_\phi(s_t) - V_t^{target} \right)^2$: Sai số bình phương giữa giá trị dự đoán của Critic và lợi nhuận thực tế.
* $S[\pi_\theta](s_t) = - \sum_{a} \pi_\theta(a \mid s_t) \log \pi_\theta(a \mid s_t)$: Độ hỗn loạn Entropy của chính sách (ngăn Agent hội tụ sớm vào các chính sách cục bộ nghèo nàn).
* Các hệ số trọng số chuẩn: $c_1 = 0.5$, $c_2 = 0.01$.

#### (6) Kỹ thuật Action Masking trên cây DOM
Để tăng tốc độ huấn luyện và loại bỏ các thao tác vô nghĩa, mạng Actor áp dụng cơ chế **Action Masking**:
* Nếu trang báo lỗi 404 ($s_3 = 1$): Các hành động cào dữ liệu ($0, 1, 2, 4$) bị gán logit $= -\infty$, buộc Agent chỉ chọn hành động $a = 3$ (`ABORT_ON_404`).
* Nếu đã cào xong khối Pinned ($s_8 = 1$): Hành động $a = 0$ bị khóa để tránh bị trừ điểm phạt lặp thao tác ($-3.0$).

---

## PHẦN 4: SO SÁNH ĐỐI CHIẾU HAI MÔ HÌNH MDP TRONG DỰ ÁN

| Tiêu chí | MDP 1: Sàng Lọc CV (DQN) | MDP 2: Kiểm Chứng GitHub (PPO) |
| :--- | :--- | :--- |
| **Vị trí thực thi** | Backend Express (`job.controller.ts`) | Chrome Extension Nanobrowser (`background/index.ts`) |
| **Bản chất bài toán** | Ra quyết định chọn lọc hồ sơ có ràng buộc hạn ngạch ngân sách | Điều hướng tương tác web tự động để thu thập thông tin minh chứng |
| **Không gian Trạng thái ($S$)** | **Vector 24 chiều liên tục:**<br>• 6 chiều tương thích CV - Job<br>• 10 chiều hồ sơ năng lực & uy tín<br>• 8 chiều hạn ngạch & tiến độ | **Vector 12 chiều kết hợp:**<br>• 5 cờ nhị phân nhận diện loại trang DOM<br>• 5 cờ nhị phân tiến độ thông tin đã cào<br>• 2 chiều liên tục (bước đi & tỷ lệ hoàn tất) |
| **Không gian Hành động ($A$)** | **3 hành động rời rạc:**<br>• `0: REJECT` (Loại bỏ)<br>• `1: ACCEPT` (Đồng ý phỏng vấn)<br>• `2: HOLD` (Tạm giữ dự phòng) | **5 hành động điều hướng:**<br>• `0: EXTRACT_PINNED` (Cào repo ghim)<br>• `1: SWITCH_TAB_REPOS` (Chuyển tab Repo)<br>• `2: READ_BIO_README` (Đọc bio/tuổi/trường)<br>• `3: ABORT_ON_404` (Dừng sớm khi link lỗi)<br>• `4: FINISH_AND_SUBMIT` (Đóng gói gửi API) |
| **Trường phái thuật toán** | **Value-based** (Học hàm giá trị hành động $Q(s, a)$) | **Policy-based / Actor-Critic** (Học trực tiếp chính sách $\pi(a \mid s)$ và giá trị $V(s)$) |
| **Chiến lược hành động** | Chính sách tất định suy giảm khám phá ($\epsilon$-greedy decay) | Chính sách ngẫu nhiên theo phân phối xác suất Softmax Categorical |
| **Phương thức học tập** | **Off-Policy:** Lấy mẫu ngẫu nhiên từ Replay Buffer | **On-Policy:** Thu thập quỹ đạo (Trajectories) theo chính sách hiện hành |
| **Hàm mục tiêu / Mất mát** | Sai số Bellman Optimality MSE Loss kết hợp Target Network | Clipped Surrogate Objective ($L^{CLIP}$) kết hợp GAE và Entropy Bonus |
| **Đặc điểm phần thưởng** | Phụ thuộc vào chất lượng ứng viên so với chuẩn năng lực và hạn ngạch | Phụ thuộc vào tốc độ hoàn thành, tính đầy đủ dữ liệu và xử lý link lỗi |
| **Tính chất chuyển trạng thái** | Tất định từng phần (Partially Deterministic) theo danh sách ứng viên | Ngẫu nhiên (Stochastic) phụ thuộc cấu trúc web và độ trễ mạng |
| **Hệ số chiết khấu $\gamma$** | $\gamma = 0.95$ (Cân bằng giữa hiện tại và tương lai) | $\gamma = 0.99$ (Hướng tới phần thưởng hoàn tất $+10.0$ ở cuối chuỗi) |
| **Lý do lựa chọn thuật toán** | Không gian hành động nhỏ (3), tập trung tối ưu giá trị kỳ vọng tích lũy | Chống kẹt vòng lặp DOM, hội tụ ổn định trên môi trường web bất định |

> [!NOTE]
> **Ghi chú về phương án Q-Learning dự phòng cho MDP 2:**
> Trong tài liệu và kế hoạch triển khai, mô hình PPO là thuật toán học tăng cường chủ đạo phục vụ huấn luyện và tối ưu hóa chính sách điều hướng. Tuy nhiên, để đáp ứng tính năng chạy siêu nhẹ (Lightweight) trong môi trường Chrome Extension không có kết nối GPU, nhóm cung cấp thêm phương án xuất chính sách PPO thành bảng tra cứu nhanh (Lookup Table) hoặc mạng vi nơ-ron (Micro-DQN/Q-Table) để Extension có thể suy luận trực tiếp dưới 2 mili-giây.

---

## PHẦN 5: PHÂN CHIA NGHIỆP VỤ HIỆN THỰC HÓA MDP CHO 5 THÀNH VIÊN (BẰNG TYPESCRIPT)

Để chuyển đổi 2 mô hình toán học MDP trên thành hệ thống phần mềm hoạt động thực tế bằng **TypeScript**, công việc được phân bổ chi tiết cho 5 thành viên theo từng thành phần cốt lõi của MDP:

---

### 1. THÀNH VIÊN 1: NGUYỄN MINH ĐỨC
* **Trọng tâm MDP:** Kiến trúc sư Toán học & Xác thực Ràng buộc Lý thuyết MDP
* **Nghiệp vụ chi tiết:**
  * **Tại MDP 1 (DQN):** 
    * Thiết lập và chuẩn hóa toàn bộ công thức toán học cho bộ 5 phần tử $(S, A, P, R, \gamma)$.
    * Chứng minh toán học rằng không gian trạng thái 24 chiều thỏa mãn tính chất Markov (không phụ thuộc lịch sử duyệt trước đó).
    * Thiết lập phương trình Bellman Optimality và chặn trên/dưới của hàm phần thưởng để đảm bảo hàm mất mát không bị phân kỳ (Divergence).
  * **Tại MDP 2 (Nanobrowser):** 
    * Xây dựng hàm phần thưởng đa mục tiêu, tính toán mức phạt bước đi ($-0.5$) cân bằng hoàn hảo với phần thưởng hoàn thành ($+10.0$) để ngăn Agent đi vòng lặp vô tận.
    * Thiết lập công thức hàm mục tiêu PPO Clipped Objective cho không gian hành động kiểm chứng.
* **Sản phẩm bàn giao:** Tài liệu đặc tả toán học chi tiết, chứng minh tính chất Markov và công thức tính hàm giá trị $Q^*(s, a)$ và $V(s)$.

---

### 2. THÀNH VIÊN 2: PHÙNG VĂN DUY
* **Trọng tâm MDP:** Hiện thực hóa Không gian Trạng thái (State Space $S$) bằng TypeScript
* **Nghiệp vụ chi tiết:**
  * **Tại MDP 1 (DQN):** 
    * Lập trình module TypeScript đọc dữ liệu từ MongoDB (`candidate.model.ts`, `job.model.ts`).
    * Viết các hàm toán học trích xuất và chuẩn hóa 24 chiều đặc trưng: tính toán tỷ lệ trùng khớp từ khóa kỹ năng, chuẩn hóa số năm kinh nghiệm, điểm GPA, sao GitHub, và các biến đếm hạn ngạch ($k_{remain}/K, n_{remain}/N$).
    * Đảm bảo vector đầu ra có kiểu dữ liệu `number[]` chuẩn độ dài 24, không chứa giá trị `NaN` hay `undefined`.
  * **Tại MDP 2 (Nanobrowser):** 
    * Lập trình module TypeScript phân tích cây DOM của trang GitHub, chuyển đổi thành State Vector 12 chiều: mã hóa 5 cờ nhận diện loại trang (Profile, Repos, 404), 5 cờ tiến độ dữ liệu đã cào và 2 chiều đo lường bước đi.
* **Sản phẩm bàn giao:** `src/modules/client/infrastructure/rl/features/dqnFeaturePipeline.ts` và `browserStateExtractor.ts`.

---

### 3. THÀNH VIÊN 3: PHẠM VĂN HƯNG
* **Trọng tâm MDP:** Hiện thực hóa Không gian Hành động ($A$) & Hàm Mục tiêu Bellman bằng TypeScript
* **Nghiệp vụ chi tiết:**
  * **Tại MDP 1 (DQN):** 
    * Định nghĩa kiểu dữ liệu `enum CandidateAction { REJECT = 0, ACCEPT = 1, HOLD = 2 }`.
    * Lập trình kiến trúc mạng nơ-ron xấp xỉ hàm giá trị hành động $Q(s, a; \theta)$ bằng TypeScript / TensorFlow.js (`@tensorflow/tfjs-node`).
    * Hiện thực hóa công thức sai số Bellman (Bellman Loss) trong TypeScript và cơ chế tối ưu hóa trọng số qua Gradient Descent.
    * Lập trình chiến lược cân bằng Khám phá - Khai thác ($\epsilon$-greedy decay) dựa trên giá trị $Q(s, a)$.
  * **Tại MDP 2 (Nanobrowser):** 
    * Định nghĩa `enum VerificationAction` cho 5 hành động điều khiển trình duyệt.
    * Lập trình mạng Actor-Critic xuất phân phối xác suất hành động $\pi(a \mid s)$ và hàm giá trị trạng thái $V(s)$.
* **Sản phẩm bàn giao:** `src/modules/client/infrastructure/rl/algorithms/dqnAgent.ts`, `replayBuffer.ts` và `ppoAgent.ts`.

---

### 4. THÀNH VIÊN 4: LÊ QUÝ DƯƠNG
* **Trọng tâm MDP:** Lập trình Môi trường Mô phỏng Chuyển trạng thái ($P$) & Hàm Phần thưởng ($R$) bằng TypeScript
* **Nghiệp vụ chi tiết:**
  * **Tại MDP 1 (DQN):** 
    * Xây dựng lớp môi trường `CandidateScreeningEnv` theo chuẩn TypeScript Gym-style (OOP).
    * Hiện thực hóa phương thức `reset()` (khởi tạo đợt tuyển và ngân sách) và phương thức `step(action)`.
    * Lập trình logic tính toán hàm phần thưởng $R(s, a)$ chính xác theo từng trường hợp (thưởng chọn đúng, phạt chọn sai, phạt vi phạm hạn ngạch, thưởng hoàn thành episode), cập nhật trạng thái mới $s_{t+1}$ và cờ kết thúc `done`.
  * **Tại MDP 2 (Nanobrowser):** 
    * Xây dựng lớp môi trường mô phỏng `GitHubVerificationEnv` bằng TypeScript.
    * Lập trình cơ chế chuyển trạng thái mô phỏng cấu trúc web GitHub (có Pinned, không có Pinned, lỗi 404), trả về Reward tương ứng theo hành động điều hướng của Agent.
* **Sản phẩm bàn giao:** `src/modules/client/infrastructure/rl/envs/candidateScreeningEnv.ts` và `githubMockEnv.ts`.

---

### 5. THÀNH VIÊN 5: TRƯƠNG TUẦN HẢI
* **Trọng tâm MDP:** Đo đạc Tính hội tụ MDP, Thực nghiệm Benchmark & Tích hợp Hệ thống
* **Nghiệp vụ chi tiết:**
  * **Tại MDP 1 (DQN):** 
    * Theo dõi sự hội tụ của hàm giá trị $Q(s, a)$ và tổng phần thưởng tích lũy $G_t$ qua các episode huấn luyện; vẽ biểu đồ chứng minh MDP đạt trạng thái cân bằng tối ưu.
    * Thực hiện bài toán đối chứng: So sánh chính sách tối ưu của MDP với chính sách tham lam (Greedy Policy) và ngẫu nhiên (Random Policy) để chứng minh tính ưu việt của mô hình.
    * Đóng gói logic suy luận của MDP thành Express API Controller tại `src/modules/client/infrastructure/rl/rl.controller.ts`.
  * **Tại MDP 2 (Nanobrowser):** 
    * Đo đạc số bước di chuyển trung bình trong không gian MDP của Nanobrowser, kiểm tra độ ổn định của chính sách khi gặp link lỗi 404.
    * Tích hợp logic ra quyết định của MDP vào background service worker của Chrome Extension Nanobrowser.
* **Sản phẩm bàn giao:** `rl.controller.ts` (Express Controller), file đo đạc thực nghiệm và biểu đồ hội tụ của MDP.

---

## PHẦN 6: KẾT LUẬN

Việc phân chia nghiệp vụ cụ thể cho 5 thành viên theo 5 thành phần cốt lõi của **Quy trình Quyết định Markov (MDP)** mang lại các giá trị then chốt:
1. **Phân định trách nhiệm rõ ràng:** Mỗi thành viên phụ trách một mắt xích toán học và lập trình cụ thể của MDP, không bị chồng chéo công việc.
2. **Thống nhất trên nền tảng TypeScript:** Toàn bộ không gian State, Action, Transition và Reward đều được viết bằng TypeScript, tương thích hoàn hảo với Backend Express và Chrome Extension.
3. **Cơ sở bảo vệ vững chắc:** Khi giảng viên đặt câu hỏi về bất kỳ thành phần nào của MDP (từ lý thuyết toán học, cách vector hóa dữ liệu, kiến trúc mạng nơ-ron, môi trường giả lập đến kết quả thực nghiệm), từng thành viên đều có phần việc cụ thể để trả lời đầy đủ, tự tin và thuyết phục.
