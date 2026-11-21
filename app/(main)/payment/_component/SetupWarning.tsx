export default function SetupWarning() {
  return (
    <div
      id="setupWarn"
      className="hidden mb-5 rounded-2xl border-2 border-ink p-4 text-sm font-medium"
    >
      ⚠ সাইট মালিকের জন্য: payment.html ফাইলের <code>PAY_NUMBERS</code> অংশে
      আপনার আসল bKash / Nagad / Rocket নম্বর বসান।
    </div>
  );
}
