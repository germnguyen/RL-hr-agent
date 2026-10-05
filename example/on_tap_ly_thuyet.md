# TÀI LIỆU ÔN TẬP BÀI KIỂM TRA LÝ THUYẾT HỌC TĂNG CƯỜNG (HK7)

* Môn học: Học Tăng Cường (Reinforcement Learning)
* Mục đích: Tài liệu ôn thi viết tay ra giấy (không sử dụng laptop/internet trong giờ kiểm tra)
* Yêu cầu trình bày khi làm bài: Trình bày mạch lạc, rõ ràng từng định nghĩa, ghi chính xác công thức toán học, giải thích rõ các ký hiệu và nêu được ý nghĩa bản chất.

---

## MỤC LỤC ÔN TẬP
1. Phần 1: Định nghĩa Học tăng cường, các thành phần chính và ý nghĩa
2. Phần 2: Các phương trình Bellman (Phương trình kỳ vọng và Phương trình tối ưu)
3. Phần 3: Ý tưởng và phạm vi áp dụng của Quy hoạch động (DP) và Monte Carlo (MC)
4. Phần 4: Phân tích chi tiết thuật toán tiêu biểu của DP (Policy Iteration) và MC (First-Visit MC)
5. Phần 5: Bảng tóm tắt công thức và các câu hỏi lý thuyết ngắn thường gặp

---

## PHẦN 1: ĐỊNH NGHĨA HỌC TĂNG CƯỜNG, CÁC THÀNH PHẦN CHÍNH VÀ Ý NGHĨA

### 1. Định nghĩa Học tăng cường (Reinforcement Learning - RL)
Học tăng cường là một nhánh của Học máy (Machine Learning), nghiên cứu cách một **tác tử (Agent)** tự động học cách đưa ra chuỗi các **hành động (Actions)** tối ưu thông qua quá trình **tương tác thử và sai (Trial and Error)** với một **môi trường (Environment)** nhằm **tối đa hóa tổng phần thưởng tích lũy (Cumulative Reward)** trong dài hạn.

#### Phân biệt Học tăng cường với các nhánh khác của Học máy:
* **Học có giám sát (Supervised Learning):** Học từ tập dữ liệu có nhãn đúng chuẩn (Ground-truth labels) do con người cung cấp. Mô hình đóng vai trò là học sinh có giáo viên sửa sai từng bước.
* **Học không giám sát (Unsupervised Learning):** Học cách tìm ra các cấu trúc, quy luật hoặc phân cụm ẩn trong dữ liệu không có nhãn.
* **Học tăng cường (Reinforcement Learning):** Không có nhãn đúng/sai cho từng bước đi, cũng không có người hướng dẫn chi tiết. Tác tử chỉ nhận được tín hiệu phản hồi dạng số học (Reward) cho biết hành động vừa thực hiện là tốt hay xấu, từ đó tự điều chỉnh chiến lược để hướng tới mục tiêu dài hạn.

---

### 2. Các thành phần chính trong hệ thống Học tăng cường và ý nghĩa

Một bài toán Học tăng cường tiêu chuẩn được vận hành bởi sự tương tác liên tục giữa hai thực thể chính: **Agent** và **Environment** thông qua một vòng lặp tuần tự (Agent-Environment Loop).

```text
               +----------------------------------+
               |           TÁC TỬ (AGENT)         |
               +----------------------------------+
                     |                     ^
             Hành động (A_t)       Phần thưởng (R_{t+1})
                     |             Trạng thái mới (S_{t+1})
                     v                     |
               +----------------------------------+
               |        MÔI TRƯỜNG (ENVIRONMENT) |
               +----------------------------------+
```

#### Chi tiết các thành phần:

1. **Tác tử (Agent):**
   * *Định nghĩa:* Là thực thể ra quyết định, học hỏi và thực thi các hành động trong hệ thống (ví dụ: robot, phần mềm chơi cờ, thuật toán lọc CV).
   * *Ý nghĩa:* Trung tâm điều khiển toàn bộ quá trình học.

2. **Môi trường (Environment):**
   * *Định nghĩa:* Toàn bộ thế giới bên ngoài mà Agent tương tác. Môi trường tiếp nhận hành động của Agent, biến đổi trạng thái nội tại và phản hồi lại tín hiệu trạng thái cùng phần thưởng.
   * *Ý nghĩa:* Nơi diễn ra các ràng buộc vật lý, quy tắc nghiệp vụ và cơ chế thưởng phạt.

