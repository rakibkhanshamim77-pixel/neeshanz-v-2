import dbConnect from "@/db/connect/dbConnect";
import Order from "@/db/models/Order";
import { getUser } from "@/app/utils/getUser";
import AdminTopbar from "../../_components/AdminTopbar";
import OrdersStats from "./_components/OrdersStats";
import OrdersFilters from "./_components/OrdersFilters";
import OrdersTable from "./_components/OrdersTable";
import OrdersMobileCards from "./_components/OrdersMobileCards";
import OrdersPagination from "./_components/OrdersPagination";
import { DEFAULT_LIMIT } from "./_components/ordersConstants";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  status?: string;
  payment?: string;
  page?: string;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getUser();

  const q = (searchParams.q ?? "").trim();
  const status = searchParams.status ?? "";
  const payment = searchParams.payment ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const skip = (page - 1) * DEFAULT_LIMIT;

  await dbConnect();

  // Build filter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (status) filter.status = status;
  if (payment) filter["payment.status"] = payment;
  if (q) {
    const re = new RegExp(q, "i");
    filter.$or = [
      { orderNumber: re },
      { "customer.name": re },
      { "customer.phone": re },
      { "payment.transactionId": re },
    ];
  }

  // Parallel queries
  const [
    orders,
    total,
    statsTotal,
    statsPendingPayment,
    statsActive,
    statsDelivered,
    revenueAgg,
  ] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(DEFAULT_LIMIT)
      .select(
        "orderNumber createdAt status customer.name customer.phone items.name payment.method payment.status payment.gateway totalAmount"
      )
      .lean(),
    Order.countDocuments(filter),
    Order.countDocuments({}),
    Order.countDocuments({ "payment.status": "pending" }),
    Order.countDocuments({
      status: { $in: ["confirmed", "processing", "shipped"] },
    }),
    Order.countDocuments({ status: "delivered" }),
    Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
  ]);

  const revenue: number = revenueAgg[0]?.total ?? 0;
  const totalPages = Math.ceil(total / DEFAULT_LIMIT);

  // Serialize orders for client components
  const orderRows = orders.map((o) => ({
    _id: String(o._id),
    orderNumber: o.orderNumber,
    createdAt: o.createdAt!.toISOString(),
    status: o.status,
    customerName: o.customer.name,
    customerPhone: o.customer.phone,
    itemCount: o.items.length,
    itemNames: o.items
      .slice(0, 2)
      .map((i) => i.name)
      .join(", "),
    totalAmount: o.totalAmount,
    paymentMethod: o.payment.method,
    paymentStatus: o.payment.status,
    paymentGateway: o.payment.gateway,
  }));

  function buildUrl(p: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    if (payment) sp.set("payment", payment);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <AdminTopbar
        title="Orders"
        subtitle="Verify payments, update status and keep customers informed"
        userName={user?.name}
        userRole={user?.role}
      />

      <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1400px]">

        <OrdersStats
          total={statsTotal}
          pendingPayment={statsPendingPayment}
          active={statsActive}
          delivered={statsDelivered}
          revenue={revenue}
        />

        <OrdersFilters
          currentStatus={status}
          currentPayment={payment}
          currentQ={q}
          total={total}
        />

        <OrdersTable orders={orderRows} />
        <OrdersMobileCards orders={orderRows} />

        <OrdersPagination
          page={page}
          totalPages={totalPages}
          buildUrl={buildUrl}
        />
      </main>
    </div>
  );
}
