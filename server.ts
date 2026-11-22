import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT ?? "4000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// DB connect (lazy, reuse across events)
let dbConnected = false;
async function ensureDB() {
  if (dbConnected) return;
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(uri);
  dbConnected = true;
}

app.prepare().then(async () => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/api/socketio",
  });

  // Lazy-load models to avoid issues with Mongoose model re-registration
  async function getModels() {
    await ensureDB();
    const Conversation = (await import("./db/models/Conversation")).default;
    const Message = (await import("./db/models/Message")).default;
    return { Conversation, Message };
  }

  // ─── Admin namespace ─────────────────────────────────────────────────────────
  const adminNS = io.of("/admin-chat");

  adminNS.on("connection", (socket) => {
    console.log("[socket] admin connected:", socket.id);

    // Admin joins the global admin room to receive conversation list updates
    socket.join("admin-room");

    // Admin opens a specific conversation
    socket.on("admin:join_conversation", (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
      socket.emit("admin:joined", conversationId);
    });

    // Admin leaves a conversation
    socket.on("admin:leave_conversation", (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });

    // Admin sends a message
    socket.on(
      "admin:send_message",
      async (data: {
        conversationId: string;
        content: string;
        adminName: string;
        adminId: string;
      }) => {
        try {
          const { Conversation, Message } = await getModels();
          const msg = await Message.create({
            conversationId: new mongoose.Types.ObjectId(data.conversationId),
            senderType: "admin",
            senderId: data.adminId
              ? new mongoose.Types.ObjectId(data.adminId)
              : undefined,
            senderName: data.adminName,
            content: data.content.trim(),
            isRead: false,
          });

          await Conversation.findByIdAndUpdate(data.conversationId, {
            lastMessage: data.content.trim(),
            lastMessageAt: new Date(),
            $inc: { unreadByCustomer: 1 },
            unreadByAdmin: 0,
          });

          const payload = {
            _id: String(msg._id),
            conversationId: data.conversationId,
            senderType: "admin" as const,
            senderName: data.adminName,
            content: data.content.trim(),
            isRead: false,
            createdAt: new Date().toISOString(),
          };

          // Emit to everyone in the conversation room (admin + customer)
          io.of("/customer-chat")
            .to(`conv:${data.conversationId}`)
            .emit("new_message", payload);
          adminNS
            .to(`conv:${data.conversationId}`)
            .emit("new_message", payload);

          // Update conversation list for all admins
          adminNS.to("admin-room").emit("conversation:updated", {
            conversationId: data.conversationId,
            lastMessage: data.content.trim(),
            lastMessageAt: new Date().toISOString(),
          });
        } catch (err) {
          console.error("[socket] admin:send_message error:", err);
        }
      },
    );

    // Admin marks conversation as read
    socket.on("admin:mark_read", async (conversationId: string) => {
      try {
        const { Conversation, Message } = await getModels();
        await Conversation.findByIdAndUpdate(conversationId, {
          unreadByAdmin: 0,
        });
        await Message.updateMany(
          {
            conversationId: new mongoose.Types.ObjectId(conversationId),
            senderType: "customer",
            isRead: false,
          },
          { isRead: true },
        );
      } catch (err) {
        console.error("[socket] admin:mark_read error:", err);
      }
    });

    // Admin closes a conversation
    socket.on("admin:close_conversation", async (conversationId: string) => {
      try {
        const { Conversation } = await getModels();
        await Conversation.findByIdAndUpdate(conversationId, {
          status: "closed",
        });
        io.of("/customer-chat")
          .to(`conv:${conversationId}`)
          .emit("conversation:closed");
        adminNS.to("admin-room").emit("conversation:status_changed", {
          conversationId,
          status: "closed",
        });
      } catch (err) {
        console.error("[socket] admin:close_conversation error:", err);
      }
    });

    // Admin typing indicator
    socket.on("admin:typing", (conversationId: string) => {
      io.of("/customer-chat").to(`conv:${conversationId}`).emit("admin:typing");
    });

    socket.on("disconnect", () => {
      console.log("[socket] admin disconnected:", socket.id);
    });
  });

  // ─── Customer namespace ───────────────────────────────────────────────────────
  const customerNS = io.of("/customer-chat");

  customerNS.on("connection", (socket) => {
    console.log("[socket] customer connected:", socket.id);

    // Customer starts or resumes a conversation
    socket.on(
      "customer:start",
      async (data: {
        guestId: string;
        guestName: string;
        guestEmail?: string;
        userId?: string;
        conversationId?: string;
      }) => {
        try {
          const { Conversation } = await getModels();

          let conversation;
          if (data.conversationId) {
            conversation = await Conversation.findById(data.conversationId);
          }

          if (!conversation) {
            // Find existing open conversation for this guest
            conversation = await Conversation.findOne({
              guestId: data.guestId,
              status: { $ne: "closed" },
            });
          }

          if (!conversation) {
            conversation = await Conversation.create({
              guestId: data.guestId,
              userId: data.userId
                ? new mongoose.Types.ObjectId(data.userId)
                : undefined,
              guestName: data.guestName,
              guestEmail: data.guestEmail,
              lastMessage: "",
              lastMessageAt: new Date(),
            });

            // Notify all admins of new conversation
            adminNS.to("admin-room").emit("conversation:new", {
              _id: String(conversation._id),
              guestId: data.guestId,
              guestName: data.guestName,
              guestEmail: data.guestEmail,
              status: "open",
              lastMessage: "",
              lastMessageAt: new Date().toISOString(),
              unreadByAdmin: 0,
              createdAt: new Date().toISOString(),
            });
          }

          const convId = String(conversation._id);
          socket.join(`conv:${convId}`);
          socket.emit("customer:conversation_ready", {
            conversationId: convId,
            status: conversation.status,
          });
        } catch (err) {
          console.error("[socket] customer:start error:", err);
        }
      },
    );

    // Customer sends a message
    socket.on(
      "customer:send_message",
      async (data: {
        conversationId: string;
        guestName: string;
        content: string;
        userId?: string;
      }) => {
        try {
          const { Conversation, Message } = await getModels();

          const msg = await Message.create({
            conversationId: new mongoose.Types.ObjectId(data.conversationId),
            senderType: "customer",
            senderId: data.userId
              ? new mongoose.Types.ObjectId(data.userId)
              : undefined,
            senderName: data.guestName,
            content: data.content.trim(),
            isRead: false,
          });

          await Conversation.findByIdAndUpdate(data.conversationId, {
            lastMessage: data.content.trim(),
            lastMessageAt: new Date(),
            $inc: { unreadByAdmin: 1 },
            status: "open",
          });

          const payload = {
            _id: String(msg._id),
            conversationId: data.conversationId,
            senderType: "customer" as const,
            senderName: data.guestName,
            content: data.content.trim(),
            isRead: false,
            createdAt: new Date().toISOString(),
          };

          customerNS
            .to(`conv:${data.conversationId}`)
            .emit("new_message", payload);
          adminNS
            .to(`conv:${data.conversationId}`)
            .emit("new_message", payload);

          adminNS.to("admin-room").emit("conversation:updated", {
            conversationId: data.conversationId,
            lastMessage: data.content.trim(),
            lastMessageAt: new Date().toISOString(),
            unreadByAdmin: true,
          });
        } catch (err) {
          console.error("[socket] customer:send_message error:", err);
        }
      },
    );

    // Customer typing indicator
    socket.on("customer:typing", (conversationId: string) => {
      adminNS
        .to(`conv:${conversationId}`)
        .emit("customer:typing", conversationId);
    });

    socket.on("disconnect", () => {
      console.log("[socket] customer disconnected:", socket.id);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