3. **Trạng thái (State - $S_t \in \mathcal{S}$):**
   * *Định nghĩa:* Bản tóm tắt đầy đủ thông tin về môi trường tại thời điểm $t$.
   * *Ý nghĩa:* Cung cấp cơ sở dữ liệu để Agent nhận biết mình đang ở đâu và đưa ra quyết định tiếp theo.

4. **Hành động (Action - $A_t \in \mathcal{A}(s)$):**
   * *Định nghĩa:* Quyết định hoặc thao tác mà Agent thực hiện tại trạng thái $S_t$.
   * *Ý nghĩa:* Cách duy nhất để Agent can thiệp và làm thay đổi môi trường. Không gian hành động có thể là rời rạc (Discrete: rẽ trái/phải, duyệt/loại) hoặc liên tục (Continuous: góc lái xe, lực tác động).

5. **Phần thưởng (Reward - $R_{t+1} \in \mathbb{R}$):**
   * *Định nghĩa:* Giá trị số học vô hướng (Scalar Feedback) tức thời mà môi trường trả về sau khi Agent thực hiện hành động $A_t$ tại trạng thái $S_t$.
   * *Ý nghĩa:* Thước đo định hướng hành vi của Agent. Reward dương khuyến khích hành vi tốt, Reward âm phạt hành vi xấu. Mục tiêu của Agent là tối đa hóa tổng phần thưởng lâu dài chứ không phải chỉ tối đa hóa phần thưởng ngay trước mắt.

6. **Lợi nhuận tích lũy (Return - $G_t$):**
   * *Định nghĩa:* Tổng phần thưởng có chiết khấu nhận được trong tương lai kể từ thời điểm $t$:
     $$G_t = R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \dots = \sum_{k=0}^{\infty} \gamma^k R_{t+k+1}$$
   * *Ý nghĩa:* Mục tiêu toán học thực sự mà Agent cần tối đa hóa.

7. **Hệ số chiết khấu (Discount Factor - $\gamma \in [0, 1]$):**
   * *Định nghĩa:* Tham số thể hiện mức độ quan trọng của các phần thưởng tương lai so với phần thưởng tức thời.
   * *Ý nghĩa:*
     * Nếu $\gamma = 0$: Agent hoàn toàn thiển cận (Myopic), chỉ quan tâm đến phần thưởng ngay bước tiếp theo $R_{t+1}$.
     * Nếu $\gamma \to 1$: Agent có tầm nhìn xa (Far-sighted), coi trọng các phần thưởng tích lũy lâu dài trong tương lai.
     * Về mặt toán học: $\gamma < 1$ giúp chuỗi tổng phần thưởng vô hạn hội tụ về một giá trị hữu hạn đối với các bài toán liên tục vô tận (Continuing tasks).

8. **Chính sách (Policy - $\pi$):**
   * *Định nghĩa:* Chiến lược hoặc quy tắc ra quyết định của Agent, ánh xạ từ trạng thái sang hành động.
     * Chính sách xác định (Deterministic Policy): $a = \pi(s)$
     * Chính sách ngẫu nhiên (Stochastic Policy): $\pi(a \mid s) = P(A_t = a \mid S_t = s)$
   * *Ý nghĩa:* Đại diện cho "trí tuệ" hoặc "hành vi" của Agent. Toàn bộ quá trình huấn luyện RL nhằm mục đích tìm ra chính sách tối ưu $\pi^*$.

9. **Hàm giá trị (Value Function):**
   * *Hàm giá trị trạng thái (State-Value Function - $V^\pi(s)$):* Kỳ vọng lợi nhuận nhận được nếu Agent bắt đầu từ trạng thái $s$ và tuân theo chính sách $\pi$:
     $$V^\pi(s) = \mathbb{E}_\pi [G_t \mid S_t = s]$$
   * *Hàm giá trị hành động (Action-Value Function / Q-function - $Q^\pi(s, a)$):* Kỳ vọng lợi nhuận nhận được nếu Agent bắt đầu từ trạng thái $s$, thực hiện hành động $a$, và sau đó tuân theo chính sách $\pi$:
     $$Q^\pi(s, a) = \mathbb{E}_\pi [G_t \mid S_t = s, A_t = a]$$
   * *Ý nghĩa:* Cho Agent biết một trạng thái hoặc một hành động cụ thể mang lại giá trị dài hạn tốt đến mức nào.

