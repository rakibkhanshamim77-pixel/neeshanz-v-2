import { getUser } from "@/app/utils/getUser";
import CheckoutClient from "./_component/CheckoutClient";

export const metadata = { title: "চেকআউট — Neeshanz" };

export default async function CheckoutPage() {
  const user = await getUser();

  const prefill = user
    ? {
        name: user.name ?? "",
        phone: user.phone ?? "",
        email: user.email ?? "",
      }
    : null;

  return <CheckoutClient prefill={prefill} />;
}
