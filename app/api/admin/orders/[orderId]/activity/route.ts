import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { SESSION_COOKIE, verifySession } from "@/app/utils/session";
import dbConnect from "@/db/connect/dbConnect";
import Order from "@/db/models/Order";

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

  if (!mongoose.isValidObjectId(params.orderId))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: { note?: string; isInternal?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const note = body.note?.trim();
  if (!note) return NextResponse.json({ error: "Note cannot be empty" }, { status: 400 });

  try {
    await dbConnect();

    const activity = {
      _id: new mongoose.Types.ObjectId(),
      type: "admin_note",
      title: "অ্যাডমিন নোট",
      description: note,
      performedBy: new mongoose.Types.ObjectId(session.userId),
      performedByRole: "admin",
      isInternal: body.isInternal ?? true,
      createdAt: new Date(),
    };

    const order = await Order.findByIdAndUpdate(
      params.orderId,
      { $push: { activities: activity } },
      { new: true },
    ).lean();

    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ activity });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
