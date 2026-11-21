import AdminSidebarLogo from "./AdminSidebarLogo";
import AdminSidebarNav from "./AdminSidebarNav";
import AdminSidebarFooter from "./AdminSidebarFooter";

export default function AdminSidebar() {
  return (
    <>
      {/* Mobile scrim overlay */}
      <div
        id="scrim"
        className="scrim fixed inset-0 z-40 bg-black/50 opacity-0 pointer-events-none lg:hidden"
      />
      <aside className="drawer side fixed inset-y-0 left-0 z-50 w-[264px] bg-surface border-r border-line flex flex-col">
        <AdminSidebarLogo />
        <AdminSidebarNav />
        <AdminSidebarFooter />
      </aside>
    </>
  );
}
