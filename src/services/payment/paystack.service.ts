import axios from "axios";

const PAYSTACK_URL = "https://api.paystack.co";

export class PaystackService {
  private secret: string;

  constructor() {
    this.secret = process.env.PAYSTACK_SECRET_KEY!;
    if (!this.secret) throw new Error("PAYSTACK_SECRET_KEY is not set");
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.secret}`,
      "Content-Type": "application/json",
    };
  }

  async initializePayment(payload: {
    email: string;
    amount: number;
    reference: string;
    metadata?: Record<string, unknown>;
    callback_url?: string;
  }) {
    const { data } = await axios.post(
      `${PAYSTACK_URL}/transaction/initialize`,
      payload,
      { headers: this.headers() }
    );
    return data.data;
  }

  async verifyTransaction(reference: string) {
    const { data } = await axios.get(
      `${PAYSTACK_URL}/transaction/verify/${reference}`,
      { headers: this.headers() }
    );
    return data.data;
  }

  async refundTransaction(reference: string, amount?: number) {
    const { data } = await axios.post(
      `${PAYSTACK_URL}/refund`,
      { transaction: reference, amount },
      { headers: this.headers() }
    );
    return data.data;
  }
}