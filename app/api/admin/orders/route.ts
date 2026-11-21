import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
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

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const skip = (page - 1) * limit;

  const status = searchParams.get("status");
  const paymentStatus = searchParams.get("paymentStatus");
  const paymentMethod = searchParams.get("paymentMethod");
  const q = searchParams.get("q")?.trim();
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};

  if (status) filter.status = status;
  if (paymentStatus) filter["payment.status"] = paymentStatus;
  if (paymentMethod) filter["payment.method"] = paymentMethod;

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  if (q) {
    filter.$or = [
      { orderNumber: { $regex: q, $options: "i" } },
      { "customer.name": { $regex: q, $options: "i" } },
      { "customer.phone": { $regex: q, $options: "i" } },
    ];
  }

  try {
    await dbConnect();

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-activities -__v")
        .lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
