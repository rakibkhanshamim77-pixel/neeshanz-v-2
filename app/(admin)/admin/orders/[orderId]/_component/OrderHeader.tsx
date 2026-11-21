import {
  STATUS_LABELS,
  STATUS_COLORS,
  PAYMENT_LABELS,
  PAYMENT_COLORS,
  fmtDate,
} from "./orderConstants";

interface Props {
  orderNumber: string;
  createdAt: Date | string;
  customerName: string;
  customerPhone: string;
  status: string;
  paymentStatus: string;
}

export default function OrderHeader({
  orderNumber,
  createdAt,
  customerName,
  customerPhone,
  status,
  paymentStatus,
}: Props) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5 pb-5 border-b border-[var(--line)]">
      <div className="min-w-0">
        <p className="text-xs text-[var(--mute)] font-semibold uppercase tracking-wider mb-1">
          Placed {fmtDate(createdAt)}
        </p>
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight leading-tight">
          #{orderNumber}
        </h2>
        <p className="text-sm text-[var(--mute)] mt-1">
          {customerName} &nbsp;·&nbsp; {customerPhone}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
            STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700"
          }`}
        >
          {STATUS_LABELS[status] ?? status}
        </span>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
            PAYMENT_COLORS[paymentStatus] ?? "bg-amber-100 text-amber-800"
          }`}
        >
          {PAYMENT_LABELS[paymentStatus] ?? paymentStatus}
        </span>
      </div>
    </div>
  );
}
