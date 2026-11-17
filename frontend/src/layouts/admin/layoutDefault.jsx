import { Outlet } from "react-router-dom";
import Sider from "../../components/admin/ui/Sider";
import Header from "../../components/admin/ui/Header";

function LayoutDefault() {
  return (
    <div className="flex min-h-screen">
      <Sider />
      <div className="ml-[260px] flex min-h-screen flex-1 flex-col bg-surface">
        <Header />
        <main className="flex-1 overflow-y-auto px-8 py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default LayoutDefault;
