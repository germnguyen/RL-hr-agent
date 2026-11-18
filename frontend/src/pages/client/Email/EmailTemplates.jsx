import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Mail,
  Users,
  ChevronRight,
  Info,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from "lucide-react";

const EMAIL_TEMPLATES = [
  {
    id: 1,
    name: "Mẫu 1",
    type: "interview",
    title: "[HR-Agent] Thư mời phỏng vấn vị trí [Tên Vị Trí]",
    content: `Thân gửi [Tên Ứng Viên],

Cảm ơn bạn đã ứng tuyển vị trí [Tên Vị Trí] tại công ty chúng tôi. Hệ thống và đội tuyển dụng rất ấn tượng với các kỹ năng của bạn.

Chúng tôi rất muốn tìm hiểu thêm về bạn thông qua một cuộc phỏng vấn. Dưới đây là thông tin buổi phỏng vấn:

**Thông tin buổi phỏng vấn:**
- Thời gian: [Giờ] ngày [Ngày/Tháng/Năm]
- Hình thức: Phỏng vấn trực tuyến qua Google Meet
- Link tham gia: [Link Google Meet]
- Người phỏng vấn: [Tên người phỏng vấn]

Vui lòng xác nhận tham gia qua email này để chúng tôi sắp xếp lịch thích hợp. Nếu bạn không thể tham gia vào thời gian trên, vui lòng liên hệ với chúng tôi sớm.

Trân trọng,
[Tên Chuyên Viên / Công ty]`,
  },
  {
    id: 2,
    name: "Mẫu 2",
    type: "result",
    title: "[HR-Agent] Kết quả phỏng vấn",
    content: `Thân gửi [Tên Ứng Viên],

Cảm ơn bạn đã dành thời gian tham gia buổi phỏng vấn cho vị trí [Tên Vị Trí]. Đây là cơ hội tốt để chúng tôi tìm hiểu rõ hơn về kinh nghiệm và kỹ năng của bạn.

Sau khi xem xét kỹ lưỡng, chúng tôi quyết định tiếp tục với vòng phỏng vấn tiếp theo. Chúng tôi sẽ liên hệ với bạn trong vòng [X] ngày để sắp xếp lịch.

Nếu bạn có bất kỳ câu hỏi nào, vui lòng không ngần ngại liên hệ với chúng tôi.

Trân trọng,
[Tên Chuyên Viên / Công ty]`,
  },
  {
    id: 3,
    name: "Mẫu 3",
    type: "rejection",
    title: "[HR-Agent] Thư từ chối ứng tuyển",
    content: `Thân gửi [Tên Ứng Viên],

Cảm ơn bạn đã ứng tuyển và tham gia phỏng vấn cho vị trí [Tên Vị Trí] tại công ty chúng tôi. Chúng tôi đánh giá cao sự nỗ lực và kinh nghiệm của bạn.

Tuy nhiên, sau khi xem xét toàn bộ các ứng viên, chúng tôi quyết định tiếp tục với các ứng viên khác có kinh nghiệm phù hợp hơn với vị trí này.

Chúng tôi hy vọng sẽ có cơ hội hợp tác với bạn trong tương lai. Vui lòng theo dõi các cơ hội việc làm khác trên website của chúng tôi.

Trân trọng,
[Tên Chuyên Viên / Công ty]`,
  },
  {
    id: 4,
    name: "Mẫu 4",
    type: "update",
    title: "[HR-Agent] Thư chào hỏi cập nhật tiến độ",
    content: `Thân gửi [Tên Ứng Viên],

Chúng tôi muốn cập nhật cho bạn về tiến độ của hồ sơ ứng tuyển vị trí [Tên Vị Trí].

Hiện tại, hồ sơ của bạn đang được xem xét kỹ lưỡng bởi đội tuyển dụng. Chúng tôi sẽ liên hệ với bạn trong vòng [X] ngày nữa để thông báo kết quả hoặc sắp xếp vòng phỏng vấn tiếp theo.

Nếu bạn có bất kỳ câu hỏi hay cần thêm thông tin, vui lòng liên hệ với chúng tôi.

Trân trọng,
[Tên Chuyên Viên / Công ty]`,
  },
];

