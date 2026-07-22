import crypto from "crypto";
import Razorpay from "razorpay";

let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay is not configured — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env");
  }
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export async function createRazorpayOrder(amountInRupees: number, receipt: string) {
  const order = await getClient().orders.create({
    amount: Math.round(amountInRupees * 100),
    currency: "INR",
    receipt,
  });
  return order;
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}
