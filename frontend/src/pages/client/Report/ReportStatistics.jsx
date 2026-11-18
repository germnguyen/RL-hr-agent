import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Filter,
  TrendingUp,
  FileText,
  Mail,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import reportService from '../../../services/client/reportService';
import { toast } from 'react-toastify';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

const ReportStatistics = () => {
  const navigate = useNavigate();
  const [filterCriteria, setFilterCriteria] = useState('Toàn thời gian');
  const [filterMonth, setFilterMonth] = useState('1');
  const [filterWeek, setFilterWeek] = useState('1');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalCVs: 0,
    totalEmailsSent: 0,
    responseRate: '0%',
    chartData: []
  });

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('');

  const fetchStatistics = useCallback(async () => {
    let filterDate = '';
    if (filterCriteria === 'Theo tháng') filterDate = filterMonth;
    else if (filterCriteria === 'Theo Tuần') filterDate = filterWeek;

    try {
      setLoading(true);
      const response = await reportService.getStatistics(filterCriteria, filterDate);
      if (response && response.success) {
        setStats(response.data);

        if (filterCriteria === 'Theo tháng' && response.data.totalCVs === 0 && response.data.totalEmailsSent === 0) {
          toast.info('Không có dữ liệu thống kê!', {
            position: "top-right",
            autoClose: 3000,
          });
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải thống kê:', error);
      toast.error('Lỗi khi tải dữ liệu thống kê!');
    } finally {
      setLoading(false);
    }
  }, [filterCriteria, filterMonth, filterWeek]);

  React.useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  React.useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'hr-agent-sync') {
        try {
          const syncData = JSON.parse(e.newValue);
          if (syncData && syncData.type === 'candidate-status-changed') {
            console.log('Detected status change from another tab, updating stats:', syncData);
            setTimeout(() => {
              fetchStatistics();
            }, 1000);
          }
        } catch (err) {
          console.error('Error parsing sync data:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    console.log('Storage listener registered for cross-tab sync');

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchStatistics]);

  React.useEffect(() => {
    const handleCustomEvent = (e) => {
      console.log('Detected status change from custom event, updating stats:', e.detail);
      setTimeout(() => {
        fetchStatistics();
      }, 1000);
    };

    window.addEventListener('candidate-status-changed', handleCustomEvent);
    console.log('Custom event listener registered for same-tab sync');

    return () => {
      window.removeEventListener('candidate-status-changed', handleCustomEvent);
    };
  }, [fetchStatistics]);

  const handleBack = () => {
    navigate(-1);
  };

  const exportToExcel = () => {
    const summaryData = [
      { 'Chỉ số': 'Số lượng CV đã tiếp nhận', 'Giá trị': stats.totalCVs },
      { 'Chỉ số': 'Số lịch phỏng vấn đã tạo', 'Giá trị': stats.totalEmailsSent },
      { 'Chỉ số': 'Tỷ lệ phỏng vấn hoàn thành', 'Giá trị': stats.responseRate },
      { 'Chỉ số': '', 'Giá trị': '' }
    ];

    const chartDataFormatted = (stats.chartData || []).map(item => ({
      'Thời gian': item.name,
      'CV tiếp nhận': item.blueValue,
      'Lịch phỏng vấn': item.orangeValue,
      'Hoàn thành': item.grayValue
    }));

    const finalData = [...summaryData, ...chartDataFormatted];

    const ws = XLSX.utils.json_to_sheet(finalData);

    ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Thong_Ke");

    XLSX.writeFile(wb, `Bao_Cao_Thong_Ke_${filterCriteria.replace(' ', '_')}.xlsx`);
  };

  const exportToPDF = async () => {
    const reportElement = document.getElementById("report-client-content");
    if (!reportElement) {
      toast.error("Không tìm thấy nội dung để xuất PDF!");
      return;
    }

    try {
      toast.info("Đang xử lý PDF, vui lòng chờ...", { autoClose: 2000 });
      const canvas = await html2canvas(reportElement, { scale: 2, backgroundColor: "#f8f9fa" });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Bao_Cao_Thong_Ke_${filterCriteria.replace(' ', '_')}.pdf`);
      toast.success("Xuất PDF thành công!");
    } catch (error) {
      console.error("Lỗi xuất PDF: ", error);
      toast.error("Đã xảy ra lỗi khi tạo file PDF.");
    }
  };

  const handleExport = () => {
    if (exportFormat === 'excel') {
      exportToExcel();
    } else {
      exportToPDF();
    }
    setShowExportModal(false);
  };

  return (
    <div className="space-y-3 pb-6 max-w-7xl mx-auto font-sans">
      {/* Back button and page header */}
      <div className="mb-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-subtle hover:text-ink transition-colors mb-2 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Quay lại</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">Báo cáo &amp; Thống kê</h1>
            <p className="text-xs sm:text-sm text-subtle mt-0.5">
              Tổng quan về tình hình tiếp nhận CV và hiệu quả quy trình phỏng vấn
            </p>
          </div>
          <Button
            onClick={() => { setExportFormat(''); setShowExportModal(true); }}
            className="bg-brand hover:bg-brand-dark text-white font-medium shadow-2xs gap-2 self-start sm:self-auto cursor-pointer rounded-sm h-8.5 px-3.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Xuất dữ liệu
          </Button>
        </div>
      </div>

      {/* Main Report Content Wrapper (captured by html2canvas for PDF) */}
      <div id="report-client-content" className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 bg-surface p-0.5 rounded-sm">
        {/* Left Column: Filters and Stats */}
        <div className="lg:col-span-5 flex flex-col gap-3.5">
          {/* Filters Card */}
          <Card className="border-border bg-white dark:bg-card shadow-2xs rounded-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
                <Filter className="w-4 h-4 text-brand" />
                Bộ lọc thống kê
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="text-sm font-semibold text-ink sm:w-28 shrink-0">
                  Tiêu chí lọc :
                </label>
                <select
                  className="flex-1 h-10 px-3 py-2 text-sm bg-white dark:bg-card border border-input rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-ink cursor-pointer"
                  value={filterCriteria}
                  onChange={(e) => setFilterCriteria(e.target.value)}
                >
                  <option value="Toàn thời gian">Toàn thời gian</option>
                  <option value="Theo tháng">Theo tháng</option>
                  <option value="Theo Tuần">Theo Tuần</option>
                </select>
              </div>

              {filterCriteria === 'Theo tháng' && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="text-sm font-semibold text-ink sm:w-28 shrink-0">
                    Thời gian :
                  </label>
                  <select
                    className="flex-1 h-10 px-3 py-2 text-sm bg-white dark:bg-card border border-input rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-ink cursor-pointer"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={String(m)}>Tháng {m}</option>
                    ))}
                  </select>
                </div>
              )}

              {filterCriteria === 'Theo Tuần' && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="text-sm font-semibold text-ink sm:w-28 shrink-0">
                    Thời gian :
                  </label>
                  <select
                    className="flex-1 h-10 px-3 py-2 text-sm bg-white dark:bg-card border border-input rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-ink cursor-pointer"
                    value={filterWeek}
                    onChange={(e) => setFilterWeek(e.target.value)}
                  >
                    {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={String(w)}>Tuần {w}</option>
                    ))}
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Summary Card */}
          <Card className="border-border bg-white dark:bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand" />
                Tổng hợp chỉ số
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 divide-y divide-border/60">
              {loading ? (
                <div className="py-8 text-center text-sm text-subtle animate-pulse">
                  Đang tải dữ liệu...
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between py-3.5 first:pt-0">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-subtle">
                        Số lượng CV đã quét/thu nhập:
                      </span>
                    </div>
                    <span className="text-lg font-bold text-ink">{stats.totalCVs}</span>
                  </div>

                  <div className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-subtle">
                        Số lượng email đã gửi:
                      </span>
                    </div>
                    <span className="text-lg font-bold text-ink">{stats.totalEmailsSent}</span>
                  </div>

                  <div className="flex items-center justify-between py-3.5 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-subtle">
                        Tỷ lệ phản hồi:
                      </span>
                    </div>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {stats.responseRate}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Chart */}
        <div className="lg:col-span-7">
          <Card className="border-border bg-white dark:bg-card shadow-xs h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-brand" />
                  Biểu đồ thống kê CV
                </CardTitle>
                <Badge variant="secondary" className="text-xs font-normal">
                  {filterCriteria}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex-1 min-h-[350px]">
              <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  {loading ? (
                    <div className="flex items-center justify-center h-full text-sm text-subtle animate-pulse">
                      Đang tải biểu đồ...
                    </div>
                  ) : (
                    <BarChart
                      data={stats.chartData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 0,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px',
                        }}
                        cursor={{ fill: 'rgba(0, 135, 241, 0.05)' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />

                      <Bar dataKey="blueValue" name="CV tiếp nhận" fill="#0087f1" radius={[4, 4, 0, 0]} maxBarSize={45}>
                        <LabelList dataKey="blueValue" position="top" fill="#64748b" fontSize={11} fontWeight={600} />
                      </Bar>
                      <Bar dataKey="orangeValue" name="Lịch phỏng vấn" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={45}>
                        <LabelList dataKey="orangeValue" position="top" fill="#64748b" fontSize={11} fontWeight={600} />
                      </Bar>
                      <Bar dataKey="grayValue" name="Hoàn thành" fill="#64748b" radius={[4, 4, 0, 0]} maxBarSize={45}>
                        <LabelList dataKey="grayValue" position="top" fill="#64748b" fontSize={11} fontWeight={600} />
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Report Footer */}
      <div className="mt-3.5 flex justify-end">
        <Button
          onClick={() => { setExportFormat(''); setShowExportModal(true); }}
          className="bg-brand hover:bg-brand-dark text-white font-medium shadow-xs gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Xuất dữ liệu
        </Button>
      </div>

      {/* Export Modal using shadcn Dialog */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-ink">
              Xuất dữ liệu thống kê
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-sm font-semibold text-ink sm:min-w-[130px]">
                Chọn định dạng :
              </label>
              <select
                className="flex-1 h-10 px-3 py-2 text-sm bg-white dark:bg-card border border-input rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-ink cursor-pointer"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <option value="" disabled>-- Chọn định dạng --</option>
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => { setExportFormat(''); setShowExportModal(false); }}
              className="cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              className="bg-brand hover:bg-brand-dark text-white cursor-pointer"
              onClick={handleExport}
              disabled={!exportFormat}
            >
              Tải xuống
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportStatistics;
