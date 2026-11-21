import Link from "next/link";

interface Props {
  page: number;
  totalPages: number;
  buildUrl: (page: number) => string;
}

export default function OrdersPagination({ page, totalPages, buildUrl }: Props) {
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <nav
      className="mt-5 flex items-center justify-center gap-1.5"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link
          href={buildUrl(page - 1)}
          className="pg flex items-center gap-1 px-3 h-9 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-sm hover:bg-[var(--soft)] transition-colors"
          aria-label="Previous page"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M15 6 9 12l6 6" />
          </svg>
          <span className="hidden sm:inline">Prev</span>
        </Link>
      ) : (
        <span className="pg flex items-center gap-1 px-3 h-9 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-sm opacity-40 cursor-not-allowed">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M15 6 9 12l6 6" />
          </svg>
          <span className="hidden sm:inline">Prev</span>
        </span>
      )}

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-[var(--mute)] text-sm select-none">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildUrl(p)}
            aria-current={p === page ? "page" : undefined}
            className={`w-9 h-9 rounded-xl text-sm font-semibold grid place-items-center transition-colors ${
              p === page
                ? "bg-ink text-bg"
                : "border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--soft)]"
            }`}
          >
            {p}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link
          href={buildUrl(page + 1)}
          className="pg flex items-center gap-1 px-3 h-9 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-sm hover:bg-[var(--soft)] transition-colors"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
        </Link>
      ) : (
        <span className="pg flex items-center gap-1 px-3 h-9 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-sm opacity-40 cursor-not-allowed">
          <span className="hidden sm:inline">Next</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
        </span>
      )}
    </nav>
  );
}
