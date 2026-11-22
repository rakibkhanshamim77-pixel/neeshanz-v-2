export interface ConversationRow {
  _id: string;
  guestId: string;
  guestName: string;
  guestEmail?: string;
  status: "open" | "pending" | "closed";
  lastMessage: string;
  lastMessageAt: string;
  unreadByAdmin: number;
  unreadByCustomer: number;
  createdAt: string;
}

export interface MessageRow {
  _id: string;
  conversationId: string;
  senderType: "customer" | "admin";
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// Events emitted by admin client → server
export interface AdminEmitEvents {
  "admin:join_conversation": (conversationId: string) => void;
  "admin:leave_conversation": (conversationId: string) => void;
  "admin:send_message": (data: {
    conversationId: string;
    content: string;
    adminName: string;
    adminId: string;
  }) => void;
  "admin:mark_read": (conversationId: string) => void;
  "admin:close_conversation": (conversationId: string) => void;
  "admin:typing": (conversationId: string) => void;
}

// Events received by admin client ← server
export interface AdminListenEvents {
  "admin:joined": (conversationId: string) => void;
  new_message: (msg: MessageRow) => void;
  "conversation:new": (conv: ConversationRow) => void;
  "conversation:updated": (data: {
    conversationId: string;
    lastMessage: string;
    lastMessageAt: string;
    unreadByAdmin?: boolean;
  }) => void;
  "conversation:status_changed": (data: {
    conversationId: string;
    status: string;
  }) => void;
  "conversation:closed": () => void;
  "customer:typing": (conversationId: string) => void;
}

// Events emitted by customer client → server
export interface CustomerEmitEvents {
  "customer:start": (data: {
    guestId: string;
    guestName: string;
    guestEmail?: string;
    userId?: string;
    conversationId?: string;
  }) => void;
  "customer:send_message": (data: {
    conversationId: string;
    guestName: string;
    content: string;
    userId?: string;
  }) => void;
  "customer:typing": (conversationId: string) => void;
}

// Events received by customer client ← server
export interface CustomerListenEvents {
  "customer:conversation_ready": (data: {
    conversationId: string;
    status: string;
  }) => void;
  new_message: (msg: MessageRow) => void;
  "admin:typing": () => void;
  "conversation:closed": () => void;
}
