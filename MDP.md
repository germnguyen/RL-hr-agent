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

---

#### (2) Không gian Hành động ($A$ - Action Space)
Agent có $3$ hành động rời rạc:

$$A = \{0, 1, 2\}$$

* $a = 0$ (**REJECT - Loại bỏ**): Từ chối hồ sơ ứng viên này, không mời phỏng vấn. Số suất phỏng vấn $k_{remain}$ không đổi.
* $a = 1$ (**ACCEPT - Chấp nhận**): Đồng ý đưa ứng viên này vào danh sách phỏng vấn. Số suất phỏng vấn giảm đi 1: $k_{remain} \leftarrow k_{remain} - 1$.
* $a = 2$ (**HOLD - Tạm giữ**): Đưa hồ sơ vào danh sách dự phòng để xem xét lại nếu cuối đợt tuyển vẫn chưa đủ người.

---

#### (3) Xác suất Chuyển trạng thái ($P(s' \mid s, a)$)
Trong bài toán này, môi trường chuyển trạng thái theo quy luật tất định từng phần (Partially Deterministic):
* Khi Agent thực hiện một hành động tại thời điểm $t$, con trỏ ứng viên chuyển sang người kế tiếp $t+1$.
* Đặc trưng của ứng viên tiếp theo được lấy từ tập dữ liệu.
* Các biến đếm ngân sách $k_{remain}$, $n_{remain}$ và các đặc trưng ngữ cảnh cập nhật theo quy tắc số học.

---

#### (4) Hàm Phần thưởng ($R(s, a)$ - Reward Function)
Hàm phần thưởng được thiết kế nhằm mục tiêu: Khuyến khích chọn người giỏi, phạt khi chọn người kém, phạt nặng khi bỏ lỡ người xuất sắc và phạt khi vi phạm hạn ngạch.

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

### 3. Phương trình tối ưu Bellman cho DQN

Mạng nơ-ron Q-Network xấp xỉ hàm giá trị $Q(s, a; \theta)$. Mục tiêu của quá trình huấn luyện là tìm bộ trọng số $\theta^*$ thỏa mãn phương trình tối ưu Bellman:

$$Q^*(s, a) = R(s, a) + \gamma \max_{a' \in A} Q^*(s', a')$$

Hàm mất mát tại mỗi bước huấn luyện:

$$L(\theta) = \frac{1}{|B|} \sum_{(s, a, r, s', done) \in B} \left( y^{DQN} - Q(s, a; \theta) \right)^2$$

Trong đó giá trị mục tiêu $y^{DQN}$ được tính qua mạng Target Network có trọng số $\theta^-$:

$$y^{DQN} = r + (1 - done) \cdot \gamma \max_{a'} Q(s', a'; \theta^-)$$

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

## PHẦN 4: SO SÁNH ĐỐI CHIẾU HAI MÔ HÌNH MDP TRONG DỰ ÁN

| Tiêu chí | MDP 1: Sàng Lọc CV (DQN) | MDP 2: Kiểm Chứng GitHub (PPO/Q-Learn) |
| :--- | :--- | :--- |
| **Vị trí thực thi** | Backend Express / Microservice Python | Chrome Extension Nanobrowser |
| **Bản chất bài toán** | Ra quyết định chọn lọc hồ sơ có ràng buộc hạn ngạch ngân sách | Điều hướng tương tác web tự động để thu thập thông tin |
| **Không gian Trạng thái ($S$)** | Vector 24 chiều liên tục (CV, Job, Hạn ngạch tuyển dụng) | Vector 12 chiều kết hợp nhị phân và liên tục (DOM, Tiến độ cào) |
| **Không gian Hành động ($A$)** | 3 hành động: REJECT, ACCEPT, HOLD | 5 hành động: EXTRACT, SWITCH TAB, READ BIO, ABORT 404, SUBMIT |
| **Đặc điểm phần thưởng** | Phụ thuộc vào chất lượng ứng viên so với chuẩn năng lực | Phụ thuộc vào tốc độ hoàn thành và tính đầy đủ của dữ liệu |
| **Tính chất chuyển trạng thái** | Tất định theo thứ tự danh sách hồ sơ | Ngẫu nhiên theo cấu trúc trang web và tốc độ tải mạng |
| **Hệ số chiết khấu $\gamma$** | $\gamma = 0.95$ (Cân bằng giữa hiện tại và tương lai) | $\gamma = 0.99$ (Hướng tới phần thưởng hoàn tất ở cuối chuỗi) |
| **Thuật toán tối ưu tương ứng** | Deep Q-Network (DQN) | Proximal Policy Optimization (PPO) hoặc Q-Learning |

---

## PHẦN 5: KẾT LUẬN

Việc xây dựng thành công 2 mô hình toán học **MDP** ở trên là bước đi có ý nghĩa quyết định đối với đồ án:
1. Đảm bảo đồ án tuân thủ nghiêm ngặt chuẩn mực lý thuyết của môn học **Học Tăng Cường (Reinforcement Learning)**.
2. Cung cấp bộ thông số toán học chuẩn xác để Thành viên 2 lập trình trích xuất vector đặc trưng, Thành viên 3 cài đặt hàm Loss và mạng nơ-ron, Thành viên 4 xây dựng môi trường mô phỏng Gymnasium.
3. Giúp nhóm hoàn toàn tự tin khi bảo vệ trước hội đồng giảng viên với cơ sở toán học tường minh, thuyết phục.
