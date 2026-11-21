// Native <details>/<summary> — works without any client JavaScript.
import ProductSizeChart from "./ProductSizeChart";
import type { ProductDetails } from "./product.types";

interface ProductDetailsAccordionProps {
  product: ProductDetails;
}

function AccordionSummary({ title }: { title: string }) {
  return (
    <summary>
      {title}
      <span className="pm" aria-hidden="true">
        +
      </span>
    </summary>
  );
}

export default function ProductDetailsAccordion({ product }: ProductDetailsAccordionProps) {
  const { highlights, fabric, care, sizeChart } = product;

  return (
    <div className="acc mt-6">
      {highlights.length > 0 && (
        <details open>
          <AccordionSummary title="পণ্যের বিবরণ" />
          <ul className="pb-5 space-y-2 text-[15px] text-mute">
            {highlights.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-ink" aria-hidden="true">
                  —
                </span>
                {item}
              </li>
            ))}
          </ul>
        </details>
      )}

      {(fabric || care) && (
        <details>
          <AccordionSummary title="কাপড় ও যত্ন" />
          <div className="pb-5 text-[15px] text-mute space-y-2">
            {fabric && (
              <p>
                <b className="text-ink">কাপড়:</b> {fabric}
              </p>
            )}
            {care && (
              <p>
                <b className="text-ink">যত্ন:</b> {care}
              </p>
            )}
          </div>
        </details>
      )}

      {sizeChart && sizeChart.rows.length > 0 && (
        <details id="sizeChart" className="scroll-mt-24">
          <AccordionSummary title="সাইজ চার্ট" />
          <ProductSizeChart chart={sizeChart} />
        </details>
      )}

      <details>
        <AccordionSummary title="ডেলিভারি ও এক্সচেঞ্জ" />
        <div className="pb-5 text-[15px] text-mute space-y-2">
          <p>
            ঢাকার ভেতরে ৳৬০ (১–২ কার্যদিবস), ঢাকার বাইরে ৳১২০ (২–৪ কার্যদিবস)। ৳১,৫০০ বা তার বেশি অর্ডারে ডেলিভারি ফ্রি।
          </p>
          <p>সাইজ না মিললে পণ্য হাতে পাওয়ার ৭ দিনের মধ্যে ফ্রি এক্সচেঞ্জ। পণ্য অব্যবহৃত ও ট্যাগসহ থাকতে হবে।</p>
        </div>
      </details>
    </div>
  );
}
