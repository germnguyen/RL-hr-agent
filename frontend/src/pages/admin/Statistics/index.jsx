import { useState, useCallback, useEffect } from "react";
import { Users, Briefcase, Mail, CircleCheck, Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";

import adminReportService from "../../../services/admin/adminReportService";
import AdminStatisticsKPICard from "./AdminStatisticsKPICard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const cardShadow =
  "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]";
const cardTitle =
  "mb-4 border-b-2 border-[#e9ecef] pb-3 text-base font-semibold text-[#343a40]";
const filterRow = "mb-5 flex flex-col gap-2 last:mb-0";
const filterLabel = "text-[0.9rem] font-semibold text-[#495057]";

const AdminStatistics = () => {
  const [filterCriteria, setFilterCriteria] = useState("Theo tháng");
  const [filterDate, setFilterDate] = useState("2026-03");
  const [selectedHr, setSelectedHr] = useState("all");
  const [hrList, setHrList] = useState([]);

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalCVsReceived: 0,
    totalOpenJobs: 0,
    totalEmailsSent: 0,
    cvPassRate: "0%",
    chartData: [],
  });

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf");

  const fetchHRList = useCallback(async () => {
    try {
      const response = await adminReportService.getAllHRs();
      if (response && response.success) {
        const hrData = response.data || [];
        const activeHRs = hrData.filter((hr) => hr.status === "active");
        setHrList(activeHRs);
      } else {
        throw new Error(response?.message || "Lỗi không xác định");
      }
    } catch (error) {
      console.error("❌ Lỗi khi tải danh sách HR:", error);
      toast.error("Không thể tải danh sách HR. " + (error.message || ""));
    }
  }, []);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      const hrId = selectedHr === "all" ? null : selectedHr;
      const response = await adminReportService.getSystemStatistics(
        filterCriteria,
        filterDate,
        hrId,
      );

      if (response && response.success && response.data) {
        setStats({
          totalCVsReceived: response.data.totalCVsReceived || 0,
          totalOpenJobs: response.data.totalOpenJobs || 0,
          totalEmailsSent: response.data.totalEmailsSent || 0,
          cvPassRate: response.data.cvPassRate || "0%",
          chartData: response.data.chartData || [],
        });
      } else {
        throw new Error(response?.message || "Lỗi không xác định");
      }
    } catch (error) {
      console.error("❌ Lỗi khi tải thống kê:", error);
      toast.error("Không thể tải dữ liệu thống kê. " + (error.message || ""));
      setStats({
        totalCVsReceived: 0,
        totalOpenJobs: 0,
        totalEmailsSent: 0,
        cvPassRate: "0%",
        chartData: [],
      });
    } finally {
      setLoading(false);
    }
  }, [filterCriteria, filterDate, selectedHr]);

  useEffect(() => {
    fetchHRList();
    fetchStatistics();
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [filterCriteria, filterDate, selectedHr, fetchStatistics]);

  const exportToExcel = () => {
    const summaryData = [
      {
        "Chỉ số": "Tổng CV đã tiếp nhận (Hệ thống)",
        "Giá trị": stats.totalCVsReceived,
      },
      { "Chỉ số": "Tổng công việc đang mở", "Giá trị": stats.totalOpenJobs },
      { "Chỉ số": "Tổng email đã gửi", "Giá trị": stats.totalEmailsSent },
      { "Chỉ số": "Tỷ lệ pass CV (AI)", "Giá trị": stats.cvPassRate },
      { "Chỉ số": "", "Giá trị": "" },
    ];

    const chartDataFormatted = stats.chartData.map((item) => ({
      "Thời gian": item.name,
      "CV tiếp nhận": item.blueValue,
      "Lịch phỏng vấn": item.orangeValue,
      "Hoàn thành": item.grayValue,
    }));

    const finalData = [...summaryData, ...chartDataFormatted];
    const ws = XLSX.utils.json_to_sheet(finalData);
    ws["!cols"] = [{ wch: 35 }, { wch: 15 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Thong_Ke_Tong_Hop");
    XLSX.writeFile(
      wb,
      `Thong_Ke_Admin_${filterCriteria.replace(" ", "_")}_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    toast.success("Xuất Excel thành công!");
  };

  const exportToPDF = async () => {
    const reportElement = document.getElementById("admin-report-content");
    if (!reportElement) {
      toast.error("Không tìm thấy nội dung để xuất PDF!");
      return;
    }

    try {
      toast.info("Đang xử lý PDF, vui lòng chờ...", { autoClose: 2000 });
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        backgroundColor: "#f8f9fa",
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Thong_Ke_Admin_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Xuất PDF thành công!");
    } catch (error) {
      console.error("Lỗi xuất PDF:", error);
      toast.error("Đã xảy ra lỗi khi tạo file PDF.");
    }
  };

  const handleExport = () => {
    if (exportFormat === "excel") {
      exportToExcel();
    } else {
      exportToPDF();
    }
    setShowExportModal(false);
  };

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-[1.75rem] font-bold text-ink">
          Thống kê hệ thống
        </h1>
        <p className="text-[0.95rem] text-hint">
          Xem báo cáo và phân tích dữ liệu hoạt động của toàn bộ tài khoản HR
        </p>
      </div>

      <div id="admin-report-content" className="mb-8 flex flex-wrap gap-6">
        <div className="flex w-full flex-col gap-6 lg:w-[45%] xl:w-[40%]">
          <div className={`rounded-xl bg-white p-6 ${cardShadow}`}>
            <h3 className={cardTitle}>Bộ lọc</h3>

            <div className={filterRow}>
              <label className={filterLabel}>Lọc theo HR:</label>
              <Select value={selectedHr} onValueChange={setSelectedHr}>
                <SelectTrigger className="h-[38px] w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả HR</SelectItem>
                  {hrList.map((hr) => (
                    <SelectItem key={hr.id} value={String(hr.id)}>
                      {hr.fullName || hr.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={filterRow}>
              <label className={filterLabel}>Tiêu chí lọc:</label>
              <Select value={filterCriteria} onValueChange={setFilterCriteria}>
                <SelectTrigger className="h-[38px] w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Theo tháng">Theo tháng</SelectItem>
                  <SelectItem value="Theo quý">Theo quý</SelectItem>
                  <SelectItem value="Theo năm">Theo năm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={filterRow}>
              <label className={filterLabel}>Thời gian:</label>
              <Input
                type="month"
                className="h-[38px] w-full bg-white"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="flex h-full items-center justify-center font-medium text-hint">
                Đang tải dữ liệu...
              </div>
            ) : (
              <>
                <AdminStatisticsKPICard
                  icon={Users}
                  title="Tổng CV đã tiếp nhận"
                  value={stats.totalCVsReceived}
                  unit="CV"
                  color="#0d6efd"
                  trend={{ positive: true, text: "+15% so với tháng trước" }}
                />
                <AdminStatisticsKPICard
                  icon={Briefcase}
                  title="Công việc đang mở"
                  value={stats.totalOpenJobs}
                  unit="công việc"
                  color="#198754"
                />
                <AdminStatisticsKPICard
                  icon={Mail}
                  title="Email đã gửi"
                  value={stats.totalEmailsSent}
                  unit="email"
                  color="#fd7e14"
                  trend={{ positive: true, text: "+8% so với tháng trước" }}
                />
                <AdminStatisticsKPICard
                  icon={CircleCheck}
                  title="Tỷ lệ pass AI"
                  value={parseFloat(stats.cvPassRate.replace("%", ""))}
                  unit="%"
                  color="#6f42c1"
                  trend={{ positive: true, text: "+2.3% so với tháng trước" }}
                />
              </>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={`flex min-h-[500px] flex-col rounded-xl bg-white p-6 ${cardShadow}`}
          >
            <h3 className={cardTitle}>
              Biểu đồ thống kê - CV &amp; Lịch phỏng vấn
            </h3>
            <div className="flex min-h-[350px] flex-1 items-center justify-center">
              {loading ? (
                <div className="flex h-full items-center justify-center font-medium text-hint">
                  Đang tải biểu đồ...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={stats.chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e9ecef"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#6c757d", fontSize: 12 }}
                      axisLine={{ stroke: "#ced4da" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#6c757d", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip cursor={{ fill: "#f8f9fa" }} />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }}
                    />
                    <Bar
                      dataKey="blueValue"
                      name="CV tiếp nhận"
                      fill="#0d6efd"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    >
                      <LabelList
                        dataKey="blueValue"
                        position="top"
                        fill="#6c757d"
                        fontSize={11}
                        fontWeight={600}
                      />
                    </Bar>
                    <Bar
                      dataKey="orangeValue"
                      name="Lịch phỏng vấn"
                      fill="#fd7e14"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    >
                      <LabelList
                        dataKey="orangeValue"
                        position="top"
                        fill="#6c757d"
                        fontSize={11}
                        fontWeight={600}
                      />
                    </Bar>
                    <Bar
                      dataKey="grayValue"
                      name="Hoàn thành"
                      fill="#6c757d"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    >
                      <LabelList
                        dataKey="grayValue"
                        position="top"
                        fill="#6c757d"
                        fontSize={11}
                        fontWeight={600}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          className="bg-[#0d6efd] shadow-[0_2px_4px_rgba(13,110,253,0.3)] hover:-translate-y-px hover:bg-[#0b5ed7] hover:shadow-[0_4px_8px_rgba(13,110,253,0.4)]"
          onClick={() => setShowExportModal(true)}
          disabled={loading}
        >
          <Download size={18} />
          Xuất dữ liệu
        </Button>
      </div>

      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-[420px] gap-0 overflow-hidden rounded-xl p-0 [&>button]:top-4 [&>button]:right-4 [&>button]:size-7 [&>button]:rounded-md [&>button]:bg-[#fee2e2] [&>button]:text-[#ef4444] [&>button]:transition-all [&>button]:hover:bg-[#fecaca] [&>button]:hover:text-[#dc2626]">
          <DialogHeader className="flex-row items-center justify-between gap-3 border-b border-[#bae6fd] bg-[#e0f2fe] px-5 py-4">
            <DialogTitle className="text-[1.1rem] font-bold text-[#0369a1]">
              Xuất dữ liệu thống kê
            </DialogTitle>
          </DialogHeader>

          <div className="bg-[#f8f9fa] px-5 py-6">
            <div className="flex items-center gap-4">
              <label className="min-w-[130px] font-semibold text-[#495057]">
                Chọn định dạng:
              </label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="w-full flex-1 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-3 border-t border-[#e9ecef] bg-white px-5 py-4">
            <Button
              className="bg-[#fee2e2] text-[#ef4444] hover:bg-[#fca5a5] hover:text-[#dc2626]"
              onClick={() => setShowExportModal(false)}
            >
              Hủy
            </Button>
            <Button
              className="bg-[#0d6efd] shadow-[0_2px_4px_rgba(13,110,253,0.2)] hover:-translate-y-px hover:bg-[#0b5ed7] hover:shadow-[0_4px_6px_rgba(13,110,253,0.3)]"
              onClick={handleExport}
            >
              Tải xuống
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStatistics;
