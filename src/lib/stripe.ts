import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      throw new Error('Stripe publishable key is not set in environment variables');
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  
  return stripePromise;
};

export interface CreatePaymentIntentParams {
  amount: number;
  description: string;
  metadata: Record<string, string>;
}

export interface CreatePaymentMethodParams {
  cardElement: any;
  billingDetails: {
    name: string;
    email: string;
    phone?: string;
    address?: {
      city: string;
      country: string;
      line1: string;
      line2?: string;
      postal_code: string;
      state: string;
    };
  };
}

export interface ConfirmPaymentIntentParams {
  paymentIntentId: string;
  paymentMethodId: string;
}

export async function createPaymentMethod(params: CreatePaymentMethodParams) {
  const stripe = await getStripe();
  if (!stripe) throw new Error('Failed to load Stripe');
  
  const { cardElement, billingDetails } = params;
  
  const result = await stripe.createPaymentMethod({
    type: 'card',
    card: cardElement,
    billing_details: billingDetails,
  });
  
  return result;
} 