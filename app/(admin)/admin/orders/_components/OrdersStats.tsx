import { fmt } from "./ordersConstants";

interface Props {
  total: number;
  pendingPayment: number;
  active: number;
  delivered: number;
  revenue: number;
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card p-4 sm:p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-2xl bg-[var(--soft)] flex items-center justify-center shrink-0 text-[var(--mute)]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--mute)] font-semibold uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="font-display font-extrabold text-2xl leading-tight">{value}</p>
        {sub && <p className="text-xs text-[var(--mute)] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function OrdersStats({
  total,
  pendingPayment,
  active,
  delivered,
  revenue,
}: Props) {
  return (
    <section
      className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-5"
      aria-label="Order summary"
    >
      <StatCard
        label="Total Orders"
        value={total}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
            <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
          </svg>
        }
      />
      <StatCard
        label="Pending Payment"
        value={pendingPayment}
        sub="Needs verification"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <rect x={3} y={6} width={18} height={12} rx={2} />
            <path d="M3 10h18" />
          </svg>
        }
      />
      <StatCard
        label="Active Orders"
        value={active}
        sub="In progress"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" />
            <circle cx={7} cy={18} r={1.6} />
            <circle cx={18} cy={18} r={1.6} />
          </svg>
        }
      />
      <StatCard
        label="Delivered"
        value={delivered}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M12 3 4 7v10l8 4 8-4V7z" />
            <path d="m8.5 12 2.5 2.5 4.5-4.5" />
          </svg>
        }
      />
      <StatCard
        label="Revenue"
        value={fmt(revenue)}
        sub="From delivered"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <circle cx={12} cy={12} r={9} />
            <path d="M9 12h6M12 9v6" />
          </svg>
        }
      />
    </section>
  );
}
