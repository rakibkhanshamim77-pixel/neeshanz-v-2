import Link from "next/link";
import {
  fmt,
  STATUS_LABELS,
  STATUS_COLORS,
  PAYMENT_LABELS,
  PAYMENT_COLORS,
} from "./ordersConstants";

interface OrderRow {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  customerName: string;
  customerPhone: string;
  itemCount: number;
  itemNames: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentGateway?: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("bn-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function OrdersTable({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <section className="card hidden md:block">
        <div className="py-20 text-center text-[var(--mute)]">
          <svg
            className="w-12 h-12 mx-auto mb-4 opacity-30"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
            <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
          </svg>
          <p className="text-sm font-medium">No orders found</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card hidden md:block mb-5">
      <div className="overflow-x-auto rounded-[24px]">
        <table className="ptbl w-full">
          <thead>
            <tr>
              <th>অর্ডার</th>
              <th>গ্রাহক</th>
              <th>পণ্য</th>
              <th className="text-right">মোট</th>
              <th>পেমেন্ট</th>
              <th>স্ট্যাটাস</th>
              <th className="text-right">বিস্তারিত</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>
                  <div>
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="font-display font-bold text-sm hover:underline underline-offset-2"
                    >
                      #{order.orderNumber}
                    </Link>
                    <p className="text-xs text-[var(--mute)] mt-0.5">
                      {fmtDate(order.createdAt)}
                    </p>
                  </div>
                </td>
                <td>
                  <div>
                    <p className="font-semibold text-sm">{order.customerName}</p>
                    <p className="text-xs text-[var(--mute)] font-mono">
                      {order.customerPhone}
                    </p>
                  </div>
                </td>
                <td>
                  <div>
                    <p className="text-sm line-clamp-1 max-w-[200px]">
                      {order.itemNames}
                    </p>
                    {order.itemCount > 1 && (
                      <p className="text-xs text-[var(--mute)] mt-0.5">
                        +{order.itemCount - 1} আরও
                      </p>
                    )}
                  </div>
                </td>
                <td className="text-right">
                  <span className="font-display font-bold text-sm">
                    {fmt(order.totalAmount)}
                  </span>
                </td>
                <td>
                  <div>
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        PAYMENT_COLORS[order.paymentStatus] ??
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}
                    </span>
                    <p className="text-xs text-[var(--mute)] mt-0.5 capitalize">
                      {order.paymentMethod === "cod"
                        ? "COD"
                        : order.paymentGateway ?? "অনলাইন"}
                    </p>
                  </div>
                </td>
                <td>
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </td>
                <td className="text-right">
                  <Link
                    href={`/admin/orders/${order._id}`}
                    className="btn-ghost !h-9 !px-3 text-xs inline-flex"
                  >
                    দেখুন
                    <svg
                      className="w-3.5 h-3.5 ml-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
