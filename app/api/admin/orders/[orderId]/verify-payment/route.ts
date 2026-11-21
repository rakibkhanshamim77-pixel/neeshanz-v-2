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
  _req: NextRequest,
  { params }: { params: { orderId: string } },
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!mongoose.isValidObjectId(params.orderId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    await dbConnect();

    const order = await Order.findById(params.orderId);
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (order.payment.status !== "processing") {
      return NextResponse.json(
        { error: "Only processing payments can be verified" },
        { status: 400 },
      );
    }

    const admin = await User.findById(session.userId).select("phone name").lean();
    const adminLabel = admin?.name ?? admin?.phone ?? session.userId;

    const now = new Date();
    await Order.findByIdAndUpdate(params.orderId, {
      $set: {
        "payment.status": "paid",
        "payment.paidAmount": order.payment.amount,
        "payment.dueAmount": 0,
        "payment.paidAt": now,
        "payment.verifiedAt": now,
        "payment.verifiedBy": new mongoose.Types.ObjectId(session.userId),
      },
      $push: {
        activities: {
          _id: new mongoose.Types.ObjectId(),
          type: "payment_verified",
          title: "পেমেন্ট যাচাই করা হয়েছে",
          description: `${adminLabel} পেমেন্ট যাচাই করেছেন`,
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
