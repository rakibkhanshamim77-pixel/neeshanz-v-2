"use client";

import Link from "next/link";

interface Props {
  title: string;
  subtitle?: string;
  backHref?: string;
  userName?: string;
  userRole?: string;
  actions?: React.ReactNode;
}

export default function AdminTopbar({
  title,
  subtitle,
  backHref,
  userName,
  userRole,
  actions,
}: Props) {
  function toggleMenu() {
    document.body.classList.toggle("menu-open");
  }

  const initials = userName
    ? userName
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AD";

  return (
    <header className="sticky bg-white top-0 z-30 bg-[var(--bg)]/90 backdrop-blur-xl border-b border-[var(--line)]">
      <div className="h-[70px] px-4 sm:px-6 lg:px-8 flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={toggleMenu}
          className="lg:hidden shrink-0 w-9 h-9 rounded-xl border border-[var(--line)] bg-[var(--surface)] grid place-items-center hover:bg-[var(--soft)] transition-colors"
          aria-label="Open sidebar"
        >
          <svg
            className="w-[18px] h-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        {/* Back button (optional) */}
        {backHref && (
          <Link
            href={backHref}
            className="shrink-0 w-9 h-9 rounded-xl border border-[var(--line)] bg-[var(--surface)] grid place-items-center hover:bg-[var(--soft)] transition-colors"
            aria-label="Go back"
          >
            <svg
              className="w-[18px] h-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M15 6 9 12l6 6" />
            </svg>
          </Link>
        )}

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-extrabold text-[1.05rem] leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-[var(--mute)] leading-tight truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>

        {/* Page-specific actions */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* Right: user */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--ink)] text-[var(--bg)] grid place-items-center font-display font-bold text-xs">
              {initials}
            </div>
            <div className="leading-tight hidden md:block">
              <b className="block text-sm">{userName ?? "Admin"}</b>
              <span className="text-xs text-[var(--mute)] capitalize">
                {userRole ?? "admin"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
