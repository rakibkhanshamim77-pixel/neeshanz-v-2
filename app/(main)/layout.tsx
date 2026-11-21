import Announcement from "./components/Announcement";
import Footer from "./components/Footer";
import Header from "./components/Header";
import NetworkStatus from "./components/NetworkStatus";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Announcement />
      <Header />
      {children}
      {/* <MobileNav /> */}
      <Footer />
      <NetworkStatus />
    </>
  );
}
