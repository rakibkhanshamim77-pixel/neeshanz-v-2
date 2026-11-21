import type { Metadata } from "next";
import { Bricolage_Grotesque, Noto_Sans_Bengali } from "next/font/google";
import CartProvider from "@/lib/CartProvider";
import ToastProvider from "@/lib/ToastProvider";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bengali",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Neeshanz",
  description: "Premium Clothing Store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <head>
        {/* Apply saved theme before first paint — prevents flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.dataset.theme='dark';else if(t==='light')delete document.documentElement.dataset.theme;}catch(e){}`,
          }}
        />
      </head>
      <body
        className={`${bricolage.variable} ${notoBengali.variable} antialiased bg-bg text-ink`}
      >
        <CartProvider>
          <ToastProvider>{children}</ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
