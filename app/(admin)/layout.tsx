import { redirect } from "next/navigation";

import { getUser } from "@/app/utils/getUser";
import AdminSidebar from "./_components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const canAccess =
    user?.role === "admin" ||
    (user?.role === "moderator" &&
      user.permissions.includes("order_management"));
  if (!user || !canAccess) redirect("/login");

  return (
    <div className="min-h-screen bg-[var(--soft)]">
      {/* Top bar */}

      <AdminSidebar />
      <div className="lg:pl-[264px] min-h-screen">{children}</div>
    </div>
  );
}
