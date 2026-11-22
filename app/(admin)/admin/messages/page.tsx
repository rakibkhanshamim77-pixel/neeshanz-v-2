export const dynamic = "force-dynamic";

import AdminTopbar from "@/app/(admin)/_components/AdminTopbar";
import AdminBreadcrumb from "@/app/(admin)/_components/AdminBreadcrumb";
import { guardPage, getCurrentUser } from "@/app/utils/authz";
import dbConnect from "@/db/connect/dbConnect";
import Conversation from "@/db/models/Conversation";
import InboxClient from "./_components/InboxClient";
import type { ConversationRow } from "@/lib/socket.types";

export default async function MessagesPage() {
  await guardPage("inbox_management");
  await dbConnect();

  const me = await getCurrentUser();
  const adminName = me?.name || me?.phone || "Admin";
  const adminId = me?.id || "";

  const rawConversations = await Conversation.find({})
    .sort({ lastMessageAt: -1 })
    .limit(100)
    .lean();

  const conversations: ConversationRow[] = rawConversations.map((c) => ({
    _id: String(c._id),
    guestId: c.guestId,
    guestName: c.guestName,
    guestEmail: c.guestEmail,
    status: c.status,
    lastMessage: c.lastMessage,
    lastMessageAt: c.lastMessageAt.toISOString(),
    unreadByAdmin: c.unreadByAdmin,
    unreadByCustomer: c.unreadByCustomer,
    createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
  }));

  const openCount = rawConversations.filter((c) => c.status === "open").length;
  const unreadCount = rawConversations.reduce((s, c) => s + c.unreadByAdmin, 0);

  return (
    <>
      <AdminTopbar />
      <main className="pg" style={{ display: "flex", flexDirection: "column" }}>
        <AdminBreadcrumb items={[{ label: "Messages" }]} />

        <div className="flex items-start justify-between mb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
              Inbox / Messenger
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--mute)" }}>
              কাস্টমারদের সাথে রিয়েল-টাইম কথোপকথন
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <div
              className="rounded-xl border px-5 py-2.5 text-center"
              style={{ background: "var(--surface)", borderColor: "var(--line)" }}
            >
              <p className="text-2xl font-bold leading-tight" style={{ color: "#22c55e" }}>
                {openCount}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--mute)" }}>
                খোলা
              </p>
            </div>
            <div
              className="rounded-xl border px-5 py-2.5 text-center"
              style={{ background: "var(--surface)", borderColor: "var(--line)" }}
            >
              <p className="text-2xl font-bold leading-tight" style={{ color: "#ef4444" }}>
                {unreadCount}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--mute)" }}>
                অপঠিত
              </p>
            </div>
          </div>
        </div>

        <InboxClient
          initialConversations={conversations}
          adminId={adminId}
          adminName={adminName}
        />
      </main>
    </>
  );
}
