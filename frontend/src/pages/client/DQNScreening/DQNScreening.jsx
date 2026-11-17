import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdSmartToy,
  MdPlayArrow,
  MdRefresh,
  MdCompareArrows,
  MdCheckCircle,
  MdCancel,
  MdPauseCircle,
  MdInfo,
  MdSchool,
  MdWork,
  MdStar,
} from "react-icons/md";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import rlService from "../../../services/client/rlService";
import "./DQNScreening.css";

export default function DQNScreening() {
  const [datasetType, setDatasetType] = useState("synthetic"); // "synthetic" (TH1) | "real" (TH2)
  const [budgetK, setBudgetK] = useState(5);
  const [episodes, setEpisodes] = useState(100);

  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);

  const [simulationData, setSimulationData] = useState(null);
  const [trainHistory, setTrainHistory] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Nạp dữ liệu và chạy mô phỏng ban đầu
  useEffect(() => {
    handleRunSimulation("synthetic", 5);
  }, []);

  // Chạy suy luận (Inference)
  const handleRunSimulation = async (type = datasetType, k = budgetK) => {
    try {
      setLoading(true);
      const res = await rlService.simulate(type, k);
      if (res && res.success) {
        setSimulationData(res);
      } else {
        toast.error(res?.message || "Lỗi khi chạy suy luận!");
      }
    } catch (err) {
      toast.error(err?.message || "Không thể kết nối đến backend!");
    } finally {
      setLoading(false);
    }
  };

  // Huấn luyện mô hình DQN
  const handleTrainAgent = async () => {
    try {
      setTraining(true);
      toast.info(`Bắt đầu huấn luyện DQN với ${episodes} episodes...`);
      const res = await rlService.trainAgent(episodes);
      if (res && res.success) {
        setTrainHistory(res.history || []);
        toast.success(`Huấn luyện hoàn tất thành công ${episodes} episodes!`);
        // Tự động chạy lại mô phỏng với trọng số mới
        await handleRunSimulation(datasetType, budgetK);
      } else {
        toast.error(res?.message || "Huấn luyện thất bại!");
      }
    } catch (err) {
      toast.error(err?.message || "Lỗi khi gọi API huấn luyện!");
    } finally {
      setTraining(false);
    }
  };

  // Chạy so sánh đối đầu TH1 vs TH2
  const handleRunComparison = async () => {
    try {
      setLoading(true);
      toast.info("Đang chạy đối chiếu đồng thời TH1 (Ảo) và TH2 (Thật)...");
      const [resSynth, resReal] = await Promise.all([
        rlService.simulate("synthetic", budgetK),
        rlService.simulate("real", budgetK),
      ]);

      if (resSynth?.success && resReal?.success) {
        setComparison({
          synth: resSynth,
          real: resReal,
        });
        toast.success("Đối chiếu hoàn tất! Xem bảng so sánh bên dưới.");
      }
    } catch (err) {
      toast.error(err?.message || "Lỗi khi so sánh đối chiếu!");
    } finally {
      setLoading(false);
    }
  };

  // Đổi tab TH1 / TH2
  const handleToggleDataset = (type) => {
    setDatasetType(type);
    handleRunSimulation(type, budgetK);
  };

  const summary = simulationData?.summary;
  const decisions = simulationData?.decisions || [];

  return (
    <div className="dqn-container">
      {/* Header */}
      <div className="dqn-header">
        <div className="dqn-header__badge">
          <MdSmartToy /> HỌC TĂNG CƯỜNG (REINFORCEMENT LEARNING - HK7)
        </div>
        <h1 className="dqn-header__title">
          Demo Thuật Toán Deep Q-Network (DQN) Sàng Lọc CV Theo Hạn Ngạch
        </h1>
        <p className="dqn-header__subtitle">
          Mô hình hóa MDP 24 chiều, tối ưu hóa chuỗi quyết định chọn $K$ ứng viên tốt nhất từ danh sách $N$ hồ sơ tuần tự.
        </p>
      </div>

      {/* Control Panel */}
      <div className="dqn-card">
        <div className="dqn-card__title">
          <MdSmartToy /> Bộ Điều Khiển & Thiết Lập Tham Số Mô Phỏng
        </div>

        <div className="dqn-controls-grid">
          {/* Lựa chọn trường hợp TH1 / TH2 */}
          <div className="dqn-input-group">
            <label>Chọn Tập Dữ Liệu Benchmark:</label>
            <div className="dqn-case-toggle">
              <button
                type="button"
                className={`dqn-case-btn ${datasetType === "synthetic" ? "active" : ""}`}
                onClick={() => handleToggleDataset("synthetic")}
              >
                🧪 TH1: Dữ liệu ảo (30 CV)
              </button>
              <button
                type="button"
                className={`dqn-case-btn ${datasetType === "real" ? "active" : ""}`}
                onClick={() => handleToggleDataset("real")}
              >
                📂 TH2: Dữ liệu thật (30 CV)
              </button>
            </div>
          </div>

          {/* Ngân sách K */}
          <div className="dqn-input-group">
            <label>Hạn ngạch phỏng vấn K (suất):</label>
            <input
              type="number"
              min="1"
              max="15"
              value={budgetK}
              onChange={(e) => setBudgetK(Number(e.target.value) || 1)}
            />
          </div>

          {/* Số episodes huấn luyện */}
          <div className="dqn-input-group">
            <label>Số Episode huấn luyện:</label>
            <input
              type="number"
              min="10"
              max="300"
              step="10"
              value={episodes}
              onChange={(e) => setEpisodes(Number(e.target.value) || 50)}
            />
          </div>

          {/* Các nút hành động */}
          <div className="dqn-actions-group">
            <button
              type="button"
              className="dqn-btn dqn-btn--primary"
              disabled={loading || training}
              onClick={() => handleRunSimulation(datasetType, budgetK)}
            >
              {loading ? <span className="dqn-spinner" /> : <MdPlayArrow />}
              Chạy Sàng Lọc (Inference)
            </button>

            <button
              type="button"
              className="dqn-btn dqn-btn--success"
              disabled={loading || training}
              onClick={handleTrainAgent}
            >
              {training ? <span className="dqn-spinner" /> : <MdRefresh />}
              Huấn Luyện Lại DQN
            </button>

            <button
              type="button"
              className="dqn-btn dqn-btn--secondary"
              disabled={loading || training}
              onClick={handleRunComparison}
            >
              <MdCompareArrows />
              So Sánh TH1 vs TH2
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="dqn-kpi-grid">
          <div className="dqn-kpi-card">
            <div className="dqn-kpi-card__label">Chỉ tiêu đã tuyển (ACCEPT)</div>
            <div className="dqn-kpi-card__value" style={{ color: "#16a34a" }}>
              {summary.totalAccepted} / {budgetK}
            </div>
            <div className="dqn-kpi-card__sub">
              {summary.quotaFilled ? "✓ Đã đủ hạn ngạch K" : "Chưa đủ chỉ tiêu"}
            </div>
          </div>

          <div className="dqn-kpi-card">
            <div className="dqn-kpi-card__label">Điểm TB ứng viên trúng tuyển</div>
            <div className="dqn-kpi-card__value" style={{ color: "#0284c7" }}>
              {summary.avgAcceptedScore} / 100
            </div>
            <div className="dqn-kpi-card__sub">
              {summary.avgAcceptedScore >= 80 ? "Chất lượng rất cao (Star/Good)" : "Mức độ trung bình"}
            </div>
          </div>

          <div className="dqn-kpi-card">
            <div className="dqn-kpi-card__label">Số hồ sơ đã từ chối (REJECT)</div>
            <div className="dqn-kpi-card__value" style={{ color: "#dc2626" }}>
              {summary.totalRejected}
            </div>
            <div className="dqn-kpi-card__sub">Thanh lọc các hồ sơ yếu/rủi ro</div>
          </div>

          <div className="dqn-kpi-card">
            <div className="dqn-kpi-card__label">Tổng Phần thưởng tích lũy (Reward)</div>
            <div className="dqn-kpi-card__value" style={{ color: summary.totalReward >= 0 ? "#16a34a" : "#dc2626" }}>
              {summary.totalReward > 0 ? `+${summary.totalReward}` : summary.totalReward}
            </div>
            <div className="dqn-kpi-card__sub">Hàm Reward tối ưu hóa Bellman</div>
          </div>
        </div>
      )}

      {/* Charts Section: Hiển thị nếu có lịch sử huấn luyện */}
      {trainHistory.length > 0 && (
        <div className="dqn-charts-grid">
          <div className="dqn-chart-box">
            <div className="dqn-card__title">
              📈 Quá Trình Hội Tụ Phần Thưởng (Episode Rewards)
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trainHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="episode" label={{ value: "Episode", position: "insideBottom", offset: -5 }} />
                <YAxis label={{ value: "Reward", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="reward" stroke="#0087f1" name="Reward" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="dqn-chart-box">
            <div className="dqn-card__title">
              📉 Suy Giảm Hàm Mất Mát (Bellman MSE Loss)
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trainHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="episode" label={{ value: "Episode", position: "insideBottom", offset: -5 }} />
                <YAxis label={{ value: "Loss", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="loss" stroke="#ef4444" name="Loss" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Comparison Section (TH1 vs TH2) */}
      {comparison && (
        <div className="dqn-card">
          <div className="dqn-card__title">
            <MdCompareArrows /> Bảng Đối Chiếu So Sánh Trực Quan: TH1 (Ảo) vs TH2 (Thật)
          </div>
          <table className="dqn-compare-table">
            <thead>
              <tr>
                <th>Tiêu chí đánh giá</th>
                <th>🧪 TH1: Dữ liệu ảo (Synthetic)</th>
                <th>📂 TH2: Dữ liệu thật (Real)</th>
                <th>Đánh giá của Agent</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Số lượng ứng viên duyệt (K = {budgetK})</td>
                <td><strong>{comparison.synth.summary.totalAccepted} / {budgetK}</strong></td>
                <td><strong>{comparison.real.summary.totalAccepted} / {budgetK}</strong></td>
                <td>Đạt đúng 100% hạn ngạch phỏng vấn cho phép</td>
              </tr>
              <tr>
                <td>Điểm năng lực trung bình (M)</td>
                <td><span style={{ color: "#0087f1", fontWeight: 700 }}>{comparison.synth.summary.avgAcceptedScore} / 100</span></td>
                <td><span style={{ color: "#00a77a", fontWeight: 700 }}>{comparison.real.summary.avgAcceptedScore} / 100</span></td>
                <td>TH2 phản ánh thực tế profile dày dặn kinh nghiệm</td>
              </tr>
              <tr>
                <td>Số lượng hồ sơ bị loại (REJECT)</td>
                <td>{comparison.synth.summary.totalRejected} CV</td>
                <td>{comparison.real.summary.totalRejected} CV</td>
                <td>Loại bỏ kịp thời các CV yếu, giữ suất cho nhân tài</td>
              </tr>
              <tr>
                <td>Tổng phần thưởng tích lũy (Reward)</td>
                <td><strong>+{comparison.synth.summary.totalReward}</strong></td>
                <td><strong>+{comparison.real.summary.totalReward}</strong></td>
                <td>DQN tối ưu hóa giá trị kỳ vọng tương lai thành công</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Live Decision Board */}
      <div className="dqn-card">
        <div className="dqn-card__title">
          📋 Bảng Tiến Trình Duyệt Từng Ứng Viên ({datasetType === "synthetic" ? "TH1: Dữ Liệu Ảo" : "TH2: Dữ Liệu Thật"})
        </div>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
          Hiển thị từng hồ sơ lướt qua con mắt của DQN Agent. Khi tuyển đủ $K={budgetK}$ suất, các hồ sơ phía sau tự động dừng để tuân thủ hạn ngạch.
        </p>

        <div className="dqn-table-wrapper">
          <table className="dqn-table">
            <thead>
              <tr>
                <th>Bước</th>
                <th>Ứng viên</th>
                <th>Điểm (M)</th>
                <th>Phân khúc</th>
                <th>Q-Values [Reject, Accept, Hold]</th>
                <th>Hành động</th>
                <th>Reward</th>
                <th>Slot còn</th>
                <th>Lý do DQN lựa chọn</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((d) => (
                <tr key={d.step} style={{ opacity: d.status === "skipped" ? 0.6 : 1 }}>
                  <td><strong>#{d.step}</strong></td>
                  <td>
                    <strong>{d.name}</strong>
                    {d.rawInfo?.education && (
                      <div style={{ fontSize: 11, color: "#64748b" }}>{d.rawInfo.education}</div>
                    )}
                  </td>
                  <td>
                    <strong>{d.score}</strong>/100
                  </td>
                  <td>
                    <span className={`dqn-badge dqn-badge--${d.tier.toLowerCase()}`}>
                      {d.tier.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {d.status === "evaluated" ? (
                      <div className="dqn-q-mini">
                        <span style={{ color: d.action === 0 ? "#dc2626" : "#64748b" }}>
                          R: {d.qValues[0]}
                        </span>{" | "}
                        <span style={{ color: d.action === 1 ? "#16a34a" : "#64748b", fontWeight: d.action === 1 ? 700 : 400 }}>
                          A: {d.qValues[1]}
                        </span>{" | "}
                        <span style={{ color: d.action === 2 ? "#ca8a04" : "#64748b" }}>
                          H: {d.qValues[2]}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>-</span>
                    )}
                  </td>
                  <td>
                    <span className={`dqn-badge dqn-badge--${d.actionLabel.toLowerCase()}`}>
                      {d.actionLabel === "ACCEPT" && <MdCheckCircle style={{ verticalAlign: -2, marginRight: 4 }} />}
                      {d.actionLabel === "REJECT" && <MdCancel style={{ verticalAlign: -2, marginRight: 4 }} />}
                      {d.actionLabel === "HOLD" && <MdPauseCircle style={{ verticalAlign: -2, marginRight: 4 }} />}
                      {d.actionLabel}
                    </span>
                  </td>
                  <td>
                    {d.status === "evaluated" ? (
                      <strong style={{ color: d.reward >= 0 ? "#16a34a" : "#dc2626" }}>
                        {d.reward > 0 ? `+${d.reward}` : d.reward}
                      </strong>
                    ) : "-"}
                  </td>
                  <td>
                    <strong>{d.kRemain}</strong>/{budgetK}
                  </td>
                  <td style={{ fontSize: 12, color: "#334155" }}>
                    {d.reasoning}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="dqn-btn dqn-btn--secondary"
                      style={{ padding: "4px 8px", fontSize: 12 }}
                      onClick={() => setSelectedCandidate(d)}
                    >
                      <MdInfo /> Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setSelectedCandidate(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 550,
              width: "90%",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, color: "#1f2936" }}>
                Hồ Sơ: {selectedCandidate.name}
              </h2>
              <button
                type="button"
                style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer" }}
                onClick={() => setSelectedCandidate(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <span className={`dqn-badge dqn-badge--${selectedCandidate.tier.toLowerCase()}`}>
                {selectedCandidate.tier.toUpperCase()}
              </span>
              <span className={`dqn-badge dqn-badge--${selectedCandidate.actionLabel.toLowerCase()}`}>
                Quyết định: {selectedCandidate.actionLabel}
              </span>
              <span style={{ fontSize: 13, padding: "4px 8px", background: "#f1f5f9", borderRadius: 6 }}>
                Điểm năng lực: <strong>{selectedCandidate.score}/100</strong>
              </span>
            </div>

            <div style={{ fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
              {selectedCandidate.rawInfo?.education && (
                <p><strong><MdSchool style={{ verticalAlign: -2 }} /> Học vấn:</strong> {selectedCandidate.rawInfo.education} (GPA: {selectedCandidate.rawInfo.gpa || "N/A"})</p>
              )}
              {selectedCandidate.rawInfo?.experienceYears !== undefined && (
                <p><strong><MdWork style={{ verticalAlign: -2 }} /> Kinh nghiệm:</strong> {selectedCandidate.rawInfo.experienceYears} năm ({selectedCandidate.rawInfo.currentCompany || "N/A"})</p>
              )}
              {selectedCandidate.rawInfo?.techStack && (
                <p><strong>🛠️ Tech Stack:</strong> {Array.isArray(selectedCandidate.rawInfo.techStack) ? selectedCandidate.rawInfo.techStack.join(", ") : selectedCandidate.rawInfo.techStack}</p>
              )}
              {selectedCandidate.rawInfo?.github && (
                <p><strong>⭐ GitHub:</strong> {selectedCandidate.rawInfo.github} ({selectedCandidate.rawInfo.githubStars || 0} stars)</p>
              )}
              {selectedCandidate.rawInfo?.summary && (
                <p style={{ marginTop: 8, background: "#f8fafc", padding: 10, borderRadius: 8 }}>
                  <strong>Tóm tắt hồ sơ:</strong> {selectedCandidate.rawInfo.summary}
                </p>
              )}
              <div style={{ marginTop: 12, padding: 10, background: "#e7f3ff", borderRadius: 8, color: "#0072f7" }}>
                <strong>Lý do AI lựa chọn:</strong> {selectedCandidate.reasoning}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
