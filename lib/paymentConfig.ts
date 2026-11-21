export type PaymentMethodId = "bkash" | "nagad" | "rocket";

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  type: "Personal" | "Merchant";
  number: string;
  color: string;
  instructions: string[];
}

export function getPaymentMethods(): PaymentMethod[] {
  const methods: PaymentMethod[] = [];

  if (process.env.PAY_BKASH_NUMBER?.trim()) {
    const number = process.env.PAY_BKASH_NUMBER.trim();
    methods.push({
      id: "bkash",
      name: "bKash",
      type: (process.env.PAY_BKASH_TYPE as "Personal" | "Merchant") ?? "Personal",
      number,
      color: "#E2136E",
      instructions: [
        "আপনার bKash অ্যাপ খুলুন",
        '"Send Money" সিলেক্ট করুন (Payment বা Cash Out নয়)',
        `নম্বরে পাঠান: ${number}`,
        "ঠিক পরিমাণ টাকা দিন — কম বা বেশি দিলে অর্ডার কনফার্ম হতে দেরি হবে",
        "Reference-এ অর্ডার নম্বর লিখুন (ঐচ্ছিক)",
        "Transaction ID সংরক্ষণ করুন এবং নিচে দিন",
      ],
    });
  }

  if (process.env.PAY_NAGAD_NUMBER?.trim()) {
    const number = process.env.PAY_NAGAD_NUMBER.trim();
    methods.push({
      id: "nagad",
      name: "Nagad",
      type: (process.env.PAY_NAGAD_TYPE as "Personal" | "Merchant") ?? "Personal",
      number,
      color: "#F7941D",
      instructions: [
        "আপনার নগদ অ্যাপ খুলুন",
        '"Send Money" সিলেক্ট করুন',
        `নম্বরে পাঠান: ${number}`,
        "ঠিক পরিমাণ টাকা দিন",
        "Transaction ID সংরক্ষণ করুন এবং নিচে দিন",
      ],
    });
  }

  if (process.env.PAY_ROCKET_NUMBER?.trim()) {
    const number = process.env.PAY_ROCKET_NUMBER.trim();
    methods.push({
      id: "rocket",
      name: "Rocket",
      type: (process.env.PAY_ROCKET_TYPE as "Personal" | "Merchant") ?? "Personal",
      number,
      color: "#8B3CA7",
      instructions: [
        "আপনার রকেট অ্যাপ খুলুন",
        '"Send Money" সিলেক্ট করুন',
        `নম্বরে পাঠান: ${number}`,
        "ঠিক পরিমাণ টাকা দিন",
        "Transaction ID সংরক্ষণ করুন এবং নিচে দিন",
      ],
    });
  }

  return methods;
}

export function getPaymentMethod(id: string): PaymentMethod | null {
  return getPaymentMethods().find((m) => m.id === id) ?? null;
}

export function isPaymentConfigured(): boolean {
  return getPaymentMethods().length > 0;
}
