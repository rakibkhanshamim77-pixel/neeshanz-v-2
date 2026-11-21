export default function SaleBanner() {
  return (
    <section id="sale" className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 sm:mt-24">
      <div
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-14 text-white"
        style={{ background: "linear-gradient(120deg, #5a1730, #9b2c4a)" }}
      >
        <div className="relative z-10 grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
          {/* Content */}
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-xs sm:text-sm mb-3 sm:mb-4">
              লিমিটেড অফার
            </span>

            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl leading-tight mb-3 sm:mb-4">
              সব টি-শার্টে ৩৫% পর্যন্ত ছাড়
            </h2>

            <p className="text-white/80 text-sm sm:text-base mb-5 sm:mb-6 max-w-md">
              অফার শেষ হওয়ার আগেই আপনার পছন্দের কালার ও সাইজ বেছে নিন।
            </p>

            {/* Countdown */}
            <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-7">
              {[
                { value: "02", label: "দিন" },
                { value: "12", label: "ঘণ্টা" },
                { value: "45", label: "মিনিট" },
                { value: "30", label: "সেকেন্ড" },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="bg-white/15 rounded-xl p-2.5 sm:p-3 min-w-[52px] sm:min-w-16 text-center"
                >
                  <span className="block text-xl sm:text-2xl font-bold">{value}</span>
                  <span className="text-[10px] sm:text-xs text-white/70">{label}</span>
                </div>
              ))}
            </div>

            <a
              href="/shop?onSale=1"
              className="inline-flex h-11 sm:h-12 items-center px-6 sm:px-7 rounded-xl bg-white text-black text-sm sm:text-base font-semibold hover:bg-white/90 transition"
            >
              অফার দেখুন
            </a>
          </div>

          {/* Decorative T-Shirts — hidden on small screens, shown md+ */}
          <div className="hidden sm:block relative h-56 lg:h-72 pointer-events-none">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="absolute left-[4%] top-4 w-40 lg:w-60 -rotate-12 text-rose-200 drop-shadow-xl"
              aria-hidden="true"
            >
              <path d="M16.5 3.5 21 6l-2.5 4-2.5-1.5V21H8V8.5L5.5 10 3 6l4.5-2.5L10 2h4l2.5 1.5Z" />
            </svg>
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="absolute right-[6%] top-10 w-40 lg:w-60 rotate-12 text-black/70 drop-shadow-xl"
              aria-hidden="true"
            >
              <path d="M16.5 3.5 21 6l-2.5 4-2.5-1.5V21H8V8.5L5.5 10 3 6l4.5-2.5L10 2h4l2.5 1.5Z" />
            </svg>
          </div>
        </div>

        {/* Mobile decorative background tees (subtle, behind content) */}
        <div className="sm:hidden pointer-events-none" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="absolute -right-4 -bottom-4 w-36 opacity-10 rotate-12 text-white"
          >
            <path d="M16.5 3.5 21 6l-2.5 4-2.5-1.5V21H8V8.5L5.5 10 3 6l4.5-2.5L10 2h4l2.5 1.5Z" />
          </svg>
        </div>
      </div>
    </section>
  );
}
