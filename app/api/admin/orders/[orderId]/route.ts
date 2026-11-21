import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { SESSION_COOKIE, verifySession } from "@/app/utils/session";
import dbConnect from "@/db/connect/dbConnect";
import Order from "@/db/models/Order";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function requireAdmin() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = verifySession(token);
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { orderId: string } },
) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  if (!mongoose.isValidObjectId(params.orderId))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    await dbConnect();
    const order = await Order.findById(params.orderId).lean();
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const ORDER_STATUSES = [
  "pending","confirmed","processing","shipped","delivered",
  "cancelled","returned","refunded",
];

const PAYMENT_STATUSES = [
  "pending","processing","paid","partially_paid","failed","refunded","partially_refunded",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } },
) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  if (!mongoose.isValidObjectId(params.orderId))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const $set: Record<string, any> = {};
  const activity: Record<string, unknown> = {
    performedBy: new mongoose.Types.ObjectId(session.userId),
    performedByRole: "admin",
    isInternal: false,
    createdAt: new Date(),
  };

  if (body.status) {
    if (!ORDER_STATUSES.includes(body.status as string))
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    $set.status = body.status;
    activity.type = "status_updated";
    activity.title = `অর্ডার স্ট্যাটাস আপডেট: ${body.status}`;
    activity.status = body.status as string;
  }

  if (body.paymentStatus) {
    if (!PAYMENT_STATUSES.includes(body.paymentStatus as string))
      return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
    $set["payment.status"] = body.paymentStatus;
    activity.type = activity.type ?? "payment_updated";
    activity.title = activity.title ?? `পেমেন্ট স্ট্যাটাস আপডেট: ${body.paymentStatus}`;
  }

  if (body.trackingNumber) $set["delivery.trackingNumber"] = body.trackingNumber;
  if (body.trackingUrl) $set["delivery.trackingUrl"] = body.trackingUrl;
  if (body.courier) $set["delivery.courier"] = body.courier;

  if (!Object.keys($set).length)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  try {
    await dbConnect();

    const order = await Order.findByIdAndUpdate(
      params.orderId,
      {
        $set,
        $push: {
          activities: { ...activity, _id: new mongoose.Types.ObjectId() },
        },
      },
      { new: true },
    ).lean();

    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