const EmailTemplates = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedCandidates] = useState(() => {
    const state = location.state?.selectedCandidateIds;
    return state && Array.isArray(state) ? state : [];
  });

  useEffect(() => {
    const state = location.state?.selectedCandidateIds;
    if (!state || !Array.isArray(state) || state.length === 0) {
      toast.warning("Không có ứng viên nào được chọn!");
      navigate("/candidates");
    }
  }, [navigate, location]);

  const handleSelectTemplate = (template) => {
    navigate(`/candidates/emails/${template.id}/detail`, {
      state: {
        selectedTemplate: template,
        selectedCandidateIds: selectedCandidates,
      },
    });
  };

  const getTemplateIcon = (type) => {
    switch (type) {
      case "interview":
        return <Calendar className="size-4 text-blue-600" />;
      case "result":
        return <CheckCircle2 className="size-4 text-emerald-600" />;
      case "rejection":
        return <XCircle className="size-4 text-amber-600" />;
      default:
        return <Clock className="size-4 text-indigo-600" />;
    }
  };

  const getTemplateBadge = (type) => {
    switch (type) {
      case "interview":
        return (
          <Badge className="border-transparent bg-blue-50 text-blue-700">
            Thư mời phỏng vấn
          </Badge>
        );
      case "result":
        return (
          <Badge className="border-transparent bg-emerald-50 text-emerald-700">
            Kết quả phỏng vấn
          </Badge>
        );
      case "rejection":
        return (
          <Badge className="border-transparent bg-amber-50 text-amber-700">
            Thư từ chối
          </Badge>
        );
      default:
        return (
          <Badge className="border-transparent bg-indigo-50 text-indigo-700">
            Cập nhật tiến độ
          </Badge>
        );
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3.5 pb-6">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/candidates")}
          className="gap-1.5 text-xs font-semibold text-slate-600 hover:text-ink hover:bg-slate-100 rounded-sm"
        >
          <ArrowLeft className="size-4" /> Quay lại danh sách ứng viên
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-sm bg-brand/10 text-brand">
              <Mail className="size-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Danh sách mẫu email
            </h1>
          </div>
          <p className="text-xs text-subtle pl-9">
            Lựa chọn mẫu thư liên hệ phù hợp để gửi thông báo hàng loạt cho các ứng viên đã chọn.
          </p>
        </div>

        <div className="pl-9 sm:pl-0">
          <Badge className="bg-brand text-white text-xs px-2.5 py-0.5 rounded-sm">
            <Users className="mr-1.5 size-3.5" />
            Đã chọn {selectedCandidates.length} ứng viên
          </Badge>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        {/* Templates list (2 cols) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
          {EMAIL_TEMPLATES.map((template) => (
            <Card
              key={template.id}
              className="group flex flex-col justify-between border-border/80 bg-white transition-all duration-200 hover:border-brand/60 hover:shadow-md"
            >
              <CardHeader className="space-y-2 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-brand/10 transition-colors">
                      {getTemplateIcon(template.type)}
                    </div>
                    <span className="text-sm font-bold text-ink">
                      {template.name}
                    </span>
                  </div>
                  {getTemplateBadge(template.type)}
                </div>

                <CardTitle className="text-sm font-semibold text-slate-800 line-clamp-1 pt-1">
                  {template.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="pb-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs leading-relaxed text-slate-600 line-clamp-4">
                  {template.content}
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <Button
                  className="w-full justify-between rounded-xl bg-slate-50 text-slate-700 border border-slate-200 hover:bg-brand hover:text-white hover:border-brand transition-all"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <span className="text-xs font-semibold">Chọn và chỉnh sửa mẫu</span>
                  <ChevronRight className="size-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Side Panel (1 col) */}
        <div className="space-y-3.5">
          <Card className="border-border/80 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Info className="size-4 text-brand" />
                Thông tin gửi thư
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 pt-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Ứng viên nhận thư:</span>
                <span className="font-bold text-ink text-sm">
                  {selectedCandidates.length}
                </span>
              </div>

              <div className="space-y-2 rounded-xl bg-blue-50/50 border border-blue-100 p-3 text-blue-950">
                <div className="flex items-center gap-1.5 font-semibold text-brand">
                  <Sparkles className="size-3.5" /> Cá nhân hóa tự động
                </div>
                <p className="text-[12px] leading-relaxed text-blue-900">
                  Mỗi ứng viên sẽ nhận được email với tên, vị trí ứng tuyển và thông tin chi tiết riêng biệt được điền tự động.
                </p>
              </div>

              <div className="space-y-1.5 text-slate-500">
                <p className="font-medium text-slate-700">Quy trình thực hiện:</p>
                <ol className="list-decimal space-y-1 pl-4 text-[12px]">
                  <li>Chọn một mẫu thư phù hợp ở danh sách bên cạnh.</li>
                  <li>Tùy chỉnh tiêu đề và nội dung theo mong muốn.</li>
                  <li>Xem trước và xác nhận gửi hàng loạt.</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplates;