10. **Mô hình của môi trường (Model of the Environment - tùy chọn):**
    * *Định nghĩa:* Mô phỏng hành vi của môi trường, gồm 2 thành phần:
      * Hàm xác suất chuyển trạng thái: $P(s' \mid s, a)$
      * Hàm kỳ vọng phần thưởng: $R(s, a)$
    * *Ý nghĩa:* Phân chia RL thành hai trường phái lớn: **Model-based** (có mô hình, dùng để lập kế hoạch trước) và **Model-free** (không cần mô hình, học trực tiếp qua trải nghiệm thực tế).

---

## PHẦN 2: CÁC PHƯƠNG TRÌNH BELLMAN

### 1. Bản chất và Ý nghĩa cốt lõi của Phương trình Bellman
Được phát minh bởi nhà toán học Richard Bellman (1957), phương trình Bellman dựa trên nguyên lý cơ bản:
> *"Giá trị của trạng thái hiện tại bằng phần thưởng nhận được ngay lập tức cộng với giá trị chiết khấu của trạng thái tiếp theo."*

Đây là kỹ thuật **phân rã đệ quy (Recursive Decomposition)**, biến bài toán tính toán tổng vô hạn $G_t$ thành một quan hệ truy hồi giữa hai thời điểm liên tiếp $t$ và $t+1$.

---

### 2. Phương trình kỳ vọng Bellman (Bellman Expectation Equations)
Áp dụng để tính toán giá trị của một chính sách $\pi$ cố định đã biết.

#### A. Phương trình kỳ vọng Bellman cho $V^\pi(s)$
* **Dạng toán học đầy đủ:**
  $$V^\pi(s) = \sum_{a \in \mathcal{A}} \pi(a \mid s) \sum_{s' \in \mathcal{S}} \sum_{r} p(s', r \mid s, a) \left[ r + \gamma V^\pi(s') \right]$$
* **Dạng kỳ vọng rút gọn:**
  $$V^\pi(s) = \mathbb{E}_\pi \left[ R_{t+1} + \gamma V^\pi(S_{t+1}) \mid S_t = s \right]$$
* **Ý nghĩa từng thành phần:**
  * $\pi(a \mid s)$: Xác suất chọn hành động $a$ khi đang ở trạng thái $s$.
  * $p(s', r \mid s, a)$: Xác suất môi trường chuyển sang trạng thái $s'$ và trả về phần thưởng $r$ khi thực hiện hành động $a$ tại $s$.
  * $r$: Phần thưởng tức thời nhận được ngay sau hành động $a$.
  * $\gamma V^\pi(s')$: Giá trị kỳ vọng chiết khấu của trạng thái tiếp theo $s'$.

#### B. Phương trình kỳ vọng Bellman cho $Q^\pi(s, a)$
* **Dạng toán học đầy đủ:**
  $$Q^\pi(s, a) = \sum_{s' \in \mathcal{S}} \sum_{r} p(s', r \mid s, a) \left[ r + \gamma \sum_{a' \in \mathcal{A}} \pi(a' \mid s') Q^\pi(s', a') \right]$$
* **Dạng kỳ vọng rút gọn:**
  $$Q^\pi(s, a) = \mathbb{E}_\pi \left[ R_{t+1} + \gamma Q^\pi(S_{t+1}, A_{t+1}) \mid S_t = s, A_t = a \right]$$
* **Ý nghĩa:** Giá trị của cặp $(s, a)$ bằng phần thưởng tức thời $r$ cộng với trung bình có trọng số giá trị của các hành động $a'$ có thể chọn tại trạng thái kế tiếp $s'$.

#### C. Mối quan hệ liên đới giữa $V(s)$ và $Q(s, a)$
* Giá trị trạng thái bằng trung bình có trọng số các giá trị hành động tại trạng thái đó:
  $$V^\pi(s) = \sum_{a \in \mathcal{A}} \pi(a \mid s) Q^\pi(s, a)$$
* Giá trị hành động bằng phần thưởng tức thời cộng giá trị trạng thái kế tiếp:
  $$Q^\pi(s, a) = \sum_{s', r} p(s', r \mid s, a) \left[ r + \gamma V^\pi(s') \right]$$

---

### 3. Phương trình tối ưu Bellman (Bellman Optimality Equations)
Áp dụng để tìm chính sách tối ưu $\pi^*$ có giá trị cao nhất. Tại trạng thái tối ưu, thay vì lấy trung bình theo chính sách, Agent luôn chọn hành động mang lại giá trị lớn nhất ($\max$).

#### A. Phương trình tối ưu Bellman cho $V^*(s)$
* **Công thức toán học:**
  $$V^*(s) = \max_{a \in \mathcal{A}} \sum_{s' \in \mathcal{S}} \sum_{r} p(s', r \mid s, a) \left[ r + \gamma V^*(s') \right]$$
* **Dạng kỳ vọng:**
  $$V^*(s) = \max_{a \in \mathcal{A}} \mathbb{E} \left[ R_{t+1} + \gamma V^*(S_{t+1}) \mid S_t = s, A_t = a \right]$$
* **Ý nghĩa:** Giá trị tối ưu của trạng thái $s$ chính bằng lợi nhuận kỳ vọng từ hành động tốt nhất mà Agent có thể chọn tại $s$.

#### B. Phương trình tối ưu Bellman cho $Q^*(s, a)$
* **Công thức toán học:**
  $$Q^*(s, a) = \sum_{s' \in \mathcal{S}} \sum_{r} p(s', r \mid s, a) \left[ r + \gamma \max_{a' \in \mathcal{A}} Q^*(s', a') \right]$$
* **Dạng kỳ vọng:**
  $$Q^*(s, a) = \mathbb{E} \left[ R_{t+1} + \gamma \max_{a' \in \mathcal{A}} Q^*(S_{t+1}, a') \mid S_t = s, A_t = a \right]$$
* **Ý nghĩa thực tiễn đặc biệt:** Đây chính là nền tảng cốt lõi của các thuật toán **Q-Learning** và **DQN (Deep Q-Network)**. Mục tiêu huấn luyện của DQN là điều chỉnh tham số mạng nơ-ron sao cho sai số giữa hai vế của phương trình này tiến dần về 0.

---

## PHẦN 3: Ý TƯỞNG VÀ PHẠM VI ÁP DỤNG CỦA QUY HOẠCH ĐỘNG (DP) VÀ MONTE CARLO (MC)

### 1. Phương pháp Quy hoạch động (Dynamic Programming - DP)

#### A. Ý tưởng cốt lõi
* **Dựa trên mô hình toán học hoàn chỉnh:** DP giả định rằng Agent đã biết toàn bộ quy luật của thế giới, bao gồm xác suất chuyển trạng thái $P(s' \mid s, a)$ và hàm phần thưởng $R(s, a)$.
* **Sử dụng kỹ thuật Bootstrapping (Tự nâng):** DP cập nhật ước lượng giá trị của trạng thái hiện tại dựa trên **ước lượng giá trị của các trạng thái kế tiếp** mà không cần phải chờ đến khi kết thúc toàn bộ lượt chơi (Episode):
  $$V(s) \leftarrow \text{Cập nhật từ } V(s')$$
* **Cập nhật toàn diện (Full Backup / Expected Update):** Tại mỗi trạng thái, DP quét qua tất cả các hành động có thể và tất cả các trạng thái kế tiếp có thể đến (tính trung bình theo xác suất lý thuyết), không dựa trên việc lấy mẫu ngẫu nhiên (Sampling).

#### B. Phạm vi áp dụng & Điều kiện tiên quyết
* **Điều kiện:** Bắt buộc phải có **mô hình hoàn hảo của môi trường (Model-based MDP)**.
* **Phạm vi:** 
  * Áp dụng tốt cho các bài toán có không gian trạng thái và hành động **rời rạc, hữu hạn và kích thước nhỏ hoặc vừa phải** (ví dụ: cờ carô bàn cờ nhỏ, điều khiển thang máy đơn giản, bài toán GridWorld có kích thước cố định).
* **Hạn chế lớn nhất:** Bị giới hạn bởi "Lời nguyền số chiều" (Curse of Dimensionality). Nếu không gian trạng thái quá lớn (như cờ vây, điều khiển xe tự hành) hoặc không biết trước xác suất môi trường, DP hoàn toàn không áp dụng được.

---

### 2. Phương pháp Monte Carlo (MC)

#### A. Ý tưởng cốt lõi
* **Học từ kinh nghiệm thực tế (Model-free):** MC không cần biết mô hình toán học của môi trường ($P$ và $R$ là ẩn số). Agent học trực tiếp bằng cách tương tác thử - sai với môi trường để sinh ra các chuỗi trải nghiệm thực tế (Episodes).
* **Không sử dụng Bootstrapping:** MC không cập nhật dựa trên ước lượng của trạng thái kế tiếp. Agent phải chạy một episode từ trạng thái bắt đầu cho đến khi **kết thúc hoàn toàn (Terminal State)**, sau đó tính tổng phần thưởng thực tế nhận được $G_t$.
* **Ước lượng theo luật số lớn (Sample Average):** Giá trị của trạng thái $s$ được ước lượng bằng trung bình cộng các lợi nhuận thực tế thu được từ tất cả các lần Agent ghé thăm trạng thái $s$:
  $$V(s) \approx \frac{1}{N(s)} \sum_{i=1}^{N(s)} G_t^{(i)}$$
  Theo Luật Số Lớn, khi số lượng episode tiến tới vô cùng, giá trị trung bình mẫu sẽ hội tụ chính xác về giá trị kỳ vọng thực tế $V^\pi(s)$.

#### B. Phạm vi áp dụng & Điều kiện tiên quyết
* **Điều kiện:**
  * **Chỉ áp dụng được cho bài toán phân đoạn (Episodic Tasks):** Các bài toán bắt buộc phải có điểm dừng/trạng thái kết thúc (ví dụ: ván cờ kết thúc thắng/thua, game over, xe về đích).
  * Không áp dụng được cho bài toán liên tục vô hạn (Continuing Tasks) vì không bao giờ có điểm dừng để tính tổng lợi nhuận $G_t$.
* **Phạm vi:**
  * Thích hợp cho các môi trường thực tế không thể mô hình hóa bằng công thức toán học nhưng có thể mô phỏng hoặc tương tác lặp đi lặp lại nhiều lần (ví dụ: chơi game Atari, lái xe mô phỏng, bài toán Blackjack).

---

### 3. Bảng so sánh đối đầu chi tiết giữa DP và MC (Dễ học thuộc để viết bài thi)

| Tiêu chí so sánh | Quy hoạch động (Dynamic Programming - DP) | Monte Carlo (MC) |
| :--- | :--- | :--- |
| **Yêu cầu mô hình môi trường** | **Model-based:** Bắt buộc phải biết trước $P(s' \mid s, a)$ và $R(s, a)$. | **Model-free:** Không cần mô hình, học từ dữ liệu trải nghiệm thực tế. |
| **Cơ chế Bootstrapping** | **Có:** Cập nhật ước lượng hiện tại từ ước lượng tương lai ($V(s) \leftarrow V(s')$). | **Không:** Chờ hết episode, tính lợi nhuận thực tế $G_t$ rồi mới cập nhật. |
| **Cơ chế Lấy mẫu (Sampling)** | **Không lấy mẫu:** Quét qua toàn bộ nhánh rẽ lý thuyết (Full backup). | **Có lấy mẫu:** Đi theo một nhánh đường đi ngẫu nhiên thực tế (Sample backup). |
| **Loại bài toán hỗ trợ** | Hỗ trợ cả bài toán phân đoạn (Episodic) và liên tục (Continuing). | **Chỉ hỗ trợ** bài toán phân đoạn (Bắt buộc phải có trạng thái kết thúc). |
| **Độ chệch (Bias) & Phương sai (Variance)** | **Độ chệch cao** (do phụ thuộc vào giá trị ước lượng ban đầu), **Phương sai bằng 0**. | **Độ chệch bằng 0** (không chệch), nhưng **Phương sai cao** (do tính ngẫu nhiên của chuỗi bước đi). |
| **Khả năng chạy từng phần** | Có thể cập nhật giá trị của từng trạng thái đơn lẻ. | Bắt buộc phải chạy trọn vẹn cả chuỗi từ đầu đến cuối episode. |

---

## PHẦN 4: PHÂN TÍCH THUẬT TOÁN TIÊU BIỂU CỦA DP VÀ MC

### 1. Thuật toán tiêu biểu của DP: Policy Iteration (Lặp chính sách)

#### A. Ý tưởng thuật toán
Thuật toán Policy Iteration giải quyết bài toán điều khiển tối ưu bằng cách lặp đi lặp lại hai giai đoạn đan xen nhau cho đến khi chính sách không còn thay đổi:
1. **Đánh giá chính sách (Policy Evaluation):** Tính toán chính xác hàm giá trị $V^\pi(s)$ cho chính sách hiện tại $\pi$.
2. **Cải tiến chính sách (Policy Improvement):** Dựa vào hàm giá trị vừa tính, cập nhật chính sách mới $\pi'$ bằng cách chọn hành động tham lam nhất (Greedy):
   $$\pi'(s) = \arg\max_{a \in \mathcal{A}} \sum_{s', r} p(s', r \mid s, a) \left[ r + \gamma V^\pi(s') \right]$$

```text
       Policy Evaluation (Tính V từ pi)
  pi_0 ----------------------------------> V^{pi_0}
   ^                                          |
   |                                          v
  pi_1 <---------------------------------- Policy Improvement (Tham lam hóa)
   |   Policy Evaluation
   v
  V^{pi_1} ... ---> Hội tụ tại chính sách tối ưu pi* và V*
```

#### B. Các bước thuật toán chi tiết (Mã giả / Pseudo-code để viết vào bài thi)

```text
Bước 1: Khởi tạo
  - Khởi tạo mảng giá trị V(s) tuỳ ý (ví dụ V(s) = 0 với mọi s thuộc S, V(terminal) = 0).
  - Khởi tạo chính sách pi(s) ngẫu nhiên cho mọi s thuộc S.

Bước 2: Đánh giá chính sách (Policy Evaluation)
  Lặp:
    Delta <- 0
    Với mỗi trạng thái s thuộc S:
      v_cu <- V(s)
      V(s) <- Tổng_{s', r} p(s', r | s, pi(s)) * [ r + gamma * V(s') ]
      Delta <- max(Delta, |v_cu - V(s)|)
  Cho đến khi Delta < theta (với theta là một ngưỡng số thực dương rất nhỏ).

Bước 3: Cải tiến chính sách (Policy Improvement)
  policy_stable <- TRUE
  Với mỗi trạng thái s thuộc S:
    a_cu <- pi(s)
    pi(s) <- argmax_a Tổng_{s', r} p(s', r | s, a) * [ r + gamma * V(s') ]
    Nếu pi(s) != a_cu thì:
      policy_stable <- FALSE

Bước 4: Điều kiện dừng
  Nếu policy_stable == TRUE:
    Dừng thuật toán, trả về chính sách tối ưu pi* và hàm giá trị tối ưu V*.
  Ngược lại:
    Quay trở lại Bước 2 để đánh giá chính sách mới.
```

#### C. Đánh giá ưu và nhược điểm của Policy Iteration
* **Ưu điểm:** Đảm bảo toán học 100% hội tụ về chính sách tối ưu $\pi^*$; số vòng lặp cải tiến chính sách thường rất nhỏ.
* **Nhược điểm:** Mỗi bước Policy Evaluation đòi hỏi phải giải một hệ phương trình tuyến tính hoặc lặp nhiều lần đến khi hội tụ giá trị $V$, gây tốn kém tính toán nếu không gian trạng thái lớn.

---

### 2. Thuật toán tiêu biểu của MC: First-Visit Monte Carlo Prediction

#### A. Ý tưởng thuật toán
Mục tiêu là ước lượng hàm giá trị trạng thái $V^\pi(s)$ cho một chính sách $\pi$ cho trước.
Trong một Episode, một trạng thái $s$ có thể được tác tử ghé thăm nhiều lần:
* **First-Visit MC:** Chỉ tính toán lợi nhuận $G_t$ cho **lần đầu tiên** trạng thái $s$ xuất hiện trong episode đó. Các lần xuất hiện sau của $s$ trong cùng episode sẽ bị bỏ qua.
* **Every-Visit MC:** Tính toán lợi nhuận cho **tất cả mọi lần** trạng thái $s$ xuất hiện trong episode.
*(Lưu ý thi cử: Thuật toán First-Visit MC phổ biến hơn vì đã được chứng minh toán học là ước lượng không chệch).*

#### B. Các bước thuật toán chi tiết (Mã giả / Pseudo-code để viết vào bài thi)

```text
Bước 1: Khởi tạo
  - Khởi tạo giá trị V(s) tuỳ ý (ví dụ V(s) = 0 cho mọi s thuộc S).
  - Khởi tạo danh sách lưu trữ Returns(s) là rỗng cho mọi s thuộc S.

Bước 2: Vòng lặp huấn luyện qua từng Episode
  Lặp với mỗi Episode:
    a. Sử dụng chính sách pi để sinh ra một chuỗi tương tác hoàn chỉnh:
       S_0, A_0, R_1, S_1, A_1, R_2, ..., S_{T-1}, A_{T-1}, R_T, S_T

    b. Khởi tạo tổng lợi nhuận G <- 0

    c. Duyệt ngược chuỗi tương tác từ bước cuối cùng t = T-1 về 0:
       G <- gamma * G + R_{t+1}

       Nếu trạng thái S_t KHÔNG xuất hiện trong tập hợp {S_0, S_1, ..., S_{t-1}}:
         (Nghĩa là đây là lần đầu tiên S_t xuất hiện trong episode)
         - Thêm G vào danh sách Returns(S_t)
         - Cập nhật giá trị trung bình:
           V(S_t) <- average(Returns(S_t))
```

#### C. Công thức cập nhật tăng dần (Incremental Update - Tối ưu bộ nhớ)
Trong lập trình thực tế, thay vì lưu toàn bộ danh sách `Returns(s)`, người ta cập nhật trung bình động trực tiếp sau mỗi episode:
$$V(S_t) \leftarrow V(S_t) + \frac{1}{N(S_t)} \left( G_t - V(S_t) \right)$$
Hoặc sử dụng hằng số học $\alpha$ (thường dùng cho môi trường phi tĩnh - non-stationary):
$$V(S_t) \leftarrow V(S_t) + \alpha \left( G_t - V(S_t) \right)$$
* Trong đó: $(G_t - V(S_t))$ đóng vai trò là **Sai số dự đoán (Prediction Error)**.

#### D. Đánh giá ưu và nhược điểm của First-Visit MC
* **Ưu điểm:**
  * Không phụ thuộc vào mô hình môi trường ($P$ và $R$).
  * Ước lượng không chệch (Unbiased): $\mathbb{E}[V(s)] = V^\pi(s)$.
  * Dễ cài đặt, trực quan, không bị ảnh hưởng bởi tính chất vi phạm Markov của các trạng thái khác.
* **Nhược điểm:**
  * Bắt buộc phải chờ episode kết thúc mới cập nhật được (chậm đối với các episode dài).
  * Phương sai cao (High Variance): Cùng một trạng thái $s$, nhưng hai episode khác nhau có thể dẫn tới kết quả phần thưởng $G_t$ chênh lệch rất lớn do tính ngẫu nhiên của chuỗi bước đi tiếp theo.

---

## PHẦN 5: CÂU HỎI NHANH GIÚP ÔN TẬP TRƯỚC GIỜ THI

1. **Câu hỏi:** *Sự khác nhau cơ bản nhất giữa Dynamic Programming và Monte Carlo là gì?*
   * **Trả lời:** DP là **Model-based** và sử dụng **Bootstrapping** (cập nhật ước lượng từ ước lượng kế tiếp mà không cần chạy hết episode). Ngược lại, MC là **Model-free** và **không dùng Bootstrapping** (bắt buộc chạy hết episode để tính lợi nhuận thực tế $G_t$).

2. **Câu hỏi:** *Phương trình Bellman nào làm tiền đề trực tiếp cho thuật toán Q-Learning và Deep Q-Network (DQN)?*
   * **Trả lời:** Phương trình tối ưu Bellman cho hàm giá trị hành động ($Q^*$):
     $$Q^*(s, a) = \sum_{s', r} p(s', r \mid s, a) \left[ r + \gamma \max_{a'} Q^*(s', a') \right]$$

3. **Câu hỏi:** *Tại sao Monte Carlo không áp dụng được cho bài toán liên tục vô hạn (Continuing Tasks)?*
   * **Trả lời:** Vì bài toán liên tục không bao giờ chạm tới trạng thái kết thúc (Terminal state), do đó không bao giờ tính được giá trị tổng lợi nhuận thực tế $G_t$ để lấy trung bình.

4. **Câu hỏi:** *Ý nghĩa thực tế của hệ số chiết khấu $\gamma$ là gì?*
   * **Trả lời:** $\gamma$ điều chỉnh mức độ ưu tiên giữa lợi ích trước mắt và lợi ích lâu dài của Agent. $\gamma = 0$ khiến Agent chỉ nhìn 1 bước trước mắt; $\gamma \to 1$ khiến Agent nhìn xa trông rộng. Đồng thời $\gamma < 1$ đảm bảo chuỗi tổng phần thưởng vô hạn hội tụ về một số thực hữu hạn.
