"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function matchPath(href: string, pathname: string): boolean {
  const base = href.split("?")[0];
  // Exact match for dashboard root; prefix match for everything else
  if (base === "/admin") return pathname === "/admin";
  return pathname === base || pathname.startsWith(base + "/");
}

export default function AdminSidebarNav() {
  const pathname = usePathname();

  const ordersOpen = pathname.startsWith("/admin/orders");
  const productsOpen =
    pathname.startsWith("/admin/products") ||
    pathname.startsWith("/admin/inventory") ||
    pathname.startsWith("/admin/categories");

  return (
    <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Admin menu">
      {/* Main */}
      <p className="grp">Main</p>

      <Link
        href="/admin"
        aria-current={matchPath("/admin", pathname) ? "page" : undefined}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <rect x={3} y={3} width={7} height={9} rx="1.5" />
          <rect x={14} y={3} width={7} height={5} rx="1.5" />
          <rect x={14} y={12} width={7} height={9} rx="1.5" />
          <rect x={3} y={16} width={7} height={5} rx="1.5" />
        </svg>
        Dashboard
      </Link>

      {/* Orders Dropdown */}
      <details className="nav-dd" data-dd="orders" open={ordersOpen}>
        <summary>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
            <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
          </svg>
          Orders
          <svg
            className="chev w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div className="sub">
          <Link
            href="/admin/orders"
            aria-current={
              pathname === "/admin/orders" ? "page" : undefined
            }
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
            All Orders
            <span className="cnt" id="navOrders">
              14
            </span>
          </Link>
          <Link href="/admin/orders?status=payment_pending">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <rect x={3} y={6} width={18} height={12} rx={2} />
              <path d="M3 10h18" />
            </svg>
            Pending Payments
          </Link>
          <Link href="/admin/orders?status=confirmed">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="m5 12 5 5L20 7" />
            </svg>
            Confirmed Orders
          </Link>
        </div>
      </details>

      {/* Products Dropdown */}
      <details className="nav-dd" data-dd="products" open={productsOpen}>
        <summary>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path d="M8 4 3 7l2 5 3-1v9h8v-9l3 1 2-5-5-3c-.7 2-2 3-4 3S8.7 6 8 4Z" />
          </svg>
          Products
          <svg
            className="chev w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div className="sub">
          <Link
            href="/admin/products"
            aria-current={
              matchPath("/admin/products", pathname) ? "page" : undefined
            }
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
            Product List
            <span className="cnt">24</span>
          </Link>
          <Link
            href="/admin/products/create"
            aria-current={
              matchPath("/admin/products/create", pathname) ? "page" : undefined
            }
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create Product
          </Link>
          <Link
            href="/admin/inventory?filter=low-stock"
            aria-current={
              matchPath("/admin/inventory", pathname) ? "page" : undefined
            }
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
            </svg>
            Low Stock
          </Link>
          <Link
            href="/admin/categories"
            aria-current={
              matchPath("/admin/categories", pathname) ? "page" : undefined
            }
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <rect x={3} y={3} width={8} height={8} rx={1} />
              <rect x={13} y={3} width={8} height={8} rx={1} />
              <rect x={3} y={13} width={8} height={8} rx={1} />
              <rect x={13} y={13} width={8} height={8} rx={1} />
            </svg>
            Categories
          </Link>
        </div>
      </details>

      {/* Customers */}
      <Link
        href="/admin/customers"
        aria-current={
          matchPath("/admin/customers", pathname) ? "page" : undefined
        }
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <circle cx={9} cy={8} r="3.5" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" />
        </svg>
        Customers
      </Link>

      {/* Engage */}
      <p className="grp">Engage</p>
      <Link
        href="/admin/messages"
        aria-current={
          matchPath("/admin/messages", pathname) ? "page" : undefined
        }
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
        </svg>
        Messages
        <span className="cnt" id="navMsg">
          4
        </span>
      </Link>
      <Link
        href="/admin/reviews"
        aria-current={
          matchPath("/admin/reviews", pathname) ? "page" : undefined
        }
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path d="m12 3 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.4l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" />
        </svg>
        Reviews
      </Link>

      {/* System */}
      <p className="grp">System</p>
      <Link
        href="/admin/coupons"
        aria-current={
          matchPath("/admin/coupons", pathname) ? "page" : undefined
        }
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path d="M3 9V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3a3 3 0 0 0 0 6v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a3 3 0 0 0 0-6Z" />
          <path d="M14 5v14" strokeDasharray="2 2" />
        </svg>
        Coupons
      </Link>
      <Link
        href="/admin/settings"
        aria-current={
          matchPath("/admin/settings", pathname) ? "page" : undefined
        }
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <circle cx={12} cy={12} r={3} />
          <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
        </svg>
        Settings
      </Link>
    </nav>
  );
}
