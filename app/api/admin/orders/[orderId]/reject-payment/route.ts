import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { SESSION_COOKIE, verifySession } from "@/app/utils/session";
import dbConnect from "@/db/connect/dbConnect";
import Order from "@/db/models/Order";
import User from "@/db/models/User";

async function requireAdmin() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = verifySession(token);
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } },
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!mongoose.isValidObjectId(params.orderId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: { reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const reason = body.reason?.trim();
  if (!reason) {
    return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
  }

  try {
    await dbConnect();

    const order = await Order.findById(params.orderId);
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (order.payment.status !== "processing") {
      return NextResponse.json(
        { error: "Only processing payments can be rejected" },
        { status: 400 },
      );
    }

    const admin = await User.findById(session.userId).select("phone name").lean();
    const adminLabel = admin?.name ?? admin?.phone ?? session.userId;

    const now = new Date();
    await Order.findByIdAndUpdate(params.orderId, {
      $set: {
        "payment.status": "failed",
        "payment.rejectionReason": reason,
      },
      $push: {
        activities: {
          _id: new mongoose.Types.ObjectId(),
          type: "payment_rejected",
          title: "পেমেন্ট প্রত্যাখ্যান করা হয়েছে",
          description: `${adminLabel} পেমেন্ট প্রত্যাখ্যান করেছেন। কারণ: ${reason}`,
          performedBy: new mongoose.Types.ObjectId(session.userId),
          performedByRole: "admin",
          isInternal: false,
          createdAt: now,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
