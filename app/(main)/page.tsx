import { Suspense } from "react";
import Categories from "./components/Categories";

import TrustStrip from "./components/TrustStrip";
import HeroSection, { HeroSectionSkeleton } from "./components/HeroSection";
import Products from "./components/products/Products";
import SaleBanner from "./components/salebanner/SaleBanner";
import WhyUs from "./components/whyus/WhyUs";
import Reviews from "./components/reviews/Reviews";
import NewsLetter from "./components/news-letter/NewsLetter";

export default function Home() {
  return (
    <>
      <main className="pb-28 lg:pb-0">
        {/* Hero slider */}
        <Suspense fallback={<HeroSectionSkeleton />}>
          <HeroSection />
        </Suspense>
        {/* Trust strip */}
        <TrustStrip />
        {/* Categories */}
        <Categories />
        {/* Products */}
        <Products />
        {/* Sale banner */}
        <SaleBanner />
        {/* Why us */}
        <WhyUs />
        {/* Reviews */}
        <Reviews />
        {/* Newsletter */}
        <NewsLetter />
      </main>
      {/* Footer */}

      {/* Mobile bottom nav */}
    </>
  );
}
