import { Outlet } from "react-router-dom";

function LayoutClientlogin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex w-[960px] max-w-[95vw] max-md:w-full max-md:flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_4px_32px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] md:min-h-[580px]">
        <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-[#CB1DC6] p-8 max-md:min-h-[280px] md:px-10 md:py-12">
          <div className="relative z-[2]">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0087f1_0%,#0058b8_100%)] text-2xl font-bold text-white">
                N
              </div>
              <span className="text-xl font-bold tracking-[-0.5px] text-white">
                Hr-agent
              </span>
            </div>
            <h2 className="mb-8 text-[32px] font-bold leading-[1.3] text-white max-md:mb-6 max-md:text-2xl">
              Nền tảng tuyển dụng <br /> thông minh
            </h2>
            <div className="flex flex-col gap-4 max-md:hidden">
              <div className="flex items-center gap-3 text-sm leading-[1.5] text-white/80">
                <span className="size-1.5 shrink-0 rounded-full bg-[linear-gradient(135deg,#00d4ff_0%,#0087f1_100%)]"></span>
                Tìm kiếm công việc phù hợp
              </div>
              <div className="flex items-center gap-3 text-sm leading-[1.5] text-white/80">
                <span className="size-1.5 shrink-0 rounded-full bg-[linear-gradient(135deg,#00d4ff_0%,#0087f1_100%)]"></span>
                Quản lý hồ sơ ứng tuyển
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center overflow-y-auto p-8 max-md:p-6 md:px-10 md:py-12">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default LayoutClientlogin;
